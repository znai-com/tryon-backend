import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
// Image data base64 mein bari hoti hai, isliye limit 15mb sahi hai
app.use(express.json({ limit: "15mb" }));

const PORT = process.env.PORT || 3000;
const FASHION_API_KEY = process.env.FASHION_API_KEY;
const FASHION_AI_ENDPOINT = process.env.FASHION_AI_ENDPOINT;

if (!FASHION_API_KEY) {
  console.error("❌ FASHION_API_KEY missing");
  process.exit(1);
}

/**
 * POST /tryon
 * Frontend se base64 images yahan aayengi
 */
app.post("/tryon", async (req, res) => {
  try {
    const { userImage, productImage } = req.body;

    if (!userImage || !productImage) {
      return res.status(400).json({ error: "Missing images" });
    }

    console.log("--- Sending Request to Fashn.ai ---");

    // 🔥 UPDATED CALL: Fixed for fashn.ai v1/run
    const aiResponse = await fetch(FASHION_AI_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FASHION_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model_name: "virtual-tryon", // 'model' ko 'model_name' kar diya (Error Fix)
        inputs: {
          person_image: userImage,
          garment_image: productImage
        },
        output_format: "png" // base64 ke bajaye png format behtar hai
      })
    });

    const aiData = await aiResponse.json();

    if (!aiResponse.ok) {
      console.error("❌ FASHN.AI API Error:", aiData);
      throw new Error(JSON.stringify(aiData));
    }

    console.log("✅ AI Success! Data received.");

    /**
     * Fashn.ai ka naya response aksar 'image' ya 'output_url' key mein hota hai
     */
    const resultUrl = aiData.image || aiData.output || aiData.result_image || aiData.output_url;

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

// Health check
app.get("/", (req, res) => {
  res.send("✅ Fashn.ai Try-On Backend is LIVE & Updated");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
