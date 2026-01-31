const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve allowed static files (index.html, etc.)

// ⚠️ SAFETY: API Key is now hidden here on the server
const API_KEY = process.env.OPENAI_API_KEY;

// Route to handle chat requests
app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message; // Frontend sends { "message": "..." }

        if (!API_KEY || API_KEY === "YOUR_OPENAI_KEY_HERE") {
            return res.status(500).json({ error: "API Key is missing in .env file" });
        }

        // Call OpenAI API
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are a helpful AI Business Sales Agent. Respond in short, sales-focused messages." },
                    { role: "user", content: userMessage }
                ]
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        const botReply = data.choices[0].message.content;

        // Send back just the reply
        res.json({ reply: botReply });

    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ reply: "Sorry, server is busy right now." });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Secure Backend Server running at http://localhost:${PORT}`);
    console.log(`➡️  Frontend can now request data safely.`);
});
