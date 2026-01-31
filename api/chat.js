import fetch from "node-fetch";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-1.5-pro"; // safest model

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

    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        const { message } = req.body;

        if (!GEMINI_API_KEY) {
            throw new Error("Missing GEMINI_API_KEY in environment variables");
        }

        const url = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

        // Injecting WhatsApp Persona into the message
        const systemPrompt = "You are a WhatsApp-style AI assistant. Respond in short, clear Hinglish messages (Hindi+English mix). Keep replies friendly and human-like.";
        const fullPrompt = `${systemPrompt}\n\nUser: ${message}`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [{ text: fullPrompt }],
                    },
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Gemini Error:", errorText);
            throw new Error(`Gemini API failed: ${errorText}`);
        }

        const data = await response.json();
        const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

        res.status(200).json({ reply: botReply });

    } catch (error) {
        console.error("Handler Error:", error);
        res.status(500).json({ reply: `Connection Error: ${error.message}` });
    }
}
