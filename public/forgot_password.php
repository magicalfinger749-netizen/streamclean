<?php
session_start();
// ✅ FIXED PATH FOR YOU
define('STREAMCLEAN', true);
include 'C:/Users/hashim - Personal/Documents/config.php';
include 'brevo_mail.php';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die("System error — please try again later");
}

// ✅ SEND RESET LINK
if(isset($_POST['send_reset'])) {
    $email = trim($_POST['email']);
    
    $check = $pdo->prepare("SELECT id FROM users WHERE email = ? AND verified = 1");
    $check->execute([$email]);
    
    if($check->rowCount() == 0) {
        $error = "❌ Email not found or not verified";
    } else {
        // CREATE SECURE TOKEN
        $token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', strtotime('+15 minutes'));
        
        // DELETE OLD TOKENS
        $pdo->prepare("DELETE FROM password_resets WHERE email = ?")->execute([$email]);
        
        // SAVE NEW TOKEN
        $stmt = $pdo->prepare("INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)");
        $stmt->execute([$email, $token, $expires]);
        
        // SEND EMAIL
        sendResetLink($email, $token);
        $success = "✅ Reset link sent! Check your inbox (valid 15 mins)";
    }
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>Reset Password | StreamClean.live</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin:0; padding:0; box-sizing:border-box; font-family:Arial; }
        body { background:#0a0a1f; color:#fff; padding:50px; background-image:linear-gradient(135deg, #0a0a1f 0%, #1a1a40 100%); min-height:100vh; }
        .box { max-width:400px; margin:0 auto; border:2px solid #00ffff; padding:30px; border-radius:8px; box-shadow:0 0 15px #00ffff40; text-align:center; }
        .neon-text { color:#00ffff; margin-bottom:20px; text-shadow:0 0 5px #00ffff; }
        input { width:100%; padding:12px; margin:8px 0; background:#1a1a40; border:1px solid #00ffff50; color:#fff; border-radius:4px; font-size:16px; }
        button { width:100%; padding:12px; background:transparent; color:#00ffff; border:2px solid #00ffff; cursor:pointer; font-weight:bold; font-size:16px; border-radius:4px; transition:0.3s; }
        button:hover { background:#00ffff; color:#0a0a1f; box-shadow:0 0 10px #00ffff; }
        .error { background:#ff446620; color:#ff4466; padding:10px; border-radius:4px; margin-bottom:15px; }
        .success { background:#00ff9920; color:#00ff99; padding:10px; border-radius:4px; margin-bottom:15px; }
        a { color:#00ffff80; text-decoration:none; }
        a:hover { color:#00ffff; text-decoration:underline; }
    </style>
</head>
<body>
    <div class="box">
        <h2 class="neon-text">🔑 FORGOT PASSWORD</h2>
        
        <?php if(isset($error)) echo "<div class='error'>$error</div>"; ?>
        <?php if(isset($success)) echo "<div class='success'>$success</div>"; ?>

        <form method="post">
            <input type="email" name="email" placeholder="Your registered email" required>
            <button type="submit" name="send_reset">📨 SEND RESET LINK</button>
        </form>

        <div style="margin-top:20px;">
            <a href="auth.php">← Back to Login</a>
        </div>
    </div>
</body>
</html>