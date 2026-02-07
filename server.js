import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" }));

const PORT = process.env.PORT || 8080;
const FASHION_API_KEY = process.env.FASHION_API_KEY;
const FASHION_AI_ENDPOINT = process.env.FASHION_AI_ENDPOINT;

app.post("/tryon", async (req, res) => {
  try {
    const { userImage, productImage, category } = req.body; 
    console.log(`--- Request Start: [Category: ${category || 'tops'}] ---`);

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
          category: category || "tops" // Sirf zaroori parameters
        }
      })
    });

    const startData = await response.json();
    
    if (!startData.id) {
        console.error("❌ API Response Error:", startData);
        throw new Error(startData.message || "API could not start process");
    }

    const predictionId = startData.id;
    let resultUrl = null;
    let attempts = 0;

    while (attempts < 20 && !resultUrl) {
        await new Promise(r => setTimeout(r, 3000)); 
        const checkRes = await fetch(`https://api.fashn.ai/v1/status/${predictionId}`, {
            headers: { "Authorization": `Bearer ${FASHION_API_KEY}` }
        });
        const statusData = await checkRes.json();
        
        if (statusData.status === "completed") {
            resultUrl = Array.isArray(statusData.output) ? statusData.output[0] : statusData.output;
        } else if (statusData.status === "failed") {
            throw new Error("AI Processing failed");
        }
        attempts++;
    }

    if (!resultUrl) throw new Error("Processing timed out");
    return res.json({ success: true, resultImage: resultUrl });

  } catch (err) {
    console.error("❌ SERVER ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, "0.0.0.0");
