import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors({
  origin: "*"
}));

app.use(express.json({ limit: "15mb" }));

const PORT = process.env.PORT || 3000;
const FASHION_API_KEY = process.env.FASHION_API_KEY;

/* ================= HEALTH CHECK ================= */
app.get("/", (req, res) => {
  res.send("✅ Try-On Backend is LIVE (Fashion.ai ready)");
});

/* ================= TRY-ON API ================= */
app.post("/tryon", async (req, res) => {
  try {
    const { userImage, productImage } = req.body;

    if (!userImage || !productImage) {
      return res.status(400).json({ error: "Images missing" });
    }

    if (!FASHION_API_KEY) {
      return res.status(500).json({ error: "API key not configured" });
    }

    /* ===== CALL FASHION.AI ===== */
    const response = await fetch("https://api.fashion.ai/tryon", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FASHION_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model_image: userImage,     // user uploaded photo (base64 or URL)
        garment_image: productImage // product image auto detected
      })
    });

    const data = await response.json();

    if (!response.ok || !data?.result_image) {
      console.error("Fashion AI Error:", data);
      return res.status(500).json({ error: "AI processing failed" });
    }

    /* ===== SUCCESS ===== */
    res.json({
      success: true,
      resultImage: data.result_image
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: "Server crashed" });
  }
});

/* ================= START SERVER ================= */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
