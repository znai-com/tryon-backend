import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import { isStoreAllowed } from "./storeAccess.js";

const app = express();

// --- DYNAMIC CORS START ---
// Ye code Railway Dashboard ke "ALLOWED_STORES" variable se URLs uthayega
const allowedOrigins = process.env.ALLOWED_STORES 
  ? process.env.ALLOWED_STORES.split(',').map(url => url.trim()) 
  : [];

app.use(cors({
  origin: function (origin, callback) {
    // 1. Agar request Localhost se ho (development ke liye)
    // 2. Agar request server-to-server ho (!origin)
    // 3. Agar store ka URL allowedOrigins list mein ho
    if (!origin || allowedOrigins.includes(origin) || origin.includes("localhost")) {
      callback(null, true);
    } else {
      console.error(`Blocked by CORS: ${origin}`);
      callback(new Error('CORS Policy: This store is not authorized!'));
    }
  }
}));
// --- DYNAMIC CORS END ---

app.use(express.json({ limit: "25mb" })); 

const PORT = process.env.PORT || 8080;
const FASHION_API_KEY = process.env.FASHION_API_KEY;
const FASHION_AI_ENDPOINT = process.env.FASHION_AI_ENDPOINT;

const jobs = {}; 

app.get("/", (req, res) => {
  res.send("Server is running perfectly! 🚀 Authorized Stores: " + allowedOrigins.join(", "));
});

app.post("/tryon/start", async (req, res) => {
  try {
    const { userImage, productImage, category } = req.body;

    if (!userImage || !productImage) 
      return res.status(400).json({ error: "Missing images" });

    const jobId = Date.now().toString();
    jobs[jobId] = { status: "pending", resultUrl: null };

    (async () => {
      try {
        const response = await fetch(FASHION_AI_ENDPOINT, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${FASHION_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model_name: "tryon-v1.6",
            inputs: {
              model_image: userImage,
              garment_image: productImage,
              category: category || "tops"
            }
          })
        });

        const startData = await response.json();
        
        if (!startData.id) {
          console.error("API Error Details:", startData);
          throw new Error(startData.message || "API ID missing");
        }

        const predictionId = startData.id;
        let resultUrl = null;
        let attempts = 0;

        while (attempts < 30 && !resultUrl) {
          await new Promise(r => setTimeout(r, 3000));
          const checkRes = await fetch(`https://api.fashn.ai/v1/status/${predictionId}`, {
            headers: { "Authorization": `Bearer ${FASHION_API_KEY}` }
          });
          const statusData = await checkRes.json();
          
          if (statusData.status === "completed") {
            resultUrl = Array.isArray(statusData.output) ? statusData.output[0] : statusData.output;
            break;
          } else if (statusData.status === "failed") {
            throw new Error("AI Processing failed");
          }
          attempts++;
        }

        if (resultUrl) {
          jobs[jobId].status = "completed";
          jobs[jobId].resultUrl = resultUrl;
        } else {
          throw new Error("Timeout");
        }

      } catch (err) {
        console.error("❌ Job Error:", err.message);
        if (jobs[jobId]) jobs[jobId].status = "failed";
      }
    })();

    return res.json({ jobId });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/tryon/status/:jobId", (req, res) => {
  const { jobId } = req.params;
  if (!jobs[jobId]) return res.status(404).json({ error: "Job not found" });
  return res.json(jobs[jobId]);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

