<?php
session_start();
// ✅ FIXED PATH FOR YOU — POINTS DIRECTLY TO WHERE YOU SAVED config.php
define('STREAMCLEAN', true);
include 'C:/Users/hashim - Personal/Documents/config.php';

// ❌ IF NOT LOGGED IN OR NOT PREMIUM
if(!isset($_SESSION['user_id']) || $_SESSION['user_plan'] !== 'premium') {
    header("Location: auth.php");
    exit;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StreamClean.live — Premium Dashboard ⭐</title>
    <!-- ✅ NEON CYBERPUNK STYLE + GOLD ACCENT -->
    <style>
        * { margin:0; padding:0; box-sizing:border-box; font-family:'Segoe UI', Roboto, sans-serif; }
        body { background:#0a0a1f; color:#fff; background-image:linear-gradient(135deg, #0a0a1f 0%, #1a1a40 100%); min-height:100vh; }
        .neon-text { color:#00ffff; text-shadow:0 0 5px #00ffff, 0 0 10px #00ffff; }
        .gold-text { color:#ffdd00; text-shadow:0 0 5px #ffdd00, 0 0 10px #ffdd00; }
        .neon-button { background:transparent; color:#00ffff; border:2px solid #00ffff; padding:12px 25px; border-radius:4px; text-decoration:none; display:inline-block; transition:0.3s; cursor:pointer; font-size:16px; }
        .neon-button:hover { background:#00ffff; color:#0a0a1f; box-shadow:0 0 15px #00ffff; }
        .header { padding:20px 5%; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #00ffff40; }
        .container { max-width:1200px; margin:30px auto; padding:0 5%; }
        .card { background:#1a1a4080; border:1px solid #00ffff30; border-radius:8px; padding:25px; margin-bottom:20px; box-shadow:0 0 10px #00ffff15; }
        .unlimited-badge { background:linear-gradient(45deg, #ffdd0020, #00ff9920); border:1px solid #ffdd00; border-radius:8px; padding:15px; text-align:center; margin-bottom:20px; }
        .upload-area { display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:15px; margin:20px 0; }
        .upload-option { background:#1a1a40; border:1px solid #00ffff40; border-radius:8px; padding:20px; text-align:center; cursor:pointer; transition:0.3s; }
        .upload-option:hover { border-color:#00ffff; box-shadow:0 0 10px #00ffff30; transform:scale(1.02); }
        .features-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:15px; margin-top:15px; }
        .feature-item { background:#202050; border-radius:6px; padding:12px; text-align:center; border:1px solid #00ff9940; }
    </style>
</head>
<body>

    <!-- HEADER -->
    <header class="header">
        <div class="neon-text" style="font-size:22px; font-weight:bold;">⚡ StreamClean.live <span class="gold-text" style="font-size:16px;">⭐ PREMIUM</span></div>
        <div>
            <?php if($_SESSION['is_owner']): ?><span class="gold-text" style="margin-right:15px;">👑 OWNER ACCOUNT</span><?php endif; ?>
            <a href="auth.php?logout=1" class="neon-button">🚪 Logout</a>
        </div>
    </header>

    <div class="container">
        <!-- UNLIMITED BADGE -->
        <div class="unlimited-badge">
            <h3 class="gold-text" style="margin-bottom:5px;">⭐ UNLIMITED STORAGE — NO LIMITS EVER</h3>
            <p>✅ Photos + Videos | ✅ Full Editing | ✅ NO ADS | ✅ Anti‑Theft | ✅ Global Scan & Remove</p>
        </div>

        <!-- ✅ UPLOAD ENGINE — FULL ACCESS -->
        <div class="card">
            <h3 class="neon-text">📤 ADD FILES — EVERYTHING ALLOWED</h3>
            <div class="upload-area">
                <!-- 1. CHOOSE FROM FILES -->
                <label class="upload-option">
                    <span style="font-size:30px;">📁</span>
                    <p>From My Device</p>
                    <input type="file" multiple accept="image/*,video/*" style="display:none;">
                </label>

                <!-- 2. TAKE PHOTO / VIDEO -->
                <label class="upload-option">
                    <span style="font-size:30px;">📸</span>
                    <p>Take Photo / Video</p>
                    <input type="file" accept="image/*,video/*" capture="environment" style="display:none;">
                </label>

                <!-- 3. PASTE LINK -->
                <div class="upload-option" onclick="document.getElementById('linkInput').click();">
                    <span style="font-size:30px;">🔗</span>
                    <p>Paste Any Link</p>
                    <input type="text" id="linkInput" placeholder="Paste URL here..." style="display:none;">
                </div>
            </div>
            <p style="color:#00ff99; font-size:14px;">✅ PHOTOS + VIDEOS — UNLIMITED SIZE & AMOUNT</p>
        </div>

        <!-- ✅ NO ADS HERE — 100% CLEAN -->

        <!-- FULL EDITING SUITE -->
        <div class="card">
            <h3 class="neon-text">🎨 FULL EDITING SUITE</h3>
            <div class="features-grid">
                <div class="feature-item">Crop & Resize</div>
                <div class="feature-item">Filters & Effects</div>
                <div class="feature-item">Draw & Text</div>
                <div class="feature-item">Remove Background</div>
                <div class="feature-item">Video Trim & Merge</div>
                <div class="feature-item">Compress & Convert</div>
            </div>
        </div>

        <!-- PREMIUM SECURITY -->
        <div class="card">
            <h3 class="neon-text">🛡️ PREMIUM SECURITY</h3>
            <p>• Anti‑Theft Protection (locks files if device lost)</p>
            <p>• Global Scan & Remove (delete same file everywhere instantly)</p>
            <p>• End‑to‑End Encryption</p>
            <p>• Direct download original quality forever</p>
        </div>

    </div>

</body>
</html>