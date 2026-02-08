export const STORE_ACCESS = [
  {
    url: "34ssyd-13.myshopify.com", 
    expiresAt: "2026-02-15", 
    status: "trial"
  },
  {
    url: "admin.shopify.com", // 🔴 Is se preview mode chal jayega
    expiresAt: "2026-12-31",
    status: "trial"
  }
];

function normalizeUrl(url) {
  if (!url) return "";
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "").split('/')[0].toLowerCase();
}

export function isStoreAllowed(storeUrl) {
  if (!storeUrl) return false;
  const today = new Date().toISOString().split("T")[0];
  const normalized = normalizeUrl(storeUrl);
  const store = STORE_ACCESS.find(s => normalizeUrl(s.url) === normalized);
  if (!store) return false;
  if (store.status === "paid") return true;
  return store.expiresAt && today <= store.expiresAt;
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

