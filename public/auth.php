<?php
session_start();
// ✅ LOAD SECRET CONFIG FROM PRIVATE FOLDER
define('STREAMCLEAN', true);
include __DIR__ . '/../private/config.php';
include 'brevo_mail.php';

// CONNECT TO DATABASE
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die("System error — please try again later");
}

// ✅ CREATE YOUR SPECIAL ACCOUNT AUTOMATICALLY (RUNS ONCE ONLY)
$check_owner = $pdo->query("SELECT id FROM users WHERE email = '$OWNER_EMAIL'")->rowCount();
if($check_owner == 0) {
    $hash_pass = password_hash($OWNER_PASS, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO users (email, password, plan, verified, hidden) VALUES (?, ?, 'premium', 1, 1)");
    $stmt->execute([$OWNER_EMAIL, $hash_pass]);
}

// ✅ SIGNUP PROCESS
if(isset($_POST['signup'])) {
    $email = trim($_POST['email']);
    $pass = password_hash($_POST['password'], PASSWORD_DEFAULT);
    
    // CHECK IF EMAIL ALREADY EXISTS
    $exists = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $exists->execute([$email]);
    if($exists->rowCount() > 0) {
        $error = "❌ Email already registered";
    } else {
        // GENERATE 6‑DIGIT VERIFICATION CODE
        $code = rand(100000, 999999);
        $_SESSION['verify_code'] = $code;
        $_SESSION['temp_email']  = $email;
        $_SESSION['temp_pass']   = $pass;

        // SEND CODE VIA BREVO
        sendVerificationCode($email, $code);
        header("Location: verify.php");
        exit;
    }
}

// ✅ LOGIN PROCESS
if(isset($_POST['login'])) {
    $email = $_POST['email'];
    $pass  = $_POST['password'];

    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if($user && password_verify($pass, $user['password'])) {
        if($user['verified'] == 0) {
            $error = "❌ Please verify your email first";
        } else {
            // SAVE SESSION DATA
            $_SESSION['user_id']    = $user['id'];
            $_SESSION['user_email'] = $user['email'];
            $_SESSION['user_plan']  = $user['plan'];
            $_SESSION['is_owner']   = ($user['email'] == $OWNER_EMAIL) ? true : false;

            // REDIRECT TO CORRECT DASHBOARD
            if($user['plan'] == 'premium') {
                header("Location: dashboard_premium.php");
            } else {
                header("Location: dashboard_free.php");
            }
            exit;
        }
    } else {
        $error = "❌ Wrong email or password";
    }
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>StreamClean.live | Login / Signup</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin:0; padding:0; box-sizing:border-box; font-family:Arial; }
        body { background:#0a0a1f; color:#fff; padding:50px; background-image: linear-gradient(135deg, #0a0a1f 0%, #1a1a40 100%); min-height:100vh; }
        .form-box { max-width:400px; margin:0 auto; border:2px solid #00ffff; padding:30px; border-radius:8px; box-shadow:0 0 15px #00ffff40; }
        .neon-text { color:#00ffff; text-align:center; margin-bottom:20px; text-shadow:0 0 5px #00ffff; }
        input { width:100%; padding:12px; margin:8px 0; background:#1a1a40; border:1px solid #00ffff50; color:#fff; border-radius:4px; font-size:16px; }
        button { width:100%; padding:12px; background:transparent; color:#00ffff; border:2px solid #00ffff; cursor:pointer; font-weight:bold; font-size:16px; border-radius:4px; transition:0.3s; }
        button:hover { background:#00ffff; color:#0a0a1f; box-shadow:0 0 10px #00ffff; }
        .error { background:#ff446620; color:#ff4466; padding:10px; border-radius:4px; margin-bottom:15px; text-align:center; }
        .link { text-align:center; margin-top:15px; font-size:14px; }
        .link a { color:#00ffff80; text-decoration:none; }
        .link a:hover { color:#00ffff; text-decoration:underline; }
    </style>
</head>
<body>
    <div class="form-box">
        <h2 class="neon-text">⚡ StreamClean.live</h2>
        <h3 style="text-align:center; margin-bottom:20px;">Create Account / Login</h3>
        
        <?php if(isset($error)) echo "<div class='error'>$error</div>"; ?>

        <form method="post">
            <input type="email" name="email" placeholder="Your Email Address" required>
            <input type="password" name="password" placeholder="Your Password (min 6 chars)" required minlength="6">
            
            <button type="submit" name="signup">📝 SIGN UP — FREE 200,000 PHOTOS</button>
            <br><br>
            <button type="submit" name="login">🔑 LOGIN</button>
        </form>

        <div class="link">
            <a href="forgot_password.php">Forgot Password?</a>
        </div>
        <div class="link">
            <a href="index.html">← Back to Home</a>
        </div>
    </div>
</body>
</html>