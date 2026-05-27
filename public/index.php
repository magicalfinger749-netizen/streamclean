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

        /* ✅ CYBERPUNK THEME EXACTLY AS YOU WANTED */
        body { 
            background: #0a0a12; 
            color: #e0e0ff; 
            line-height: 1.6; 
            background-image: linear-gradient(45deg, #0a0a12 0%, #120a20 100%);
        }

        /* HEADER — CYBERPUNK */
        .header { 
            background: rgba(10, 10, 18, 0.8); 
            backdrop-filter: blur(10px);
            border-bottom: 1px solid #00f0ff40;
            box-shadow: 0 0 20px #00f0ff30;
            color: white; 
            padding: 16px 32px; 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
        }
        .header .logo { 
            font-size: 20px; 
            font-weight: 600; 
            text-decoration: none; 
            color: #00f0ff; 
            text-shadow: 0 0 8px #00f0ff;
        }
        .nav a { 
            color: #c0c0ff; 
            text-decoration: none; 
            margin-left: 24px; 
            font-size: 15px; 
            transition: all 0.3s; 
        }
        .nav a:hover { 
            color: #ff00ff; 
            text-shadow: 0 0 8px #ff00ff;
        }

        /* HERO SECTION — CYBERPUNK GLOW */
        .hero { 
            background: linear-gradient(135deg, #0a0a12 0%, #1a0a30 50%, #2a0a40 100%);
            border-bottom: 1px solid #ff00ff40;
            box-shadow: 0 0 40px #00f0ff20;
            color: white; 
            padding: 80px 24px; 
            text-align: center; 
        }
        .hero h1 { 
            font-size: 42px; 
            margin-bottom: 16px; 
            max-width: 800px; 
            margin-left: auto; 
            margin-right: auto; 
            background: linear-gradient(90deg, #00f0ff, #ff00ff);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            text-shadow: 0 0 20px #00f0ff50;
        }
        .hero p { font-size: 18px; opacity: 0.9; max-width: 600px; margin: 0 auto 32px; color: #c0c0ff; }

        .btn { 
            background: linear-gradient(45deg, #00f0ff, #0088ff);
            color: #000; 
            border: none; 
            padding: 12px 28px; 
            border-radius: 4px; 
            font-size: 16px; 
            font-weight: 600; 
            cursor: pointer; 
            text-decoration: none; 
            display: inline-block; 
            transition: all 0.3s; 
            box-shadow: 0 0 12px #00f0ff60;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .btn:hover { 
            transform: translateY(-2px);
            box-shadow: 0 0 20px #00f0ff90;
        }
        .btn.secondary { 
            background: transparent;
            color: #ff00ff; 
            border: 1px solid #ff00ff;
            box-shadow: 0 0 12px #ff00ff40;
        }
        .btn.secondary:hover { 
            background: #ff00ff20;
            box-shadow: 0 0 20px #ff00ff70;
        }

        /* FEATURES — CYBERPUNK CARDS */
        .features { 
            max-width: 1200px; 
            margin: 60px auto; 
            padding: 0 24px; 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
            gap: 32px; 
        }
        .feature-card { 
            background: rgba(20, 20, 40, 0.6); 
            border: 1px solid #00f0ff30;
            border-radius: 6px; 
            box-shadow: 0 0 15px #00f0ff20; 
            padding: 24px; 
            text-align: center; 
            transition: all 0.3s; 
            backdrop-filter: blur(5px);
        }
        .feature-card:hover { 
            transform: translateY(-4px); 
            border-color: #ff00ff80;
            box-shadow: 0 0 25px #ff00ff30; 
        }
        .feature-card h3 { 
            color: #00f0ff; 
            margin-bottom: 12px; 
            text-shadow: 0 0 6px #00f0ff50;
        }
        .feature-card p { color: #b0b0e0; font-size: 15px; }

        /* PRICING — CYBERPUNK NEON */
        .pricing { 
            max-width: 900px; 
            margin: 60px auto; 
            padding: 0 24px; 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
            gap: 24px; 
        }
        .price-card { 
            background: rgba(20, 20, 40, 0.6); 
            border-radius: 6px; 
            box-shadow: 0 0 15px #00f0ff20; 
            padding: 32px; 
            text-align: center; 
            border-top: 3px solid transparent;
            backdrop-filter: blur(5px);
            transition: all 0.3s;
        }
        .price-card.free { 
            border-color: #00f0ff60; 
        }
        .price-card.premium { 
            border-color: #ff00ff; 
            transform: scale(1.05); 
            box-shadow: 0 0 30px #ff00ff40; 
        }
        .price-card:hover {
            transform: translateY(-4px);
        }
        .price-card h3 { font-size: 24px; margin-bottom: 8px; color: #fff; }
        .price { 
            font-size: 36px; 
            font-weight: 700; 
            margin-bottom: 24px; 
            background: linear-gradient(90deg, #00f0ff, #ff00ff);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            text-shadow: 0 0 10px #00f0ff40;
        }
        .price span { font-size: 14px; font-weight: 400; color: #b0b0e0; }
        .features-list { list-style: none; margin-bottom: 32px; text-align: left; }
        .features-list li { 
            padding: 8px 0; 
            border-bottom: 1px solid #303060; 
            color: #d0d0ff; 
        }
        .features-list li::before { 
            content: "⚡"; 
            color: #00f0ff; 
            font-weight: bold; 
            margin-right: 8px; 
        }

        /* FOOTER — CYBERPUNK */
        footer { 
            background: rgba(10, 10, 18, 0.9); 
            border-top: 1px solid #ff00ff40;
            color: #8080c0; 
            text-align: center; 
            padding: 24px; 
            margin-top: 60px; 
            font-size: 14px; 
            box-shadow: 0 0 20px #00f0ff20;
        }
    </style>
</head>
<body>

    <!-- HEADER -->
    <div class="header">
        <a href="/index.php" class="logo">STREAMCLEAN</a>
        <div class="nav">
            <a href="/index.php">HOME</a>
            <?php if (isset($_SESSION['user_id'])): ?>
                <a href="/dashboard.php">DASHBOARD</a>
                <a href="/auth.php?logout=1">LOGOUT</a>
            <?php else: ?>
                <a href="/auth.php">LOGIN</a>
                <a href="/auth.php">SIGN UP</a>
            <?php endif; ?>
        </div>
    </div>

    <!-- HERO SECTION -->
    <div class="hero">
        <h1>CLEAN • OPTIMIZE • ENHANCE</h1>
        <p>Next-gen media processing — compress, edit, convert, and store with cyber-grade speed & quality.</p>
        <div>
            <?php if (isset($_SESSION['user_id'])): ?>
                <a href="/dashboard.php" class="btn">Enter Dashboard</a>
            <?php else: ?>
                <a href="/auth.php" class="btn">Get Started — FREE</a>
                <a href="/auth.php" class="btn secondary">Login</a>
            <?php endif; ?>
        </div>
    </div>

    <!-- MAIN FEATURES -->
    <div class="features">
        <div class="feature-card">
            <h3>IMAGE OPTIMIZATION</h3>
            <p>Compress without loss, resize, crop, rotate, convert JPG, PNG, WebP, GIF, BMP.</p>
        </div>
        <div class="feature-card">
            <h3>VIDEO TOOLS</h3>
            <p>Trim, cut, merge, compress, change resolution, adjust bitrate, convert MP4, MOV, AVI, WebM.</p>
        </div>
        <div class="feature-card">
            <h3>AI EDITING</h3>
            <p>Remove backgrounds, enhance quality, upscale, color correction — neural-powered tools.</p>
        </div>
        <div class="feature-card">
            <h3>SECURE STORAGE</h3>
            <p>Encrypted cloud storage, fast access, one-click download, share links, auto-backup.</p>
        </div>
        <div class="feature-card">
            <h3>BATCH PROCESSING</h3>
            <p>Process hundreds of files at once — compress, rename, resize, convert entire folders.</p>
        </div>
        <div class="feature-card">
            <h3>PRIVACY FIRST</h3>
            <p>Files are private, encrypted, never shared, auto-deleted after 30 days or on demand.</p>
        </div>
    </div>

    <!-- PRICING SECTION -->
    <div class="pricing">
        <div class="price-card free">
            <h3>FREE TIER</h3>
            <div class="price">£0<span>/mo</span></div>
            <ul class="features-list">
                <li>Up to 200,000 images</li>
                <li>Images only — no video</li>
                <li>Basic editing tools</li>
                <li>Max 2MB per file</li>
                <li>Standard processing speed</li>
            </ul>
            <a href="/auth.php" class="btn secondary w-full">SELECT</a>
        </div>

        <div class="price-card premium">
            <h3>PREMIUM</h3>
            <div class="price">£10.99<span>/mo</span></div>
            <ul class="features-list">
                <li>Unlimited storage</li>
                <li>Images + Videos supported</li>
                <li>Full editing suite + AI tools</li>
                <li>Max 100MB per file</li>
                <li>Fast priority processing</li>
                <li>Batch processing</li>
                <li>Background removal</li>
            </ul>
            <a href="/auth.php" class="btn w-full">UPGRADE</a>
        </div>
    </div>

    <!-- FOOTER -->
    <footer>
        © 2026 StreamClean — SYSTEM ONLINE
    </footer>

</body>
</html>
