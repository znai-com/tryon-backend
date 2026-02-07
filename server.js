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

    // 🔥 FIXED: Updated model_name to tryon-v1.6 and added category
    const aiResponse = await fetch(FASHION_AI_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FASHION_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model_name: "tryon-v1.6", // 'virtual-tryon' was invalid
        inputs: {
          person_image: userImage,
          garment_image: productImage,
          garment_placeholder: "top", // Added for better AI detection
          category: "tops" // Specified for the Gucci shirt
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

    // Checking all possible output keys from fashn.ai
    const resultUrl = aiData.image || aiData.output || aiData.result_image || (aiData.output && aiData.output[0]);

    if (!resultUrl) {
        console.error("❌ Unexpected Response Format:", aiData);
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
  res.send("✅ Fashn.ai Try-On Backend is LIVE & Optimized for v1.6");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
