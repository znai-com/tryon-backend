export const STORE_ACCESS = [
  {
    url: "34ssyd-13.myshopify.com", 
    expiresAt: "2026-02-10", 
    status: "trial"
  },
  {
    url: "admin.shopify.com", // Preview mode ke liye
    expiresAt: "2026-02-10",
    status: "trial"
  }
];

function normalizeUrl(url) {
  if (!url) return "";
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "").split('/')[0].toLowerCase();
}

// 🔴 Isay sirf EK baar rehne den
export function isStoreAllowed(storeUrl) {
  if (!storeUrl) return false;
  const today = new Date().toISOString().split("T")[0];
  const normalized = normalizeUrl(storeUrl);
  const store = STORE_ACCESS.find(s => normalizeUrl(s.url) === normalized);
  
  if (!store) return false;
  if (store.status === "paid") return true;
  return store.expiresAt && today <= store.expiresAt;
}


