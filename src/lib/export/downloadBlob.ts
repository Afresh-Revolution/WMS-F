import { getAccessToken } from "@/lib/api/client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function downloadApiBlob(path: string, filename: string) {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    const message = response.statusText || "Export failed";
    throw new Error(message);
  }
  const blob = await response.blob();
  downloadBlob(blob, filename);
}
