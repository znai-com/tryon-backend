app.post("/tryon/start", async (req, res) => {
  try {

    // 🔴 NEW STEP: STORE ACCESS CHECK (AI call se pehle)
    const storeUrl =
      req.headers.origin ||
      req.headers.referer ||
      req.body.storeUrl;

    if (!isStoreAllowed(storeUrl)) {
      return res.json({
        disabled: true,
        message: "Virtual Try-On trial expired or store not authorized"
      });
    }
    // 🔴 END STORE CHECK

    const { userImage, productImage, category } = req.body;

    if (!userImage || !productImage) 
      return res.status(400).json({ error: "Missing images" });

    const jobId = Date.now().toString();
    jobs[jobId] = { status: "pending", resultUrl: null };

    (async () => {
      try {
        const response = await fetch(FASHION_AI_ENDPOINT, {
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
              category: category || "tops"
            }
          })
        });

        const startData = await response.json();
        
        if (!startData.id) {
          console.error("API Error Details:", startData);
          throw new Error(startData.message || "API ID missing");
        }

        const predictionId = startData.id;
        let resultUrl = null;
        let attempts = 0;

        while (attempts < 30 && !resultUrl) {
          await new Promise(r => setTimeout(r, 3000));
          const checkRes = await fetch(
            `https://api.fashn.ai/v1/status/${predictionId}`,
            { headers: { "Authorization": `Bearer ${FASHION_API_KEY}` } }
          );
          const statusData = await checkRes.json();
          
          if (statusData.status === "completed") {
            resultUrl = Array.isArray(statusData.output)
              ? statusData.output[0]
              : statusData.output;
            break;
          } else if (statusData.status === "failed") {
            throw new Error("AI Processing failed");
          }
          attempts++;
        }

        if (resultUrl) {
          jobs[jobId].status = "completed";
          jobs[jobId].resultUrl = resultUrl;
        } else {
          throw new Error("Timeout");
        }

      } catch (err) {
        console.error("❌ Job Error:", err.message);
        if (jobs[jobId]) jobs[jobId].status = "failed";
      }
    })();

    return res.json({ jobId });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
