const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// 1. Check for the API Key on startup for clearer errors
if (!process.env.GEMINI_API_KEY) {
  console.error("\nFATAL ERROR: GEMINI_API_KEY is not defined in your .env file.");
  console.error("Please ensure you have a .env file in the /backend directory with your key.\n");
  process.exit(1); // Exit the process if the key is missing
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to fetch an image from IPFS and convert to base64
async function urlToGenerativePart(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    
    // 2. Automatically detect the image's mime type
    const mimeType = response.headers['content-type'];
    if (!mimeType || !mimeType.startsWith('image/')) {
        throw new Error(`Fetched file from IPFS is not a valid image type. Received: ${mimeType}`);
    }

    console.log(`✅ Successfully fetched image from IPFS. Mime type: ${mimeType}`);

    return {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType,
      },
    };
  } catch (error) {
    console.error("❌ Error fetching image from IPFS:", error.message);
    throw new Error("Could not retrieve or process the image from the IPFS gateway.");
  }
}

// The AI Analysis Endpoint
app.post('/api/analyze-image', async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) {
    return res.status(400).json({ error: 'Image URL is required' });
  }

  try {
    console.log(`\nBackend received request to analyze image URL: ${imageUrl}`);
    
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

    const prompt = `
      Analyze this aerial image of a coastal ecosystem for a blue carbon project.
      Provide analysis in a structured JSON format with these keys:
      - "saplingCount": {"detected": integer, "estimated": integer, "confidence": float}.
      - "canopyHealth": {"percentage": integer, "status": "Excellent" | "Good" | "Fair" | "Poor"}.
      - "anomalies": An array of objects, each with "location", "type", and "severity" ("Low", "Medium", "High"). Return an empty array if none.
      - "carbonCapture": An integer estimate for tonnes of carbon sequestered.
      Do not include any text outside of the JSON object.
    `;
    
    const imageParts = [
      await urlToGenerativePart(imageUrl),
    ];

    console.log("⏳ Sending prompt and image to Gemini API...");
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    console.log("✅ Received response from Gemini API.");

    const jsonString = text.replace(/```json\n|```/g, '').trim();
    const aiData = JSON.parse(jsonString);

    res.json(aiData);
  } catch (error) {
    // ✅ 3. Log the DETAILED error from the Gemini API
    console.error("❌ AI Analysis Error in /api/analyze-image:", error);
    res.status(500).json({ error: 'Failed to analyze image. Check the backend console for specific details.' });
  }
});

app.listen(PORT, () => {
  console.log(`🤖 AI server running on http://localhost:${PORT}`);
});

