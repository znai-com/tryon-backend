import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" })); // compress if needed

const PORT = process.env.PORT || 8080;
const FASHION_API_KEY = process.env.FASHION_API_KEY;
const FASHION_AI_ENDPOINT = process.env.FASHION_AI_ENDPOINT;

// 🔹 In-memory job store (simple queue)
const jobs = {}; // { jobId: { status, resultUrl } }

app.post("/tryon/start", async (req, res) => {
  try {
    const { userImage, productImage, category } = req.body;

    if (!userImage || !productImage) 
      return res.status(400).json({ error: "Missing images" });

    const jobId = uuidv4();
    jobs[jobId] = { status: "pending", resultUrl: null };

    // Start async AI job without blocking
    (async () => {
      try {
        // Optional: add pose hint for better fit
        const payload = {
          model_name: "tryon-v1.6",
          inputs: {
            model_image: userImage,
            garment_image: productImage,
            category: category || "tops",
            pose_hint: true // new param for better fit
          }
        };

        const startRes = await fetch(FASHION_AI_ENDPOINT, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${FASHION_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const startData = await startRes.json();
        if (!startData.id) throw new Error(startData.message || "API Error");

        const predictionId = startData.id;
        let attempts = 0, resultUrl = null;

        while (attempts < 25 && !resultUrl) {
          await new Promise(r => setTimeout(r, 3000));
          const statusRes = await fetch(`https://api.fashn.ai/v1/status/${predictionId}`, {
            headers: { "Authorization": `Bearer ${FASHION_API_KEY}` }
          });
          const statusData = await statusRes.json();
          if (statusData.status === "completed") {
            resultUrl = Array.isArray(statusData.output) ? statusData.output[0] : statusData.output;
            break;
          } else if (statusData.status === "failed") {
            throw new Error("AI could not generate image");
          }
          attempts++;
        }

        if (!resultUrl) throw new Error("AI Timeout");
        jobs[jobId].status = "completed";
        jobs[jobId].resultUrl = resultUrl;

      } catch (err) {
        console.error("❌ Job Error:", err.message);
        jobs[jobId].status = "failed";
        jobs[jobId].resultUrl = null;
      }
    })();

    return res.json({ jobId });

  } catch (err) {
    console.error("❌ ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.get("/tryon/status/:jobId", (req, res) => {
  const { jobId } = req.params;
  if (!jobs[jobId]) return res.status(404).json({ error: "Job not found" });
  return res.json(jobs[jobId]);
});

app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
