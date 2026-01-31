import fetch from "node-fetch";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL = "llama3-8b-8192"; // Fast and efficient model on Groq

// --- GROQ API LOGIC ---
async function sendMessage(userMessage) {
    const url = "https://api.groq.com/openai/v1/chat/completions";

    console.log("Connecting to Groq...", url);

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
            messages: [
                {
                    role: "system",
                    content: "You are a WhatsApp-style AI assistant. Respond in short, clear Hinglish messages (Hindi+English mix). Keep replies friendly and human-like."
                },
                {
                    role: "user",
                    content: userMessage
                }
            ],
            model: MODEL,
            temperature: 0.7
        }),
    });

    const rawText = await response.text();
    console.log("🔥 GROQ RAW RESPONSE:", rawText);

    if (!response.ok) {
        throw new Error(rawText);
    }

    let data;
    try {
        data = JSON.parse(rawText);
    } catch (e) {
        throw new Error("Groq returned non-JSON response");
    }

    return (
        data.choices?.[0]?.message?.content ||
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

        if (!GROQ_API_KEY) {
            return res.status(500).json({ error: "Server Error: Missing GROQ_API_KEY" });
        }

        // Calling the Groq logic directly
        const botReply = await sendMessage(message);

        // ✅ ALWAYS JSON (User's requested format)
        res.status(200).json({
            success: true,
            reply: botReply
        });

    } catch (err) {
        console.error("CHAT ERROR:", err.message);
        // ✅ JSON ERROR RESPONSE (VERY IMPORTANT)
        return res.status(500).json({
            success: false,
            reply: "DEBUG ERROR: " + err.message
        });
    }
}
