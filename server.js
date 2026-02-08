import express from "express";
import cors from "cors";
import fetch from "node-fetch";
// Import store access logic
import { isStoreAllowed } from "./allowedstore.js"; 

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const FASHION_API_KEY = "YOUR_API_KEY_HERE";
const FASHION_AI_ENDPOINT = "https://api.fashn.ai/v1/run";

const jobs = {};

// 1. Root route for health check
app.get("/", (req, res) => res.send("Server is running!"));

// 2. Try-On Start Route
app.post("/tryon/start", async (req, res) => {
  try {
    // 🔴 STORE ACCESS CHECK
    const storeUrl = req.headers.origin || req.headers.referer || req.body.storeUrl;

    if (!isStoreAllowed(storeUrl)) {
      return res.status(403).json({
        disabled: true,
        message: "Virtual Try-On trial expired or store not authorized. Please contact support."
      });
    }

    const { userImage, productImage, category } = req.body;
    if (!userImage || !productImage) 
      return res.status(400).json({ error: "Missing images" });

    const jobId = Date.now().toString();
    jobs[jobId] = { status: "pending", resultUrl: null };

    // Background Processing
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
        if (!startData.id) throw new Error(startData.message || "API ID missing");

        const predictionId = startData.id;
        let resultUrl = null;
        let attempts = 0;

        while (attempts < 40 && !resultUrl) {
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

// 3. Status Check Route
app.get("/tryon/status/:jobId", (req, res) => {
  const job = jobs[req.params.jobId];
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json(job);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
