<?php
session_start();
// ✅ FIXED PATH FOR YOU — POINTS DIRECTLY TO WHERE YOU SAVED config.php
define('STREAMCLEAN', true);
include 'C:/Users/hashim - Personal/Documents/config.php';

// ❌ IF NOT LOGGED IN — SEND BACK
if(!isset($_SESSION['user_id']) || $_SESSION['user_plan'] !== 'free') {
    header("Location: auth.php");
    exit;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StreamClean.live — Free Dashboard</title>
    <!-- ✅ NEON CYBERPUNK STYLE -->
    <style>
        * { margin:0; padding:0; box-sizing:border-box; font-family:'Segoe UI', Roboto, sans-serif; }
        body { background:#0a0a1f; color:#fff; background-image:linear-gradient(135deg, #0a0a1f 0%, #1a1a40 100%); min-height:100vh; }
        .neon-text { color:#00ffff; text-shadow:0 0 5px #00ffff, 0 0 10px #00ffff; }
        .neon-button { background:transparent; color:#00ffff; border:2px solid #00ffff; padding:12px 25px; border-radius:4px; text-decoration:none; display:inline-block; transition:0.3s; cursor:pointer; font-size:16px; }
        .neon-button:hover { background:#00ffff; color:#0a0a1f; box-shadow:0 0 15px #00ffff; }
        .header { padding:20px 5%; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #00ffff40; }
        .container { max-width:1200px; margin:30px auto; padding:0 5%; }
        .card { background:#1a1a4080; border:1px solid #00ffff30; border-radius:8px; padding:25px; margin-bottom:20px; box-shadow:0 0 10px #00ffff15; }
        .limit-bar { height:12px; background:#2a2a60; border-radius:6px; margin:10px 0; overflow:hidden; }
        .limit-fill { height:100%; background:#00ffff; width:30%; transition:0.3s; }
        .ad-box { background:#ffffff10; border:1px dashed #00ffff50; border-radius:8px; padding:15px; margin:20px 0; text-align:center; }
        .upload-area { display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:15px; margin:20px 0; }
        .upload-option { background:#1a1a40; border:1px solid #00ffff40; border-radius:8px; padding:20px; text-align:center; cursor:pointer; transition:0.3s; }
        .upload-option:hover { border-color:#00ffff; box-shadow:0 0 10px #00ffff30; }
        .upgrade-banner { background:linear-gradient(45deg, #00ff9920, #00ffff20); border:1px solid #00ff99; border-radius:8px; padding:20px; text-align:center; margin-bottom:20px; }
    </style>
</head>
<body>

    <!-- HEADER -->
    <header class="header">
        <div class="neon-text" style="font-size:22px; font-weight:bold;">⚡ StreamClean.live</div>
        <div>
            <a href="https://buy.stripe.com/aFa6oHarE6aa10N3M9bQY00" class="neon-button" style="border-color:#00ff99; color:#00ff99;">✨ UPGRADE TO PREMIUM</a>
            <a href="auth.php?logout=1" class="neon-button" style="margin-left:10px;">🚪 Logout</a>
        </div>
    </header>

    <div class="container">
        <!-- UPGRADE NOTICE -->
        <div class="upgrade-banner">
            <h3 style="color:#00ff99; margin-bottom:8px;">FREE ACCOUNT — LIMIT: 200,000 PHOTOS ONLY</h3>
            <p>✅ Photos only | ❌ No videos | ✅ Basic edit only | 📢 Ads shown | ✅ Safe storage forever</p>
        </div>

        <!-- STORAGE LIMIT -->
        <div class="card">
            <h3 class="neon-text">📦 STORAGE USED</h3>
            <div class="limit-bar"><div class="limit-fill"></div></div>
            <p><b>60,000 / 200,000</b> Photos Used</p>
        </div>

        <!-- ✅ UPLOAD ENGINE — 3 WAYS TO ADD FILES -->
        <div class="card">
            <h3 class="neon-text">📤 ADD NEW PHOTOS</h3>
            <div class="upload-area">
                <!-- 1. CHOOSE FROM FILES -->
                <label class="upload-option">
                    <span style="font-size:30px;">📁</span>
                    <p>From My Device</p>
                    <input type="file" multiple accept="image/*" style="display:none;">
                </label>

                <!-- 2. TAKE PHOTO / VIDEO -->
                <label class="upload-option">
                    <span style="font-size:30px;">📸</span>
                    <p>Take Photo</p>
                    <input type="file" accept="image/*" capture="environment" style="display:none;">
                </label>

                <!-- 3. PASTE LINK -->
                <div class="upload-option" onclick="document.getElementById('linkInput').click();">
                    <span style="font-size:30px;">🔗</span>
                    <p>Paste Image Link</p>
                    <input type="text" id="linkInput" placeholder="Paste URL here..." style="display:none;">
                </div>
            </div>
            <p style="color:#ff8888; font-size:14px;">⚠️ FREE USERS: PHOTOS ONLY — VIDEOS NOT ALLOWED</p>
        </div>

        <!-- ✅ ADSENSE — ONLY SHOWS HERE FOR FREE USERS -->
        <?php if($ADS_ENABLED && $ADS_FOR_FREE_ONLY): ?>
        <div class="ad-box">
            <p style="font-size:13px; color:#888; margin-bottom:10px;">📢 ADVERTISEMENT — SUPPORTS OUR FREE SERVICE</p>
            <ins class="adsbygoogle"
                 style="display:block; width:100%; height:90px;"
                 data-ad-client="<?=$ADSENSE_CLIENT?>"
                 data-ad-slot="1234567890"
                 data-ad-format="auto"></ins>
            <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
        </div>
        <?php endif; ?>

        <!-- BASIC EDITING ONLY -->
        <div class="card">
            <h3 class="neon-text">✂️ BASIC EDIT TOOLS</h3>
            <p>Crop • Rotate • Flip • Resize</p>
            <p style="color:#00ff99; font-size:14px;">✨ Full editing & filters available ONLY in PREMIUM</p>
        </div>

    </div>

</body>
</html>