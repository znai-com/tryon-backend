// storeAccess.js

export const STORE_ACCESS = [
  {
    url: "example-store.com",
    expiresAt: "2026-02-15", // trial
    status: "trial"
  },
  {
    url: "paid-store.com",
    expiresAt: null, // lifetime
    status: "paid"
  }
];

function normalizeUrl(url) {
  if (!url) return "";
  return url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "")
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
