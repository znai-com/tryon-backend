import express from "express";
import cors from "cors";

const app = express();

// CORS ko allow karna taake Shopify se requests aa sakein
app.use(cors());

// Body parser with limit (images ke liye 10mb kaafi hai)
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 3000;

// POST Route for Try-On
app.post("/tryon", async (req, res) => {
  try {
    const { userImage, productImage } = req.body;

    if (!userImage || !productImage) {
      return res.status(400).json({ error: "Missing images" });
    }

    // Yahan aap apni AI API call lagayenge baad mein
    // Abhi ke liye ye demo response bhej raha hai
    res.json({
      success: true,
      resultImage: productImage // Demo ke taur par product image wapas bhej raha hai
    });

  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Health check route
app.get("/", (req, res) => {
  res.send("Try-On Backend is running on Railway ✅");
});

// Railway ke liye 0.0.0.0 par listen karna zaroori hai
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is live on port ${PORT}`);
});
