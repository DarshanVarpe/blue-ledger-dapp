const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// ✅ FIX: Configure CORS to allow your deployed frontend
const whitelist = [
  'http://localhost:8080', // Your local frontend for development
  'https://blue-ledger-dapp.vercel.app' // Your deployed frontend
];

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(cors(corsOptions)); // Use the configured options
app.use(express.json());

const PORT = process.env.PORT || 3001; // Important for Render deployment

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
        throw new Error(`Fetched file from IPFS is not a valid image type. Received: ${mimeType}`);
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
    console.error("❌ AI Analysis Error in /api/analyze-image:", error);
    res.status(500).json({ error: 'Failed to analyze image. Check backend console.' });
  }
});

app.listen(PORT, () => {
  console.log(`🤖 AI server running on port ${PORT}`);
});