// ==============================================
// ✅ STREAMCLEAN — FULL BACKEND
// ✅ FEATURES: Real Email Verification + Thank You Email After Subscription
// ✅ Sends emails to inbox with links & full details
// ==============================================

const express = require('express');
const path = require('path');

const crypto = require('crypto');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// --------------------------
// ⚠️ CONFIG - UPDATE THESE 2 THINGS FIRST
// --------------------------
 const BREVO_API_KEY = process.env.BREVO_API_KEY;
const YOUR_WEBSITE_URL = "https://streamclean.live";
const STRIPE_LINK = "https://buy.stripe.com/aFa6oHarE6aa10N3M9bQY00"; // Your payment link

// --------------------------
// MIDDLEWARE
// --------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/')));

// --------------------------
// DATABASE (SAVES PERMANENTLY)
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

// --------------------------
// EMAIL SYSTEM
// --------------------------
// --- SEND VERIFICATION EMAIL ---
const verifyLink = `${YOUR_WEBSITE_URL}/verify?email=${encodeURIComponent(email)}`;

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
            <p>Link: ${verifyLink}</p>
        `
    })
});// --- SEND PASSWORD RESET EMAIL ---
const resetLink = `${YOUR_WEBSITE_URL}/reset-password?email=${encodeURIComponent(email)}`;

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
            <p>Click below to set new password:</p>
            <a href="${resetLink}" style="background:#66fcf1; color:black; padding:14px 28px; text-decoration:none; border-radius:6px; font-weight:bold;">🔑 RESET PASSWORD</a>
            <p>Link: ${resetLink}</p>
        `
    })
});
// --------------------------
// ✅ 1. CREATE ACCOUNT + SEND VERIFICATION EMAIL
// --------------------------
app.post('/create-account', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.json({success:false, error:"Fill all fields!"});

    const db = getDB();
    if (db.users.some(u => u.email === email)) return res.json({success:false, error:"Email already registered!"});

    // Create new user (not verified yet)
    const newUser = {
        email, password,
        subscribed: false,
        verified: false,
        joinDate: new Date().toISOString()
    };
    db.users.push(newUser);

    // Create verification token (valid 24h)
    const token = crypto.randomBytes(32).toString('hex');
    db.verifications.push({
        email, token,
        expires: Date.now() + 86400000
    });
    saveDB(db);

    // ✅ SEND REAL VERIFICATION EMAIL TO THEIR INBOX
    const verifyLink = `${SITE_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
    const mailOptions = {
        from: `"StreamClean Team" <${EMAIL_USER}>`,
        to: email,
        subject: "✅ Verify Your Email — StreamClean",
        html: `
            <div style="font-family:Arial; max-width:600px; margin:0 auto; background:#0f0f0f; color:#fff; padding:20px; border-radius:10px;">
                <h2 style="color:#66fcf1; text-align:center;">Welcome to StreamClean! 🎉</h2>
                <p>Thank you for creating an account! Please verify your email to activate your account:</p>
                <div style="text-align:center; margin:25px 0;">
                    <a href="${verifyLink}" style="background:#66fcf1; color:#000; padding:14px 25px; border-radius:6px; text-decoration:none; font-weight:bold; font-size:16px;">Verify My Email Address</a>
                </div>
                <p style="color:#aaa; font-size:14px;">Or copy this link: <br> ${verifyLink}</p>
                <p style="color:#aaa; font-size:14px;">Link expires in 24 hours.</p>
            </div>
        `
    };

    transporter.sendMail(mailOptions, (err) => {
        if (err) return res.json({success:false, error:"Failed to send email — try again later"});
        res.json({success:true, message:"Account created! Check your inbox for verification link"});
    });
});

// --------------------------
// ✅ 2. VERIFY EMAIL LINK (WHEN THEY CLICK IT)
// --------------------------
app.get('/verify-email', (req, res) => {
    const { token, email } = req.query;
    const db = getDB();

    // Check if link is valid & not expired
    const validLink = db.verifications.find(v => 
        v.email === email && 
        v.token === token && 
        v.expires > Date.now()
    );
    if (!validLink) return res.send(`
        <div style="background:#0f0f0f; color:#fff; font-family:Arial; text-align:center; padding:50px;">
            <h2 style="color:#ff4444;">❌ Invalid or Expired Link!</h2>
            <p>Please create your account again or contact support.</p>
        </div>
    `);

    // Mark user as verified
    const user = db.users.find(u => u.email === email);
    if (user) user.verified = true;

    // Remove used token
    db.verifications = db.verifications.filter(v => v.email !== email);
    saveDB(db);

    res.send(`
        <div style="background:#0f0f0f; color:#fff; font-family:Arial; text-align:center; padding:50px;">
            <h2 style="color:#66fcf1;">✅ Email Verified Successfully!</h2>
            <p>You can now <a href="/" style="color:#66fcf1; text-decoration:none;">sign in</a> to your account.</p>
        </div>
    `);
});

// --------------------------
// ✅ 3. LOGIN SYSTEM (ONLY ALLOWS VERIFIED USERS)
// --------------------------
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const db = getDB();

    // ADMIN LOGIN — ALWAYS WORKS
    if (email === "magicalfinger749@gmail.com" && password === "Kinghashim2") {
        return res.json({
            success: true,
            user: { email, subscribed: true, verified: true, isAdmin: true }
        });
    }

    // NORMAL USER LOGIN
    const user = db.users.find(u => u.email === email && u.password === password);
    if (!user) return res.json({success:false, error:"❌ Wrong email or password"});
    if (!user.verified) return res.json({success:false, error:"⚠️ Please verify your email first — check your inbox!"});

    res.json({ success:true, user });
});

// --------------------------
// ✅ 4. SUBSCRIBE + SEND THANK YOU EMAIL (ALL FEATURES LISTED)
// --------------------------
app.post('/mark-subscribed', (req, res) => {
    const { email } = req.body;
    const db = getDB();

    // Find user and mark as subscribed
    const user = db.users.find(u => u.email === email);
    if (!user) return res.json({success:false, error:"User not found"});
    
    user.subscribed = true;
    db.subscriptions.push({ email, date: new Date().toISOString() });
    saveDB(db);

    // ✅ SEND THANK YOU EMAIL — FULL DETAILS INSIDE
    const mailOptions = {
        from: `"StreamClean Team" <${EMAIL_USER}>`,
        to: email,
        subject: "🎉 Thank You For Subscribing — Enjoy Unlimited Access!",
        html: `
            <div style="font-family:Arial; max-width:600px; margin:0 auto; background:#0f0f0f; color:#fff; padding:25px; border-radius:12px; border:1px solid #66fcf1;">
                <h2 style="color:#66fcf1; text-align:center; font-size:26px;">🎉 THANK YOU FOR SUBSCRIBING!</h2>
                <p style="text-align:center; font-size:17px; margin-bottom:20px;">You now have FULL UNLIMITED access to everything StreamClean offers.</p>
                
                <h3 style="color:#66fcf1; margin-top:30px;">✅ What you get now:</h3>
                <ul style="font-size:16px; line-height:2; padding-left:20px;">
                    <li>🔓 <strong>Unlimited streams</strong> — no more free use limits</li>
                    <li>🎬 Stream up to <strong>10 videos/streams at once</strong></li>
                    <li>💾 Save <strong>unlimited playlists & links</strong> forever</li>
                    <li>📐 All layout options: Grid, 3+7, 5+5, List view</li>
                    <li>⚡ Priority access & fastest loading speeds</li>
                    <li>🛠️ All future features included for free</li>
                </ul>

                <p style="margin-top:25px; font-size:16px;">Go back to the site and start streaming: <a href="${SITE_URL}" style="color:#66fcf1; text-decoration:none;">${SITE_URL}</a></p>
                <p style="color:#aaa; font-size:13px; margin-top:30px;">© 2026 StreamClean — We hope you enjoy!</p>
            </div>
        `
    };

    transporter.sendMail(mailOptions, (err) => {
        if (err) console.error("Email error:", err);
    });

    res.json({success:true, message:"Subscription activated! Thank you email sent."});
});

// --------------------------
// SERVE WEBSITE
// --------------------------
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --------------------------
// START SERVER
// --------------------------
app.listen(PORT, () => {
    console.log(`🚀 StreamClean Server Running`);
    console.log(`✅ Email System Active | Verification + Thank You Emails Enabled`);
});
