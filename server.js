import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" })); 

const PORT = process.env.PORT || 8080;
const FASHION_API_KEY = process.env.FASHION_API_KEY;
const FASHION_AI_ENDPOINT = process.env.FASHION_AI_ENDPOINT;

const jobs = {}; 

app.post("/tryon/start", async (req, res) => {
  try {
    const { userImage, productImage, category } = req.body;

    if (!userImage || !productImage) 
      return res.status(400).json({ error: "Missing images" });

    // UUID ki jagah simple ID generator
    const jobId = Date.now().toString();
    jobs[jobId] = { status: "pending", resultUrl: null };

    // Async Job logic
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
              // pose_hint remove kar diya kyunki ye v1.6 mein error de raha hai
            }
          })
        });

        const startData = await response.json();
        if (!startData.id) throw new Error(startData.message || "API ID missing");

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
        jobs[jobId].status = "failed";
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

app.listen(PORT, "0.0.0.0");
