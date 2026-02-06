import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

/* ===== HEALTH CHECK ===== */
app.get("/", (req, res) => {
  res.send("Try-On Backend is running ✅");
});

/* ===== MAIN TRYON API ===== */
app.post("/tryon", async (req, res) => {
  try {
    const { userImage, productImage } = req.body;

    if (!userImage || !productImage) {
      return res.status(400).json({ error: "Missing images" });
    }

    /* ===== FASHION.AI API CALL ===== */
    const response = await fetch("https://api.fashion.ai/tryon", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.FASHION_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_image: userImage,
        product_image: productImage
      })
    });

    const data = await response.json();

    if (!data || !data.result_image) {
      throw new Error("Invalid AI response");
    }

    res.json({
      success: true,
      resultImage: data.result_image
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI processing failed" });
  }
});

/* ===== START SERVER ===== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
