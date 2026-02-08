// storeAccess.js logic

export const STORE_ACCESS = [
  {
    url: "34ssyd-13.myshopify.com", // 👈 Bilkul saaf domain
    expiresAt: "2026-02-15", 
    status: "trial"
  },
  {
    url: "paid-store.com",
    expiresAt: null, 
    status: "paid"
  }
];

function normalizeUrl(url) {
  if (!url) return "";
  return url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "")
    .split('/')[0] // Path nikalne ke liye
    .toLowerCase();
}

export function isStoreAllowed(storeUrl) {
  if (!storeUrl) return false;

  const today = new Date().toISOString().split("T")[0];
  const normalized = normalizeUrl(storeUrl);

  const store = STORE_ACCESS.find(
    s => normalizeUrl(s.url) === normalized
  );

  if (!store) return false;
  if (store.status === "paid") return true;
  if (store.expiresAt && today <= store.expiresAt) return true;

  return false;
}
