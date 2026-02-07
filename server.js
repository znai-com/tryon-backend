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

    const aiResponse = await fetch(FASHION_AI_ENDPOINT, {
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
          category: "tops"            
        },
        output_format: "png"
      })
    });

    // --- Start of Replaced Section ---
    const aiData = await aiResponse.json();

    if (!aiResponse.ok) {
      console.error("❌ FASHN.AI API Error:", aiData);
      throw new Error(JSON.stringify(aiData));
    }

    console.log("✅ AI Success! Full Response:", JSON.stringify(aiData));

    // Fashn.ai v1.6 response handling (checks for array or direct strings)
    let resultUrl = "";

    if (aiData.output) {
        // Agar array hai toh pehla element lo, warna direct string
        resultUrl = Array.isArray(aiData.output) ? aiData.output[0] : aiData.output;
    } else if (aiData.image) {
        resultUrl = aiData.image;
    } else if (aiData.result_image) {
        resultUrl = aiData.result_image;
    } else if (aiData.output_url) {
        resultUrl = aiData.output_url;
    }

    if (!resultUrl) {
        console.error("❌ Output keys missing in:", aiData);
        throw new Error("Result image not found in AI response keys");
    }

    console.log("🚀 Image Link Found:", resultUrl);

    return res.json({
      success: true,
      resultImage: resultUrl
    });
    // --- End of Replaced Section ---

  } catch (err) {
    console.error("❌ BACKEND ERROR:", err.message);
    return res.status(500).json({
      error: "AI processing failed",
      details: err.message
    });
  }
});

app.get("/", (req, res) => {
  res.send("✅ Backend is Ready for v1.6 with Enhanced Output Handling");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
