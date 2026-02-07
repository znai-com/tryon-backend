import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" })); // Limit increased for high-res images

const PORT = process.env.PORT || 8080;
const FASHION_API_KEY = process.env.FASHION_API_KEY;
const FASHION_AI_ENDPOINT = process.env.FASHION_AI_ENDPOINT;

app.post("/tryon", async (req, res) => {
  try {
    const { userImage, productImage, category } = req.body; 
    console.log(`--- Starting AI Process [Category: ${category || 'tops'}] ---`);

    const response = await fetch(FASHION_AI_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FASHION_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model_name: "tryon-max", // 🚀 Max model for better tracksuit/full-body fit
        inputs: { 
          model_image: userImage, 
          garment_image: productImage, 
          category: category || "tops",
          garment_placeholder: (category === "one-pieces") ? "overall" : "top" // Helps AI align tracksuits
        },
        output_format: "png"
      })
    });

    const startData = await response.json();
    if (!startData.id) {
        throw new Error("API did not return a process ID");
    }

    const predictionId = startData.id;
    let resultUrl = null;
    let attempts = 0;
    const maxAttempts = 25; // Extra time for high-quality 'max' model

    while (attempts < maxAttempts && !resultUrl) {
        await new Promise(resolve => setTimeout(resolve, 3000)); 
        const checkRes = await fetch(`https://api.fashn.ai/v1/status/${predictionId}`, {
            headers: { "Authorization": `Bearer ${FASHION_API_KEY}` }
        });
        const statusData = await checkRes.json();
        console.log(`Step ${attempts + 1}: ${statusData.status}`);

        if (statusData.status === "completed" || statusData.output) {
            resultUrl = Array.isArray(statusData.output) ? statusData.output[0] : statusData.output;
        } else if (statusData.status === "failed") {
            throw new Error("AI failed to generate image");
        }
        attempts++;
    }

    if (!resultUrl) throw new Error("Processing timed out");
    return res.json({ success: true, resultImage: resultUrl });

  } catch (err) {
    console.error("❌ BACKEND ERROR:", err.message);
    return res.status(500).json({ error: "Try-on failed", details: err.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
