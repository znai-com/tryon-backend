import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 3000;

/*
  ⚠️ API KEY YAHAN AAYE GI (kal)
  Railway > Variables > FASHION_API_KEY
*/
const FASHION_API_KEY = process.env.FASHION_API_KEY || "";

/*
  MAIN TRY-ON ENDPOINT
*/
app.post("/tryon", async (req, res) => {
  try {
    const { userImage, productImage } = req.body;

    if (!userImage || !productImage) {
      return res.status(400).json({ error: "Missing images" });
    }

    // 👇 ABHI FAKE RESPONSE (placeholder)
    // Kal is jagah real Fashion.ai call aayegi
    return res.json({
      success: true,
      resultImage: productImage
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Try-on failed" });
  }
});

app.get("/", (req, res) => {
  res.send("Try-On Backend is running ✅");
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
