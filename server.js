// ==================================================
// ✅ STREAMCLEAN – FULL BACKEND — FINAL FIX
// ✅ FIXED: Paths + Homepage Load + Styles Working
// ==================================================

const express = require('express');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// --------------------------
// ✅ CONFIG
// --------------------------
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const YOUR_WEBSITE_URL = "https://streamclean.live";
const STRIPE_LINK = "https://buy.stripe.com/aFa6oHarE6aa10N3M9bQY00";

// --------------------------
// ✅ MIDDLEWARE — 100% CORRECT PATHS
// --------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname, { index: "index.html" }));

// --------------------------
// ✅ DATABASE
// --------------------------
const DB_FILE = './database.json';

function getDB() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({
            users: [],
            verifications: [],
            subscriptions: []
        }, null, 2));
    }
    return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ==================================================
// ✅ EMAIL SYSTEM - BREVO
// ==================================================

// --------------------------
// ✅ CREATE ACCOUNT + SEND VERIFICATION
// --------------------------
app.post('/create-account', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.json({success:false, error:"Fill all fields!"});

    const db = getDB();
    if (db.users.some(u => u.email === email)) return res.json({success:false, error:"Email already registered"});

    const newUser = {
        email,
        password,
        subscribed: false,
        verified: false,
        joinDate: new Date().toISOString(),
        subscriptionStart: null
    };
    db.users.push(newUser);
    saveDB(db);

    const verifyLink = `${YOUR_WEBSITE_URL}/verify?email=${encodeURIComponent(email)}`;

    try {
        await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "accept": "application/json",
                "api-key": BREVO_API_KEY,
                "content-type": "application/json"
            },
            body: JSON.stringify({
                sender: { name: "StreamClean Team", email: "no-reply@streamclean.live" },
                to: [{ email: email }],
                subject: "✅ Verify your StreamClean account",
                htmlContent: `
                    <h2>Welcome to StreamClean!</h2>
                    <p>Click below to verify:</p>
                    <a href="${verifyLink}" style="background:#66fcf1; color:black; padding:14px 28px; text-decoration:none; border-radius:6px; font-weight:bold;">✅ VERIFY MY EMAIL</a>
                `
            })
        });
        res.json({success:true, message:"Account created! ✅ Check your inbox!"});
    } catch (err) {
        console.log("Email error:", err);
        res.json({success:false, error:"Account created but could not send email"});
    }
});

// --------------------------
// ✅ VERIFY EMAIL
// --------------------------
app.get('/verify', (req, res) => {
    const email = decodeURIComponent(req.query.email);
    const db = getDB();
    const user = db.users.find(u => u.email === email);

    if (!user) return res.send("❌ Invalid link");
    if (user.verified) return res.send("✅ Already verified!");

    user.verified = true;
    saveDB(db);
    res.send(`
        <h1>✅ Email Verified!</h1>
        <p>Welcome to StreamClean — you’re all set!</p>
        <a href="/">Go to Homepage</a>
    `);
});

// --------------------------
// ✅ FORGOT PASSWORD
// --------------------------
app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    const db = getDB();
    const user = db.users.find(u => u.email === email);

    if (!user) return res.json({success:false, error:"Email not found"});

    const resetLink = `${YOUR_WEBSITE_URL}/reset-password?email=${encodeURIComponent(email)}`;

    try {
        await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "accept": "application/json",
                "api-key": BREVO_API_KEY,
                "content-type": "application/json"
            },
            body: JSON.stringify({
                sender: { name: "StreamClean Team", email: "no-reply@streamclean.live" },
                to: [{ email: email }],
                subject: "🔑 Reset your StreamClean password",
                htmlContent: `
                    <h2>Reset Password</h2>
                    <a href="${resetLink}" style="background:#66fcf1; color:black; padding:14px 28px; text-decoration:none; border-radius:6px; font-weight:bold;">🔑 RESET PASSWORD</a>
                `
            })
        });
        res.json({success:true, message:"✅ Reset link sent! Check inbox!"});
    } catch (err) {
        res.json({success:false, error:"Could not send reset email"});
    }
});

// --------------------------
// ✅ RESET PASSWORD
// --------------------------
app.post('/update-password', (req, res) => {
    const { email, newPassword } = req.body;
    const db = getDB();
    const user = db.users.find(u => u.email === email);

    if (!user) return res.json({success:false, error:"Invalid request"});
    user.password = newPassword;
    saveDB(db);
    res.json({success:true, message:"✅ Password updated!"});
});

// --------------------------
// ✅ SUBSCRIBE
// --------------------------
app.post('/subscribe', async (req, res) => {
    const { email } = req.body;
    const db = getDB();
    let user = db.users.find(u => u.email === email);

    if (!user) {
        user = { 
            email, 
            subscribed: true, 
            verified: true, 
            joinDate: new Date().toISOString(),
            subscriptionStart: new Date().toISOString()
        };
        db.users.push(user);
    } else {
        user.subscribed = true;
        user.subscriptionStart = new Date().toISOString();
    }
    saveDB(db);

    try {
        await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "accept": "application/json",
                "api-key": BREVO_API_KEY,
                "content-type": "application/json"
            },
            body: JSON.stringify({
                sender: { name: "StreamClean Team", email: "no-reply@streamclean.live" },
                to: [{ email: email }],
                subject: "🎉 Welcome to StreamClean Premium!",
                htmlContent: `<h2>Thank You for Subscribing!</h2><p>Full access now active 🚀</p>`
            })
        });
    } catch (err) { }

    res.json({success:true, message:"✅ Subscribed!"});
});

// --------------------------
// ✅ ACCOUNT DETAILS / PROFILE
// --------------------------
app.get('/account', (req, res) => {
    const email = req.query.email;
    if (!email) return res.send("❌ Please log in first");

    const db = getDB();
    const user = db.users.find(u => u.email === email);
    if (!user) return res.send("❌ Account not found");

    const createdDate = new Date(user.joinDate).toLocaleString();
    const subDate = user.subscriptionStart ? new Date(user.subscriptionStart).toLocaleString() : "Not subscribed yet";

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>StreamClean - Account Details</title>
            <link rel="stylesheet" href="style.css">
            <style>
                body { font-family: Arial; background: #0b0c10; color: #c5c6c7; padding: 30px; }
                .container { max-width: 600px; margin: auto; background: #1f2833; padding: 30px; border-radius: 12px; }
                h1 { color: #66fcf1; text-align: center; }
                .detail { padding: 15px 0; border-bottom: 1px solid #45a29e; }
                .label { font-weight: bold; color: #66fcf1; }
                .profile-link { position: absolute; top: 20px; right: 30px; background: #45a29e; padding: 8px 16px; border-radius: 20px; color:white; text-decoration:none; }
            </style>
        </head>
        <body>
            <a href="/account?email=${email}" class="profile-link">👤 My Profile</a>
            <div class="container">
                <h1>👤 Account Details</h1>
                <div class="detail"><div class="label">Your Email:</div><div>${user.email}</div></div>
                <div class="detail"><div class="label">Account Created:</div><div>${createdDate}</div></div>
                <div class="detail"><div class="label">Subscription Started:</div><div>${subDate}</div></div>
                <div class="detail"><div class="label">Status:</div><div>${user.verified ? "✅ Verified" : "❌ Not Verified"} | ${user.subscribed ? "⭐ Premium Member" : "🆓 Free User"}</div></div>
                <a href="/" style="color:#66fcf1; text-decoration:none; margin-top:20px; display:inline-block;">← Back to Home</a>
            </div>
        </body>
        </html>
    `);
});

// --------------------------
// ✅ STRIPE LINK
// --------------------------
app.get('/buy', (req, res) => {
    res.redirect(STRIPE_LINK);
});



// --------------------------
// ✅ START SERVER
// --------------------------
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
