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
    
    // Start AI Process
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
    if (!startData.id) throw new Error(startData.message || "API Error");

    const predictionId = startData.id;
    let resultUrl = null;
    let attempts = 0;

    // ⚡ FAST POLLING: Every 3 seconds check
    while (attempts < 25 && !resultUrl) {
        await new Promise(r => setTimeout(r, 3000)); 
        
        const checkRes = await fetch(`https://api.fashn.ai/v1/status/${predictionId}`, {
            headers: { "Authorization": `Bearer ${FASHION_API_KEY}` }
        });
        
        const statusData = await checkRes.json();
        console.log(`Checking Status... Attempt ${attempts + 1}: ${statusData.status}`);

        if (statusData.status === "completed") {
            resultUrl = Array.isArray(statusData.output) ? statusData.output[0] : statusData.output;
            break; 
        } else if (statusData.status === "failed") {
            throw new Error("AI could not generate image");
        }
        attempts++;
    }

    if (!resultUrl) throw new Error("AI Timeout");
    return res.json({ success: true, resultImage: resultUrl });

  } catch (err) {
    console.error("❌ ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, "0.0.0.0");
