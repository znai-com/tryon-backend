import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json({ limit: "30mb" })); // Memory safe limit for high-res photos

const PORT = process.env.PORT || 8080;
const FASHION_API_KEY = process.env.FASHION_API_KEY;
const FASHION_AI_ENDPOINT = process.env.FASHION_AI_ENDPOINT;

app.post("/tryon", async (req, res) => {
  try {
    const { userImage, productImage, category } = req.body; 
    
    // 1. Backend Fallback: Agar category missing ho toh crash na ho
    const finalCategory = category || "tops"; 
    console.log(`--- Request Received: [Category: ${finalCategory}] ---`);

    // 2. Main API Request
    const response = await fetch(FASHION_AI_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FASHION_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model_name: "tryon-v1.6", // Keeping v1.6 for speed
        inputs: { 
          model_image: userImage, 
          garment_image: productImage, 
          category: finalCategory,
          // Tracksuit (one-pieces) ke liye AI ko mazeed guide karna
          ns_fw: true, // Safety filter enable
          cover_feet: finalCategory === "one-pieces" ? true : false,
          adjust_hands: true
        }
      })
    });

    const startData = await response.json();
    
    // Error Handling for Prediction ID
    if (!startData.id) {
        console.error("❌ Fashn API Error:", startData);
        const errorMsg = startData.error || startData.message || "Failed to start AI process";
        throw new Error(errorMsg);
    }

    const predictionId = startData.id;
    console.log(`✅ ID Generated: ${predictionId}. Processing...`);

    // 3. Smart Polling Logic
    let resultUrl = null;
    let attempts = 0;
    const maxAttempts = 25; // Extra time for tracksuits

    while (attempts < maxAttempts && !resultUrl) {
        await new Promise(r => setTimeout(r, 3000)); 
        
        const checkRes = await fetch(`https://api.fashn.ai/v1/status/${predictionId}`, {
            headers: { "Authorization": `Bearer ${FASHION_API_KEY}` }
        });
        
        const statusData = await checkRes.json();
        console.log(`Step ${attempts + 1}: ${statusData.status}`);

        if (statusData.status === "completed" || (statusData.output && statusData.output.length > 0)) {
            // Handle output as array or string
            resultUrl = Array.isArray(statusData.output) ? statusData.output[0] : statusData.output;
            break;
        } else if (statusData.status === "failed") {
            console.error("❌ Prediction Status:", statusData);
            throw new Error("AI generation failed. Please try a clearer person photo.");
        }
        attempts++;
    }

    if (!resultUrl) throw new Error("AI took too long. Please try again.");

    console.log("🚀 Success! Sending URL to Frontend.");
    return res.json({ success: true, resultImage: resultUrl });

  } catch (err) {
    console.error("❌ SERVER ERROR:", err.message);
    // User-friendly error message
    return res.status(500).json({ 
        success: false, 
        error: "Virtual Try-On failed", 
        details: err.message 
    });
  }
});

app.get("/", (req, res) => res.send("AI Backend is Running..."));

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server active on port ${PORT}`);
});
