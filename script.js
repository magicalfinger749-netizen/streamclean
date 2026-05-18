// === AI CHAT — YOUR 6 EXACT QUESTIONS & ANSWERS ===
const aiResponses = {
    "how do i subscribe": "To subscribe, just click the 'Subscribe Now — Unlimited' button on the homepage. It’s a one-time payment and you get lifetime full access to everything!",
    "how do i watch streams": "Once subscribed and logged in, go to the 'Streams' page — all content is unlocked. Just click any stream to play instantly in HD/4K.",
    "can i use on phone": "Yes! The whole site works perfectly on phones, tablets, laptops and TVs — fully responsive and optimized for every screen.",
    "is it safe": "100% safe and secure. We use encrypted connections, no viruses, no pop-ups, no tracking — clean and private.",
    "how do i reset password": "On the Sign In screen, click 'Forgot Password', enter your email and we’ll send you a reset link straight away.",
    "how do i contact support": "You can use this AI chat 24/7, or email us at support@streamclean.com — we reply within 24 hours."
};

// === AI CHAT FUNCTIONALITY ===
const aiChatBox = document.getElementById('aiChatBox');
const aiInput = document.getElementById('aiInput');
const sendAiMsg = document.getElementById('sendAiMsg');

function addMessage(text, isUser = false) {
    const msg = document.createElement('p');
    msg.className = isUser ? 'text-accent font-semibold' : 'text-gray-300';
    msg.textContent = isUser ? `You: ${text}` : `AI: ${text}`;
    aiChatBox.appendChild(msg);
    aiChatBox.scrollTop = aiChatBox.scrollHeight;
}

sendAiMsg.addEventListener('click', () => {
    const text = aiInput.value.trim().toLowerCase();
    if (!text) return;
    addMessage(text, true);
    aiInput.value = '';

    // Match your exact questions
    let found = false;
    for (const [question, answer] of Object.entries(aiResponses)) {
        if (text.includes(question)) {
            setTimeout(() => addMessage(answer), 600);
            found = true;
            break;
        }
    }
    if (!found) setTimeout(() => addMessage("I’m here to help! Ask me about subscribing, watching, safety, or support."), 600);
});

aiInput.addEventListener('keydown', (e) => e.key === 'Enter' && sendAiMsg.click());

// === SIGN IN / SIGN UP POPUPS ===
const openSignIn = document.getElementById('openSignIn');
const openSignUp = document.getElementById('openSignUp');

// Create modals dynamically
function createModal(id, title, fields, buttonText) {
    const modal = document.createElement('div');
    modal.id = id;
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/70 hidden';
    modal.innerHTML = `
        <div class="glass-card w-full max-w-md p-8 mx-4">
            <h3 class="text-2xl font-bold glow-text mb-6">${title}</h3>
            ${fields.map(f => `<input type="${f.type}" placeholder="${f.placeholder}" class="w-full px-4 py-3 mb-4 rounded-lg bg-secondary border border-glassBorder text-textLight">`).join('')}
            <button class="w-full glow-btn py-3 font-semibold">${buttonText}</button>
            <button class="w-full mt-3 text-gray-400 hover:text-accent close-modal">Close</button>
        </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('.close-modal').addEventListener('click', () => modal.classList.add('hidden'));
}

// Make them open
openSignIn.addEventListener('click', () => document.getElementById('signInModal').classList.remove('hidden'));
openSignUp.addEventListener('click', () => document.getElementById('signUpModal').classList.remove('hidden'));

// Create both popups
createModal('signInModal', 'Sign In', [{type:'email', placeholder:'Email'}, {type:'password', placeholder:'Password'}], 'Login');
createModal('signUpModal', 'Create Account', [{type:'text', placeholder:'Full Name'}, {type:'email', placeholder:'Email'}, {type:'password', placeholder:'Password'}], 'Sign Up');
