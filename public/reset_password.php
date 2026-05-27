<?php
session_start();
// ✅ FIXED PATH FOR YOU
define('STREAMCLEAN', true);
include 'C:/Users/hashim - Personal/Documents/config.php';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die("System error — please try again later");
}

// ✅ CHECK IF TOKEN IS VALID
if(!isset($_GET['token'])) { header("Location: auth.php"); exit; }

$token = $_GET['token'];
$check = $pdo->prepare("SELECT email FROM password_resets WHERE token = ? AND expires_at > NOW()");
$check->execute([$token]);
$valid = $check->fetch();

if(!$valid) {
    die("<div style='text-align:center; padding:50px; color:#ff4466;'>❌ Invalid or expired link — request new one</div>");
}

// ✅ UPDATE PASSWORD
if(isset($_POST['new_pass'])) {
    $new_pass = password_hash($_POST['new_password'], PASSWORD_DEFAULT);
    $update = $pdo->prepare("UPDATE users SET password = ? WHERE email = ?");
    $update->execute([$new_pass, $valid['email']]);
    
    // DELETE USED TOKEN
    $pdo->prepare("DELETE FROM password_resets WHERE email = ?")->execute([$valid['email']]);
    
    $success = "✅ Password updated! <a href='auth.php' style='color:#00ffff;'>Login now</a>";
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>New Password | StreamClean.live</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin:0; padding:0; box-sizing:border-box; font-family:Arial; }
        body { background:#0a0a1f; color:#fff; padding:50px; background-image:linear-gradient(135deg, #0a0a1f 0%, #1a1a40 100%); min-height:100vh; }
        .box { max-width:400px; margin:0 auto; border:2px solid #00ffff; padding:30px; border-radius:8px; box-shadow:0 0 15px #00ffff40; text-align:center; }
        .neon-text { color:#00ffff; margin-bottom:20px; text-shadow:0 0 5px #00ffff; }
        input { width:100%; padding:12px; margin:8px 0; background:#1a1a40; border:1px solid #00ffff50; color:#fff; border-radius:4px; font-size:16px; }
        button { width:100%; padding:12px; background:transparent; color:#00ffff; border:2px solid #00ffff; cursor:pointer; font-weight:bold; font-size:16px; border-radius:4px; transition:0.3s; }
        button:hover { background:#00ffff; color:#0a0a1f; box-shadow:0 0 10px #00ffff; }
        .success { color:#00ff99; padding:20px; }
    </style>
</head>
<body>
    <div class="box">
        <h2 class="neon-text">🔓 CREATE NEW PASSWORD</h2>
        
        <?php if(isset($success)) echo "<div class='success'>$success</div>"; ?>

        <?php if(!isset($success)): ?>
        <form method="post">
            <input type="password" name="new_password" placeholder="New password (min 6 chars)" required minlength="6">
            <button type="submit" name="new_pass">✅ UPDATE PASSWORD</button>
        </form>
        <?php endif; ?>
    </div>
</body>
</html>