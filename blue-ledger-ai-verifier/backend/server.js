const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

if (!process.env.GEMINI_API_KEY) {
  console.error("\nFATAL ERROR: GEMINI_API_KEY is not defined in your .env file.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function urlToGenerativePart(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    const mimeType = response.headers['content-type'];
    if (!mimeType || !mimeType.startsWith('image/')) {
        throw new Error(`Fetched file is not a valid image type. Received: ${mimeType}`);
    }
    console.log(`✅ Successfully fetched image from URL. Mime type: ${mimeType}`);
    return {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType,
      },
    };
  } catch (error) {
    console.error("❌ Error fetching image from URL:", error.message);
    throw new Error("Could not retrieve or process the image from the provided URL.");
  }
}

// ✅ FIX: This endpoint now accepts an `imageUrl` instead of an `ipfsHash`
app.post('/api/analyze-image', async (req, res) => {
  const { imageUrl } = req.body; // Changed from ipfsHash
  if (!imageUrl) {
    return res.status(400).json({ error: 'Image URL is required' });
  }

  try {
    console.log(`\nBackend received request to analyze image URL: ${imageUrl}`);
    
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      Analyze this aerial image of a coastal ecosystem, likely for a blue carbon project.
      Provide your analysis in a structured JSON format. The JSON object must have the following keys:
      - "saplingCount": An object with "detected" (your best integer estimate of trees/saplings), "estimated" (round the detected number to the nearest thousand), and "confidence" (a percentage from 0-100).
      - "canopyHealth": An object with "percentage" (your estimate of healthy vegetation coverage) and a "status" string ("Excellent", "Good", "Fair", or "Poor").
      - "anomalies": An array of objects, where each object represents a potential issue. Each object must have "location" (a general area like "Sector B-4"), "type" (e.g., "Potential dead vegetation"), and "severity" ("Low", "Medium", or "High"). If no anomalies are found, return an empty array.
      - "carbonCapture": Your best integer estimate for the tonnes of carbon this project could sequester based on the visual evidence.
      Do not include any text or markdown formatting outside of the JSON object itself.
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
    console.error("❌ AI Analysis Error in /api/analyze-image:", error);
    res.status(500).json({ error: 'Failed to analyze image. Check the backend console for specific details.' });
  }
});

app.listen(PORT, () => {
  console.log(`🤖 AI server running on http://localhost:${PORT}`);
});