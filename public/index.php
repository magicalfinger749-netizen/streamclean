<?php
session_start();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StreamClean - Clean & Optimize Your Media</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Roboto, sans-serif; }
        body { background: #f5f7fa; color: #1e293b; line-height: 1.6; }

        /* HEADER — YOUR EXACT THEME */
        .header { background: #0b1a3f; color: white; padding: 16px 32px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
        .header .logo { font-size: 20px; font-weight: 600; text-decoration: none; color: white; }
        .nav a { color: #cbd5e1; text-decoration: none; margin-left: 24px; font-size: 15px; transition: color 0.2s; }
        .nav a:hover { color: white; }

        /* HERO SECTION */
        .hero { background: linear-gradient(135deg, #0b1a3f 0%, #165DFF 100%); color: white; padding: 80px 24px; text-align: center; }
        .hero h1 { font-size: 42px; margin-bottom: 16px; max-width: 800px; margin-left: auto; margin-right: auto; }
        .hero p { font-size: 18px; opacity: 0.9; max-width: 600px; margin: 0 auto 32px; }

        .btn { background: #165DFF; color: white; border: none; padding: 12px 28px; border-radius: 6px; font-size: 16px; font-weight: 500; cursor: pointer; text-decoration: none; display: inline-block; transition: background 0.2s; }
        .btn:hover { background: #0f48c9; }
        .btn.secondary { background: white; color: #165DFF; margin-left: 12px; }
        .btn.secondary:hover { background: #f1f5f9; }

        /* FEATURES SECTION */
        .features { max-width: 1200px; margin: 60px auto; padding: 0 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 32px; }
        .feature-card { background: white; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; transition: transform 0.2s; }
        .feature-card:hover { transform: translateY(-4px); }
        .feature-card h3 { color: #0b1a3f; margin-bottom: 12px; }
        .feature-card p { color: #64748b; font-size: 15px; }

        /* PRICING SECTION */
        .pricing { max-width: 900px; margin: 60px auto; padding: 0 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
        .price-card { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 32px; text-align: center; border-top: 4px solid transparent; }
        .price-card.free { border-color: #e2e8f0; }
        .price-card.premium { border-color: #165DFF; transform: scale(1.05); box-shadow: 0 4px 12px rgba(22, 93, 255, 0.15); }
        .price-card h3 { font-size: 24px; margin-bottom: 8px; color: #0b1a3f; }
        .price { font-size: 32px; font-weight: 700; margin-bottom: 24px; color: #0b1a3f; }
        .price span { font-size: 14px; font-weight: 400; color: #64748b; }
        .features-list { list-style: none; margin-bottom: 32px; }
        .features-list li { padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #334155; }
        .features-list li::before { content: "✓"; color: #165DFF; font-weight: bold; margin-right: 8px; }

        /* FOOTER */
        footer { background: #0b1a3f; color: white; text-align: center; padding: 24px; margin-top: 60px; font-size: 14px; }
    </style>
</head>
<body>

    <!-- HEADER -->
    <div class="header">
        <a href="/index.php" class="logo">StreamClean</a>
        <div class="nav">
            <a href="/index.php">Home</a>
            <?php if (isset($_SESSION['user_id'])): ?>
                <a href="/dashboard.php">Dashboard</a>
                <a href="/auth.php?logout=1">Logout</a>
            <?php else: ?>
                <a href="/auth.php">Login</a>
                <a href="/auth.php">Create Account</a>
            <?php endif; ?>
        </div>
    </div>

    <!-- HERO SECTION -->
    <div class="hero">
        <h1>Clean, Optimize & Enhance Your Media</h1>
        <p>Compress images, convert formats, remove backgrounds, edit videos, and store files securely — all in one professional platform.</p>
        <div>
            <?php if (isset($_SESSION['user_id'])): ?>
                <a href="/dashboard.php" class="btn">Go to Dashboard</a>
            <?php else: ?>
                <a href="/auth.php" class="btn">Get Started — Free</a>
                <a href="/auth.php" class="btn secondary">Login</a>
            <?php endif; ?>
        </div>
    </div>

    <!-- MAIN FEATURES -->
    <div class="features">
        <div class="feature-card">
            <h3>Image Optimization</h3>
            <p>Compress without quality loss, resize, crop, rotate, and convert between JPG, PNG, WebP, GIF, BMP.</p>
        </div>
        <div class="feature-card">
            <h3>Video Tools</h3>
            <p>Trim, cut, merge, compress, change resolution, adjust bitrate, and convert MP4, MOV, AVI, WebM.</p>
        </div>
        <div class="feature-card">
            <h3>AI Editing</h3>
            <p>Remove backgrounds automatically, enhance quality, upscale resolution, color correction, and more.</p>
        </div>
        <div class="feature-card">
            <h3>Secure Storage</h3>
            <p>Private cloud storage, fast access, one-click download, share links, and automatic backup.</p>
        </div>
        <div class="feature-card">
            <h3>Batch Processing</h3>
            <p>Process hundreds of files at once — compress, rename, resize, or convert entire folders.</p>
        </div>
        <div class="feature-card">
            <h3>Privacy First</h3>
            <p>Files are private, never shared, deleted automatically after 30 days or when you delete them.</p>
        </div>
    </div>

    <!-- PRICING SECTION -->
    <div class="pricing">
        <div class="price-card free">
            <h3>Free Plan</h3>
            <div class="price">£0<span>/month</span></div>
            <ul class="features-list">
                <li>Up to 200,000 images</li>
                <li>Images only (no video)</li>
                <li>Basic editing tools</li>
                <li>Max 2MB per file</li>
                <li>Standard processing speed</li>
            </ul>
            <a href="/auth.php" class="btn secondary w-full">Get Free</a>
        </div>

        <div class="price-card premium">
            <h3>Premium</h3>
            <div class="price">£10.99<span>/month</span></div>
            <ul class="features-list">
                <li>Unlimited storage</li>
                <li>Images + Videos supported</li>
                <li>Full editing suite + AI tools</li>
                <li>Max 100MB per file</li>
                <li>Fast priority processing</li>
                <li>Batch processing</li>
                <li>Remove backgrounds</li>
            </ul>
            <a href="/auth.php" class="btn w-full">Get Premium</a>
        </div>
    </div>

    <!-- FOOTER -->
    <footer>
        © 2026 StreamClean — All rights reserved
    </footer>

</body>
</html>
