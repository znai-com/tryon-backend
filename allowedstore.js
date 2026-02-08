// allowedstore.js

export function isStoreAllowed(storeUrl) {
  if (!storeUrl) return false;

  // Railway se "STORES_DATA" naam ka variable uthayega
  const storesDataRaw = process.env.STORES_DATA || "[]";
  let storesList = [];

  try {
    storesList = JSON.parse(storesDataRaw);
  } catch (e) {
    console.error("Invalid JSON in STORES_DATA variable");
    return false;
  }

  const today = new Date().toISOString().split("T")[0];
  
  // URL saaf karne ka logic
  const cleanUrl = storeUrl.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "").split('/')[0].toLowerCase();

  const store = storesList.find(s => {
    const entryUrl = s.url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "").split('/')[0].toLowerCase();
    return entryUrl === cleanUrl;
  });

  if (!store) return false;
  if (store.status === "paid") return true;
  return store.expiresAt && today <= store.expiresAt;
}
