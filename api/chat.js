import fetch from "node-fetch";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-1.5-pro";

// --- USER PROVIDED LOGIC ---
async function sendMessage(userMessage) {
    const url = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    console.log("Connecting to Gemini...", url);

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            contents: [
                {
                    role: "user",
                    parts: [{ text: userMessage }],
                },
            ],
        }),
    });

    const rawText = await response.text(); // 🔥 VERY IMPORTANT

    // Debug log (optional)
    console.log("RAW RESPONSE:", rawText);

    if (!response.ok) {
        throw new Error(`Gemini API Error: ${rawText}`);
    }

    let data;
    try {
        data = JSON.parse(rawText);
    } catch (e) {
        throw new Error("Gemini returned non-JSON response");
    }

    return (
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Reply nahi aa paayi 😅"
    );
}

// --- VERCEL SERVERLESS HANDLER ---
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
            return res.status(500).json({ error: "Server Error: Missing GEMINI_API_KEY" });
        }

        // Injecting WhatsApp Persona into the message to keep the bot smart
        const systemPrompt = "You are a WhatsApp-style AI assistant. Respond in short, clear Hinglish messages (Hindi+English mix). Keep replies friendly and human-like.";
        const fullPrompt = `${systemPrompt}\n\nUser: ${message}`;

        // Calling the user's logic
        const botReply = await sendMessage(fullPrompt);

        res.status(200).json({ reply: botReply });

    } catch (error) {
        console.error("Handler Error:", error);
        // Returning the raw error details as requested by the user's logic wanting debugging
        res.status(500).json({ reply: `Connection Error: ${error.message}` });
    }
}
