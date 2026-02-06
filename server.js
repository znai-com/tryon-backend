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

/**
 * POST /tryon
 * body: {
 *   userImage: base64,
 *   productImage: base64
 * }
 */
app.post("/tryon", async (req, res) => {
  try {
    const { userImage, productImage } = req.body;

    if (!userImage || !productImage) {
      return res.status(400).json({ error: "Missing images" });
    }

    // 🔥 REAL FASHION.AI CALL
    const aiResponse = await fetch(FASHION_AI_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FASHION_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "virtual-tryon",
        inputs: {
          person_image: userImage,
          garment_image: productImage
        },
        output_format: "base64"
      })
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(errText);
    }

    const aiData = await aiResponse.json();

    /**
     * Expected Fashion.ai response:
     * {
     *   result_image: "base64..."
     * }
     */

    return res.json({
      success: true,
      resultImage: aiData.result_image
    });

  } catch (err) {
    console.error("❌ AI ERROR:", err.message);
    return res.status(500).json({
      error: "AI processing failed"
    });
  }
});

// Health check
app.get("/", (req, res) => {
  res.send("✅ Fashion.ai Try-On Backend is LIVE");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
