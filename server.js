import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

const PORT = process.env.PORT || 8080;
const FASHION_API_KEY = process.env.FASHION_API_KEY;
const FASHION_AI_ENDPOINT = process.env.FASHION_AI_ENDPOINT;

app.post("/tryon", async (req, res) => {
  try {
    // 1. Frontend se aane wali category pakarna
    const { userImage, productImage, category } = req.body; 
    console.log(`--- Initializing Try-On Request [Category: ${category || 'tops'}] ---`);

    // 2. Send Request to start processing
    const response = await fetch(FASHION_AI_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FASHION_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        // Aap yahan 'tryon-max' bhi likh sakte hain agar v1.6 tracksuit sahi na banaye
        model_name: "tryon-v1.6", 
        inputs: { 
          model_image: userImage, 
          garment_image: productImage, 
          category: category || "tops" // Dynamic category usage
        },
        output_format: "png"
      })
    });

    const startData = await response.json();
    if (!startData.id) {
        console.error("❌ Failed to get Prediction ID:", startData);
        throw new Error("API did not return a process ID");
    }

    const predictionId = startData.id;
    console.log(`✅ Request Queued. ID: ${predictionId}. Waiting for result...`);

    // 3. Polling Logic: Wait for the image to be ready
    let resultUrl = null;
    let attempts = 0;
    const maxAttempts = 20; // Thora extra time tracksuit jaise heavy images ke liye

    while (attempts < maxAttempts && !resultUrl) {
        await new Promise(resolve => setTimeout(resolve, 3000)); 
        
        const checkRes = await fetch(`https://api.fashn.ai/v1/status/${predictionId}`, {
            headers: { "Authorization": `Bearer ${FASHION_API_KEY}` }
        });
        
        const statusData = await checkRes.json();
        console.log(`Checking status... Attempt ${attempts + 1}: ${statusData.status}`);

        if (statusData.status === "completed" || statusData.output) {
            // Check for array or string output
            resultUrl = Array.isArray(statusData.output) ? statusData.output[0] : statusData.output;
        } else if (statusData.status === "failed") {
            throw new Error("AI Generation Failed on server");
        }
        attempts++;
    }

    if (!resultUrl) throw new Error("Processing timed out");

    console.log("🚀 Success! Image URL:", resultUrl);
    return res.json({ success: true, resultImage: resultUrl });

  } catch (err) {
    console.error("❌ BACKEND ERROR:", err.message);
    return res.status(500).json({ error: "Try-on failed", details: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("✅ Backend is LIVE - Dynamic Category & Slider Reset Enabled");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
