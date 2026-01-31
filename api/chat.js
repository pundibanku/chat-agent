import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    // 1. CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 2. Validate API Key
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
        return res.status(500).json({ error: "Server Error: Missing GEMINI_API_KEY" });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        const { message } = req.body;
        const genAI = new GoogleGenerativeAI(API_KEY);

        // Strategy: Try Flash first (faster/cheaper), fallback to Pro (stable)
        // Strategy: User requested 'gemini-1.5-pro' or 'gemini-pro'. 
        // Using 'gemini-1.5-pro' for high quality instructions compliance.
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const systemInstruction = `
You are a WhatsApp-style AI assistant running on Google Gemini API.

BEHAVIOR RULES:
- Respond in short, clear WhatsApp-style messages.
- Use Hinglish (Hindi + English mix).
- Keep replies friendly, natural, and human-like.
- Avoid long paragraphs; prefer 1–3 lines per message.
- Do not mention API errors, system issues, or internal configurations to the user.

ROLE:
You help users with business, tech, and daily questions as a smart WhatsApp assistant.
        `;

        const result = await model.generateContent(`${systemInstruction}\n\nUser Message: ${message}`);

        const response = await result.response;
        const botReply = response.text() || "Sorry, I couldn't generate a response.";

        res.status(200).json({ reply: botReply });

    } catch (error) {
        console.error("API Error:", error);
        // detailed error for client debugging
        res.status(500).json({
            reply: `Connection Error: ${error.message}. Please check if the 'Generative Language API' is enabled in your Google Cloud Console.`
        });
    }
}
