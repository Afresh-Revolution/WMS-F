import { resolveApiRoot } from "@/lib/api/proxy";
import { asRecord, unwrapList } from "@/lib/api/types";
import { inferReimbursementCategory } from "@/lib/reimbursementCategory";

function backendUrl(path: string, search = "") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${resolveApiRoot()}/api/v1${normalized}${search}`;
}

async function backendJson(
  request: Request,
  path: string,
  init: RequestInit = {},
) {
  const headers = new Headers(init.headers);
  const auth = request.headers.get("authorization");
  if (auth) headers.set("authorization", auth);
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const search = init.method && init.method !== "GET"
    ? ""
    : new URL(request.url).search;
  const response = await fetch(backendUrl(path, search), {
    ...init,
    headers,
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  return { response, payload };
}

function categoryRows(payload: unknown): Record<string, unknown>[] {
  const seen = new Set<string>();
  const rows: Record<string, unknown>[] = [];

  function push(row: Record<string, unknown>) {
    const key = String(row.id ?? row._id ?? row.categoryId ?? row.name ?? row.label ?? "");
    if (!key || seen.has(key)) return;
    seen.add(key);
    rows.push(row);
  }

  function walk(value: unknown, depth = 0) {
    if (!value || depth > 4) return;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === "object" && !Array.isArray(item)) {
          const row = item as Record<string, unknown>;
          if (row.name || row.label || row.title || row.code || row.categoryId) {
            push(row);
          }
        }
        walk(item, depth + 1);
      }
      return;
    }
    if (typeof value !== "object") return;
    const record = value as Record<string, unknown>;
    for (const key of [
      "expenseCategories",
      "expense_categories",
      "categories",
      "catalog",
      "options",
      "items",
      "data",
    ]) {
      if (record[key] !== undefined) walk(record[key], depth + 1);
    }
  }

  walk(payload);
  for (const row of unwrapList<Record<string, unknown>>(payload)) {
    if (row && typeof row === "object" && !Array.isArray(row)) push(row);
  }
  return rows;
}

function categoryFields(row: Record<string, unknown> | null, fallback: string) {
  const name = String(
    row?.name ?? row?.label ?? row?.title ?? row?.code ?? fallback,
  );
  const id = String(row?.id ?? row?._id ?? row?.categoryId ?? row?.category_id ?? "");
  return {
    category: name,
    categoryName: name,
    categoryCode: String(row?.code ?? name).toUpperCase(),
    ...(id ? { categoryId: id, category_id: id, expenseCategoryId: id } : {}),
  };
}

function matchCategory(
  rows: Record<string, unknown>[],
  wanted: string,
) {
  const needle = wanted.toLowerCase();
  return (
    rows.find((row) => {
      const label = String(
        row.name ?? row.label ?? row.title ?? row.code ?? "",
      ).toLowerCase();
      return label === needle;
    }) ??
    rows.find((row) => {
      const label = String(
        row.name ?? row.label ?? row.title ?? row.code ?? "",
      ).toLowerCase();
      return label.includes(needle) || needle.includes(label);
    })
  );
}

async function loadCategoryCatalog(request: Request) {
  const catalogs = ["/lookups", "/employee/expenses"];
  const rows: Record<string, unknown>[] = [];
  const results = await Promise.all(
    catalogs.map((path) => backendJson(request, path, { method: "GET" })),
  );
  for (const { response, payload } of results) {
    if (!response.ok) continue;
    rows.push(...categoryRows(payload));
    for (const expense of unwrapList<Record<string, unknown>>(payload)) {
      const name = String(expense.categoryName ?? expense.category ?? "").trim();
      const id = String(expense.categoryId ?? expense.category_id ?? "").trim();
      if (!name && !id) continue;
      rows.push({
        name: name || "Travel",
        id,
        categoryId: id,
      });
    }
  }
  return rows;
}

export async function resolveExpenseCategory(
  request: Request,
  purpose: string,
) {
  const wanted = inferReimbursementCategory(purpose);
  const catalog = await loadCategoryCatalog(request);
  const match =
    matchCategory(catalog, wanted) ??
    matchCategory(catalog, "Travel") ??
    catalog[0] ??
    null;
  return categoryFields(match, wanted);
}

function isMissingCategory(status: number, payload: unknown) {
  if (status === 404 || status === 400) {
    return /category/i.test(JSON.stringify(payload ?? ""));
  }
  return false;
}

function isMissingRoute(status: number) {
  return status === 404 || status === 405;
}

export async function createReimbursementClaim(
  request: Request,
  body: Record<string, unknown>,
) {
  const purpose = String(body.purpose ?? body.description ?? "").trim();
  const amount = Number(body.amount);
  if (!purpose) {
    return Response.json(
      { error: { code: "PURPOSE_REQUIRED", message: "Enter a purpose." } },
      { status: 400 },
    );
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return Response.json(
      { error: { code: "AMOUNT_REQUIRED", message: "Enter a valid amount." } },
      { status: 400 },
    );
  }

  const resolved = await resolveExpenseCategory(request, purpose);
  const fallbackName =
    resolved.category === "Travel" ? "Transport" : "Travel";
  const variants = [
    resolved,
    categoryFields(null, String(body.category ?? inferReimbursementCategory(purpose))),
    categoryFields(null, fallbackName),
  ].filter(
    (item, index, all) =>
      all.findIndex((entry) => entry.category === item.category) === index,
  );

  const attempts = ["/employee/expenses", "/employee/reimbursements"];

  let lastPayload: unknown = null;
  let lastStatus = 502;

  for (const category of variants) {
    const payload = {
      ...body,
      ...category,
      purpose,
      description: String(body.description ?? purpose),
      amount,
      currency: body.currency ?? "NGN",
      claimType: "reimbursement",
      type: "reimbursement",
      reimbursement: true,
    };

    for (const path of attempts) {
      const { response, payload: result } = await backendJson(request, path, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      lastPayload = result;
      lastStatus = response.status;
      if (response.ok) {
        return Response.json(result ?? { data: payload }, {
          status: response.status,
        });
      }
      if (isMissingCategory(response.status, result)) continue;
      if (isMissingRoute(response.status)) continue;
      return Response.json(result ?? { error: "Claim could not be submitted." }, {
        status: response.status,
      });
    }
  }

  return Response.json(
    lastPayload ?? { error: "Reimbursement claim API was not found." },
    { status: lastStatus },
  );
}

function reimbursementLike(row: Record<string, unknown>) {
  const type = String(row.claimType ?? row.type ?? "").toLowerCase();
  const status = String(
    row.reimbursementStatus ?? row.reimbursement_status ?? "",
  ).toLowerCase();
  return (
    row.reimbursement === true ||
    type.includes("reimburse") ||
    Boolean(status && status !== "not_required")
  );
}

function rowKey(row: Record<string, unknown>) {
  return String(row.id ?? row._id ?? row.reference ?? row.ref ?? "");
}

export async function listReimbursementClaims(request: Request) {
  const [claims, expenses] = await Promise.all([
    backendJson(request, "/employee/reimbursements"),
    backendJson(request, "/employee/expenses"),
  ]);

  if (
    !claims.response.ok &&
    !isMissingRoute(claims.response.status)
  ) {
    return Response.json(
      claims.payload ?? { error: "Claims could not be loaded." },
      { status: claims.response.status },
    );
  }

  const claimRows = claims.response.ok
    ? unwrapList<Record<string, unknown>>(claims.payload)
    : [];
  const expenseRows = expenses.response.ok
    ? unwrapList<Record<string, unknown>>(expenses.payload).filter((row) =>
        claimRows.length === 0 ? true : reimbursementLike(row),
      )
    : [];

  const seen = new Set<string>();
  const merged: Record<string, unknown>[] = [];
  for (const row of [...claimRows, ...expenseRows]) {
    const key = rowKey(row);
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    merged.push(row);
  }

  if (claims.response.ok && claimRows.length > 0 && expenseRows.length === 0) {
    return Response.json(claims.payload, { status: 200 });
  }

  return Response.json({ data: merged }, { status: 200 });
}
