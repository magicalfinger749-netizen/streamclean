<?php
session_start();
// ✅ LOAD SECRET CONFIG FROM PRIVATE FOLDER
define('STREAMCLEAN', true);
include __DIR__ . '/../private/config.php';

if(!isset($_SESSION['verify_code'])) { header("Location: auth.php"); exit; }

// ✅ CHECK CODE ENTERED
if(isset($_POST['check_code'])) {
    $input = trim($_POST['code']);
    if($input == $_SESSION['verify_code']) {
        // SAVE VERIFIED USER TO DATABASE
        try {
            $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
            $stmt = $pdo->prepare("INSERT INTO users (email, password, plan, verified, hidden) VALUES (?, ?, 'free', 1, 0)");
            $stmt->execute([$_SESSION['temp_email'], $_SESSION['temp_pass']]);
            
            // CLEAR SESSION DATA
            unset($_SESSION['verify_code'], $_SESSION['temp_email'], $_SESSION['temp_pass']);
            
            $success = "✅ YOUR ACCOUNT IS VERIFIED! <br><a href='auth.php' class='neon-button'>LOGIN NOW</a>";
        } catch(PDOException $e) {
            $error = "❌ Error saving account — try again";
        }
    } else {
        $error = "❌ Wrong code — check your email again";
    }
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>Verify Email | StreamClean.live</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin:0; padding:0; box-sizing:border-box; font-family:Arial; }
        body { background:#0a0a1f; color:#fff; padding:50px; background-image: linear-gradient(135deg, #0a0a1f 0%, #1a1a40 100%); min-height:100vh; }
        .verify-box { max-width:400px; margin:0 auto; border:2px solid #00ffff; padding:30px; border-radius:8px; box-shadow:0 0 15px #00ffff40; text-align:center; }
        .neon-text { color:#00ffff; margin-bottom:20px; text-shadow:0 0 5px #00ffff; }
        input { width:100%; padding:15px; margin:15px 0; background:#1a1a40; border:1px solid #00ffff50; color:#fff; border-radius:4px; font-size:20px; text-align:center; letter-spacing:5px; }
        button { width:100%; padding:12px; background:transparent; color:#00ffff; border:2px solid #00ffff; cursor:pointer; font-weight:bold; font-size:16px; border-radius:4px; transition:0.3s; }
        button:hover { background:#00ffff; color:#0a0a1f; box-shadow:0 0 10px #00ffff; }
        .success { color:#00ff99; padding:20px; }
        .error { color:#ff4466; padding:10px; }
        .neon-button { background:transparent; color:#00ffff; border:2px solid #00ffff; padding:12px 30px; border-radius:4px; font-size:16px; cursor:pointer; transition:all 0.3s ease; text-decoration:none; display:inline-block; box-shadow:0 0 8px #00ffff; margin-top:20px; }
        .neon-button:hover { background:#00ffff; color:#0a0a1f; box-shadow:0 0 15px #00ffff, 0 0 30px #00ffff; }
    </style>
</head>
<body>
    <div class="verify-box">
        <h2 class="neon-text">🔐 EMAIL VERIFICATION</h2>
        
        <?php if(isset($error)) echo "<div class='error'>$error</div>"; ?>
        <?php if(isset($success)) echo "<div class='success'>$success</div>"; ?>

        <?php if(!isset($success)): ?>
        <p>We sent a 6‑digit code to: <b><?= $_SESSION['temp_email'] ?></b></p>
        <br>
        <form method="post">
            <input type="text" name="code" maxlength="6" placeholder="000000" required>
            <button type="submit" name="check_code">✅ VERIFY MY ACCOUNT</button>
        </form>
        <?php endif; ?>

        <div style="margin-top:20px;">
            <a href="auth.php" style="color:#00ffff80; text-decoration:none;">← Back to Login</a>
        </div>
    </div>
</body>
</html>