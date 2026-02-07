import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json({ limit: "15mb" }));

const PORT = process.env.PORT || 3000;
const FASHION_API_KEY = process.env.FASHION_API_KEY;
const FASHION_AI_ENDPOINT = process.env.FASHION_AI_ENDPOINT;

if (!FASHION_API_KEY) {
  console.error("❌ FASHION_API_KEY missing");
  process.exit(1);
}

app.post("/tryon", async (req, res) => {
  try {
    const { userImage, productImage } = req.body;

    if (!userImage || !productImage) {
      return res.status(400).json({ error: "Missing images" });
    }

    console.log("--- Sending Request to Fashn.ai (v1.6) ---");

    // 🔥 FINAL FIX: Based on your latest error logs
    const aiResponse = await fetch(FASHION_AI_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FASHION_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model_name: "tryon-v1.6", 
        inputs: {
          model_image: userImage,     // Fixed: 'person_image' is now 'model_image'
          garment_image: productImage,
          category: "tops"            // Required category
        },
        output_format: "png"
      })
    });

    const aiData = await aiResponse.json();

    if (!aiResponse.ok) {
      console.error("❌ FASHN.AI API Error:", aiData);
      throw new Error(JSON.stringify(aiData));
    }

    console.log("✅ AI Success! Data received.");

    // Handling different response formats
    const resultUrl = aiData.image || aiData.output || (aiData.output && aiData.output[0]);

    if (!resultUrl) {
        throw new Error("Result image not found in AI response");
    }

    return res.json({
      success: true,
      resultImage: resultUrl
    });

  } catch (err) {
    console.error("❌ BACKEND ERROR:", err.message);
    return res.status(500).json({
      error: "AI processing failed",
      details: err.message
    });
  }
});

app.get("/", (req, res) => {
  res.send("✅ Backend is Ready for v1.6");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
