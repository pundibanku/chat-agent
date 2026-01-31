
// State Management
let conversationStep = 0;
const chatArea = document.getElementById('chat-area');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// Intent Cache & Logs keys
const CACHE_KEY = 'responseCache';
const LOGS_KEY = 'chatLogs';

// --- CONFIGURATION ---
const COMPANY_NAME = "vaidmize AI Agents"; // 🟢 CHANGE THIS to your Business Name
const STARTING_GREETING = `Hello! 👋 Welcome to *${COMPANY_NAME}*.\n\nI am your automated Sales Assistant. How can I grow your business today?`;

// ⚠️ SAFETY WARNING: 
// Browser wale code me API Key dalna safe nahi hota (koi bhi inspect karke chura sakta hai).
// Best tareeka ye hai ki aap key ko Backend (Node.js/Python) me rakhein.
// Filhal testing ke liye aap yahan key daal sakte hain:

const API_CONFIG = {
    ENABLED: true,
    KEY: "HIDDEN_IN_BACKEND",
    URL: "/api/chat" // Relative path (Automatically works on Vercel)
};

// 1. PRE-FILLED CACHE (Knowledge Base)
const INITIAL_CACHE = {
    // Business Categories (English & variants)
    "digital products": "For Digital Products, our AI Agent can instantly deliver download links, handle refund queries, and upsell new courses/ebooks 24/7.",
    "ecommerce": "Our AI Agent integrates with your store to handle order statuses, recommend products, and reduce abandoned carts automatically.",
    "e-commerce": "Our AI Agent integrates with your store to handle order statuses, recommend products, and reduce abandoned carts automatically.",
    "online store": "Our AI Agent integrates with your store to handle order statuses, recommend products, and reduce abandoned carts automatically.",
    "local business": "For local businesses, our AI Agent can book appointments, answer location queries, and collect leads even when you are closed.",
    "gym": "Our AI Agent can handle membership inquiries, book classes, and follow up with trial leads automatically.",
    "real estate": "Our AI Agent pre-qualifies buyers, schedules viewings, and ensures you only talk to serious leads.",
    "coaching": "Our AI Agent acts as your intake assistant, qualifying students and scheduling consultation calls automatically.",
    "agency": "Our AI Agent handles client onboarding, FAQ support, and lead qualification, freeing your team to focus on delivery.",
    "consulting": "Our AI Agent can screen potential clients, schedule discovery calls, and answer basic service questions 24/7.",

    // Hindi/Hinglish Variants
    "online business": "Online Business ke liye hamara AI Agent 24/7 customers ko handle karta hai, leads generate karta hai aur sales badhata hai.",
    "dukan": "Aapki dukan ke liye AI Agent orders le sakta hai, stocks bata sakta hai aur customer questions ka jawab turant de sakta hai.",
    "shop": "Aapki shop ke liye AI Agent orders le sakta hai, stocks bata sakta hai aur customer questions ka jawab turant de sakta hai.",
    "coaching hindi": "Coaching ke liye AI Agent students ke doubts clear karega aur admission inquiries ko automatically handle karega.",
};

// 2. FLOW & SCRIPTS
const FLOW = {
    EN: {
        GREETING: STARTING_GREETING, // Uses the variable we defined at top
        Q1_BIZ_TYPE: "Great! First, what type of business do you run? (e.g., E-commerce, Agency, Local Shop)",
        Q2_MODE: "Got it. Is your business primarily **Online**, **Offline**, or **Hybrid**?",
        Q3_GOAL: "Understood. What is your main goal right now?\n\n(Sales, Leads, or Support?)",
        PITCH_TEMPLATE: (data) => `Thanks for sharing. Based on your needs, here is how our **Custom AI Agent** can help your *${data.bizType}* business:\n\n✅ It handles **${data.goal}** automatically.\n✅ It qualifies leads instantly without you lifting a finger.\n✅ It works 24/7 as your digital employee.\n\nThis is exactly where our AI Agent helps.`,
        POSITIONING: "Think of an AI Agent as a cost-effective employee that never sleeps.\n\n🔹 Saves you 20+ hours a week.\n🔹 Reduces support costs.\n🔹 Increases conversion rates immediately.",
        CLOSE: "Would you like to see a quick **Demo** or discuss **Setup**?",
        RESTRICTED: "I focus strictly on building AI Agents to automate your business. I don't provide general tips or consulting.\n\nOur AI Agent can handle this for you nicely.",
        FALLBACK: "I can help automate that part of your business. Shall we look at a demo?"
    },
    HI: {
        GREETING: "Namaste! 👋 Main aapka AI Business Assistant hoon.\n\nMain aapki madad kaise kar sakta hoon, kya main kuch sawal pooch sakta hoon?",
        Q1_BIZ_TYPE: "Badhiya! Sabse pehle, aap kis tarah ka business karte hain? (Jaise E-commerce, Agency, Dukaan)",
        Q2_MODE: "Samajh gaya. Aapka business **Online** hai, **Offline** hai ya **Hybrid**?",
        Q3_GOAL: "Okay. Aapka main goal abhi kya hai?\n\n(Sales badhana, Leads lana, ya Support?)",
        PITCH_TEMPLATE: (data) => `Jankari ke liye shukriya. Aapki zarurat ke hisab se, hamara **Custom AI Agent** aapke *${data.bizType}* business ki madad aise karega:\n\n✅ Ye **${data.goal}** ko automatically handle karega.\n✅ Ye leads ko turant qualify karega.\n✅ Ye 24/7 bina thake kaam karega.\n\nBas yahi hamara AI Agent aapke kaam aata hai.`,
        POSITIONING: "AI Agent ko ek aise digital employee ki tarah samjhein jo kabhi nahi sota.\n\n🔹 Hafte ke 20+ ghante bachata hai.\n🔹 Support cost kam karta hai.\n🔹 Sales turant badhata hai.",
        CLOSE: "Kya aap ek quick **Demo** dekhna chahenge ya **Setup** ki baat karein?",
        RESTRICTED: "Main sirf aapke business ke liye AI Agents banane mein madad karta hoon. Main general tips ya salah nahi deta.\n\nHamara AI Agent ye kaam aapke liye asani se kar sakta hai.",
        FALLBACK: "Main aapke business ke us hisse ko automate kar sakta hoon. Kya hum demo dekhein?"
    }
};

const RESTRICTED_PHRASES = ["how do i", "strategy", "tips", "guide", "tutorial", "salah", "tarika", "kaise karu", "free"];

// User Data & Language
let userData = { bizType: "", mode: "", goal: "" };
let currentLang = 'EN'; // Default

// Init
window.addEventListener('DOMContentLoaded', () => {
    initCache();
    setTimeout(() => {
        botReply(getFlow('GREETING'));
        conversationStep = 1;
    }, 1000);
});

// Event Listeners
sendBtn.addEventListener('click', handleUserMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleUserMessage();
});

// --- CORE LOGIC ---

function handleUserMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // --- SECRET ADMIN SHORTCUT ---
    if (text.toLowerCase() === '/admin') {
        window.location.href = 'admin.html';
        return;
    }

    addMessage(text, 'user');
    userInput.value = '';
    processMessage(text);
}

async function processMessage(text) {
    showTyping();
    const delay = Math.random() * 1000 + 800; // Simulated thinking

    setTimeout(async () => {
        removeTyping();

        // 1. Detect Language (Simple Heuristic or keep previous)
        detectLanguage(text);

        const cleanText = text.toLowerCase().trim();
        let response = "";
        let source = "API Call";

        // 2. CHECK: Restricted / Consulting Questions
        const isRestricted = RESTRICTED_PHRASES.some(p => cleanText.includes(p));

        if (isRestricted) {
            response = getFlow('RESTRICTED');
            source = "Restricted Rule";
            // Don't advance step if restricted, just block
        }
        else {
            // 3. CHECK: Intent Cache (Business Types)
            const cacheHit = findCacheHit(cleanText);
            if (cacheHit && conversationStep === 2) {
                // Only use cache if we are asking for business type or general inquiry
                response = cacheHit;
                source = "Cache Hit";
                userData.bizType = text; // Assume input was business type
                conversationStep = 3; // Move to next step manually
                setTimeout(() => botReply(getFlow('Q2_MODE')), 1500); // Trigger next question after cache answer
            }
            else {
                // 4. FLOW MACHINE OR REAL API

                if (API_CONFIG.ENABLED) {
                    // --- CALL OUR SECURE BACKEND ---
                    try {
                        const apiResponse = await fetch(API_CONFIG.URL, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ message: text })
                        });
                        const data = await apiResponse.json();
                        response = data.reply || "No reply from server";
                        source = "Real API (Secure)";
                        if (response) saveToCache(cleanText, response);
                    } catch (error) {
                        console.error("API Error Details:", error);
                        // response = "Sorry, I am facing some connection issues."; 
                        // Show actual error for debugging (User can remove later)
                        response = "Connection Error: " + (error.message || "Unknown error");
                        source = "API Error";
                    }
                } else {
                    // DEFAULT: Simulated Logic
                    response = generateFlowResponse(text);
                }
            }
        }

        // SAVE LOGS & UI
        logInteraction(text, response, source);
        botReplyUI(response);
    }, delay);
}

function generateFlowResponse(userText) {
    let reply = "";

    // State Machine
    switch (conversationStep) {
        case 1: // Greeting -> Ask Q1
            reply = getFlow('Q1_BIZ_TYPE');
            conversationStep = 2;
            break;

        case 2: // Q1 (Biz Type) -> Ask Q2
            userData.bizType = userText;
            reply = getFlow('Q2_MODE');
            conversationStep = 3;
            // Quick Replies for Mode
            setTimeout(() => addQuickReplies(['Online', 'Offline', 'Hybrid']), 1000);
            break;

        case 3: // Q2 (Mode) -> Ask Q3
            userData.mode = userText;
            reply = getFlow('Q3_GOAL');
            conversationStep = 4;
            // Quick Replies for Goal
            setTimeout(() => addQuickReplies(['Increase Sales', 'Get Leads', 'Customer Support']), 1000);
            break;

        case 4: // Q3 (Goal) -> Pitch
            userData.goal = userText;
            // Use function from template
            const template = currentLang === 'HI' ? FLOW.HI.PITCH_TEMPLATE : FLOW.EN.PITCH_TEMPLATE;
            reply = template(userData);
            conversationStep = 5;
            break;

        case 5: // Pitch -> Positioning
            reply = getFlow('POSITIONING');
            conversationStep = 6;
            break;

        case 6: // Positioning -> Close
            reply = getFlow('CLOSE');
            conversationStep = 7;
            setTimeout(() => addQuickReplies(['Book Demo', 'Setup Agent', 'Talk to Team']), 1000);
            break;

        case 7: // Post-Close
            reply = currentLang === 'HI' ? "Badhiya! Hamari team apse jaldi sampark karegi." : "Great! Our team will contact you shortly to set this up.";
            conversationStep = 8;
            break;

        default:
            reply = getFlow('FALLBACK');
    }
    return reply;
}

// --- HELPERS ---

function detectLanguage(text) {
    // Very simple detection: Check for Hindi common words
    const hindiWords = ["hai", "kya", "kaise", "karna", "chahiye", "madad", "batao", "namaste", "salah"];
    const words = text.toLowerCase().split(/\s+/);
    const isHindi = words.some(w => hindiWords.includes(w));

    if (isHindi) currentLang = 'HI';
    // Else keep current or default to EN
}

function getFlow(key) {
    return FLOW[currentLang][key];
}

function findCacheHit(input) {
    // 1. Exact match
    const cache = getCache();
    if (cache[input]) return cache[input];

    // 2. Keyword match (Simple fuzzy)
    const keys = Object.keys(cache);
    for (let key of keys) {
        if (input.includes(key) || key.includes(input)) {
            return cache[key];
        }
    }
    return null;
}

// --- UI FUNCTIONS ---

function addMessage(text, sender) {
    const row = document.createElement('div');
    row.classList.add('message-row', sender === 'user' ? 'user-message' : 'bot-message');

    // Markdown bold support
    const mdText = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\*(.*?)\*/g, '<b>$1</b>').replace(/\n/g, '<br>');

    row.innerHTML = `
        <div class="message-bubble">
            ${mdText}
            <div class="timestamp">${getCurrentTime()}</div>
        </div>
    `;
    chatArea.appendChild(row);
    scrollToBottom();
}

function botReply(text) {
    showTyping();
    setTimeout(() => {
        removeTyping();
        botReplyUI(text);
    }, 800);
}

function botReplyUI(text) {
    if (!text) return;
    const parts = text.split('\n\n');
    let delay = 0;

    parts.forEach(part => {
        if (!part.trim()) return;
        setTimeout(() => {
            addMessage(part.trim(), 'bot');
        }, delay);
        delay += 600;
    });
}

function addQuickReplies(options) {
    const div = document.createElement('div');
    div.classList.add('message-row', 'bot-message');

    let buttonsHtml = options.map(opt =>
        `<button class="quick-reply-btn" onclick="sendQuickReply('${opt}')">${opt}</button>`
    ).join('');

    div.innerHTML = `<div class="quick-replies">${buttonsHtml}</div>`;
    chatArea.appendChild(div);
    scrollToBottom();
}

// Global scope for onclick
window.sendQuickReply = function (text) {
    userInput.value = text;
    handleUserMessage();
    // Remove buttons after click (cleaner UI)
    const btns = document.querySelectorAll('.quick-reply-btn');
    btns.forEach(b => b.disabled = true);
};

function showTyping() {
    if (document.getElementById('typing-row')) return;
    const div = document.createElement('div');
    div.className = 'message-row bot-message';
    div.id = 'typing-row';
    div.innerHTML = `
        <div class="typing-indicator">
            <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
        </div>`;
    chatArea.appendChild(div);
    scrollToBottom();
}

function removeTyping() {
    const el = document.getElementById('typing-row');
    if (el) el.remove();
}

function scrollToBottom() {
    chatArea.scrollTop = chatArea.scrollHeight;
}

function getCurrentTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// --- DATA & ADMIN ---

function initCache() {
    const existing = localStorage.getItem(CACHE_KEY);
    // Merge initial cache if not present or just ensure it exists
    const cache = existing ? JSON.parse(existing) : {};

    // Add initial keys if missing
    Object.keys(INITIAL_CACHE).forEach(k => {
        if (!cache[k]) cache[k] = INITIAL_CACHE[k];
    });

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

function getCache() {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
}

function logInteraction(user, ai, source) {
    const logs = JSON.parse(localStorage.getItem(LOGS_KEY) || '[]');
    logs.push({
        timestamp: new Date().toISOString(),
        user: user,
        ai: ai,
        source: source
    });
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}

function saveToCache(key, value) {
    const cache = getCache();
    cache[key] = value;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}
