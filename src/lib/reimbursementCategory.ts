const CATEGORY_HINTS: Array<[RegExp, string]> = [
  [/taxi|uber|bolt|bus|fare|transport|fuel|petrol|cab/i, "Transport"],
  [/travel|flight|hotel|lodging|mileage|trip/i, "Travel"],
  [/lunch|meal|food|dinner|breakfast|client/i, "Meals"],
  [/train|course|workshop|seminar/i, "Training"],
  [/laptop|monitor|equipment|device/i, "Equipment"],
  [/paper|supply|stationery|printer/i, "Office Supplies"],
  [/airtime|data|phone|internet|call/i, "Communication"],
];

export const EXPENSE_CATEGORY_NAMES = [
  "Travel",
  "Transport",
  "Meals",
  "Training",
  "Equipment",
  "Office Supplies",
  "Communication",
  "Other",
] as const;

export function inferReimbursementCategory(purpose: string) {
  const text = purpose.trim();
  for (const [pattern, name] of CATEGORY_HINTS) {
    if (pattern.test(text)) return name;
  }
  return "Travel";
}
