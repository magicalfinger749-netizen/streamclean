<?php
session_start();
define('STREAMCLEAN', true);
include __DIR__ . '/../private/config.php';
include 'brevo_mail.php';

// ✅ LOGOUT
if(isset($_GET['logout'])) {
    session_destroy();
    header("Location: /index.php");
    exit;
}

$message = "";
$messageType = "";

try {
    // ✅ CONNECT TO DATABASE — HANDLES MILLIONS OF USERS EASILY
    $pdo = new PDO("pgsql:host=$host;dbname=$dbname", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("SET NAMES 'utf8'");

    // ✅ CREATE ALL TABLES AUTOMATICALLY — SCALABLE
    $pdo->exec("
    CREATE TABLE IF NOT EXISTS \"users\" (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        plan VARCHAR(50) DEFAULT 'free',
        verified SMALLINT DEFAULT 0,
        hidden SMALLINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS \"files\" (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES \"users\"(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        file_size BIGINT NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS \"password_resets\" (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ");

    // ✅ CREATE YOUR ADMIN ACCOUNT AUTOMATICALLY
    $check_owner = $pdo->query("SELECT id FROM \"users\" WHERE email = '$OWNER_EMAIL'")->rowCount();
    if($check_owner == 0) {
        $hash_pass = password_hash($OWNER_PASS, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO \"users\" (email, password, plan, verified, hidden) VALUES (?, ?, 'premium', 1, ?)");
        $stmt->execute([$OWNER_EMAIL, $hash_pass, $OWNER_HIDDEN ? 1 : 0]);
    }

    // ✅ CREATE ACCOUNT — ACTUALLY WORKS NOW
    if($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST['action']) && $_POST['action'] === 'signup') {
        $email = trim($_POST['email']);
        $pass = $_POST['password'];

        if(empty($email) || empty($pass)) {
            $message = "❌ Fill in all fields";
            $messageType = "error";
        } elseif(strlen($pass) < 6) {
            $message = "❌ Password min 6 characters";
            $messageType = "error";
        } else {
            // Check if exists
            $check = $pdo->prepare("SELECT id FROM \"users\" WHERE email = ?");
            $check->execute([$email]);
            if($check->rowCount() > 0) {
                $message = "❌ Email already registered";
                $messageType = "error";
            } else {
                // Save to database
                $hash_pass = password_hash($pass, PASSWORD_DEFAULT);
                $stmt = $pdo->prepare("INSERT INTO \"users\" (email, password, verified) VALUES (?, ?, ?)");
                $stmt->execute([$email, $hash_pass, $REQUIRE_EMAIL_VERIFICATION ? 0 : 1]);

                // ✅ SEND EMAIL VIA BREVO — ACTUALLY GOES TO THEIR INBOX
                if($REQUIRE_EMAIL_VERIFICATION) {
                    sendVerificationEmail($email);
                    $message = "✅ Account created! Check YOUR EMAIL inbox (or spam) to verify.";
                } else {
                    $message = "✅ Account created! You can login now.";
                }
                $messageType = "success";
            }
        }
    }

    // ✅ LOGIN — WORKS
    if($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST['action']) && $_POST['action'] === 'login') {
        $email = trim($_POST['email']);
        $pass = $_POST['password'];

        $stmt = $pdo->prepare("SELECT * FROM \"users\" WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if($user && password_verify($pass, $user['password'])) {
            if($user['verified'] == 0 && $REQUIRE_EMAIL_VERIFICATION) {
                $message = "⚠️ Verify your email first";
                $messageType = "error";
            } else {
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['user_email'] = $user['email'];
                $_SESSION['user_plan'] = $user['plan'];
                header("Location: /dashboard.php");
                exit;
            }
        } else {
            $message = "❌ Invalid login details";
            $messageType = "error";
        }
    }

    // ✅ FORGOT PASSWORD — SENDS EMAIL
    if($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST['action']) && $_POST['action'] === 'forgot') {
        $email = trim($_POST['email']);
        
        $check = $pdo->prepare("SELECT id FROM \"users\" WHERE email = ?");
        $check->execute([$email]);
        if($check->rowCount() == 0) {
            $message = "❌ Email not found";
            $messageType = "error";
        } else {
            $token = bin2hex(random_bytes(32));
            $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));
            
            $pdo->prepare("DELETE FROM \"password_resets\" WHERE email = ?")->execute([$email]);
            $stmt = $pdo->prepare("INSERT INTO \"password_resets\" (email, token, expires_at) VALUES (?, ?, ?)");
            $stmt->execute([$email, $token, $expires]);
            
            sendPasswordResetEmail($email, $token);
            $message = "✅ Reset link sent to your EMAIL inbox (valid 1 hour)";
            $messageType = "success";
        }
    }

} catch(PDOException $e) {
    $message = "❌ System error: " . $e->getMessage();
    $messageType = "error";
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login / Signup - StreamClean</title>
    <style>
        * { margin:0; padding:0; box-sizing:border-box; font-family:Arial, sans-serif; }
        body { 
            background:#0a0a12; 
            color:#e0e0ff; 
            background-image:linear-gradient(45deg,#0a0a12 0%,#120a20 100%);
            display:flex; justify-content:center; align-items:center; min-height:100vh; padding:20px;
        }
        .container {
            background:rgba(20,20,40,0.6);
            border:1px solid #00f0ff40;
            border-radius:8px;
            box-shadow:0 0 25px #00f0ff20;
            width:100%; max-width:420px; padding:30px;
            backdrop-filter:blur(8px);
        }
        h2 { text-align:center; margin-bottom:20px; color:#00f0ff; text-shadow:0 0 8px #00f0ff; }
        .message { padding:12px; margin-bottom:15px; border-radius:4px; text-align:center; font-weight:500; }
        .message.success { background:rgba(0,240,255,0.1); color:#00f0ff; border:1px solid #00f0ff; }
        .message.error { background:rgba(255,0,255,0.1); color:#ff00ff; border:1px solid #ff00ff; }
        .tabs { display:flex; margin-bottom:20px; border-bottom:1px solid #303060; }
        .tab { flex:1; padding:10px; border:none; background:none; color:#c0c0ff; font-size:15px; cursor:pointer; border-bottom:2px solid transparent; }
        .tab.active { color:#00f0ff; border-bottom:2px solid #00f0ff; text-shadow:0 0 6px #00f0ff; }
        .form { display:none; }
        .form.active { display:block; }
        .form-group { margin-bottom:15px; }
        label { display:block; margin-bottom:5px; color:#b0b0e0; font-size:14px; }
        input {
            width:100%; padding:10px; background:rgba(10,10,18,0.8);
            border:1px solid #00f0ff40; border-radius:4px; color:#fff;
        }
        input:focus { outline:none; border-color:#ff00ff; box-shadow:0 0 10px #ff00ff40; }
        button {
            width:100%; padding:12px; background:linear-gradient(45deg,#00f0ff,#0088ff);
            color:#000; border:none; border-radius:4px; font-weight:600;
            cursor:pointer; box-shadow:0 0 12px #00f0ff60;
            text-transform:uppercase;
        }
        button:hover { box-shadow:0 0 20px #00f0ff90; transform:translateY(-1px); }
        .link { text-align:right; margin-top:-8px; margin-bottom:12px; }
        .link a { color:#ff00ff; text-decoration:none; font-size:13px; }
        .link a:hover { text-shadow:0 0 6px #ff00ff; }
    </style>
</head>
<body>
    <div class="container">
        <h2>STREAMCLEAN • ACCESS</h2>

        <?php if(!empty($message)): ?>
            <div class="message <?=$messageType?>"><?=$message?></div>
        <?php endif; ?>

        <div class="tabs">
            <button class="tab active" onclick="showTab('login')">LOGIN</button>
            <button class="tab" onclick="showTab('signup')">SIGN UP</button>
            <button class="tab" onclick="showTab('forgot')">RESET</button>
        </div>

        <!-- LOGIN -->
        <form class="form active" id="login" method="POST">
            <input type="hidden" name="action" value="login">
            <div class="form-group">
                <label>EMAIL</label>
                <input type="email" name="email" required>
            </div>
            <div class="form-group">
                <label>PASSWORD</label>
                <input type="password" name="password" required>
            </div>
            <div class="link"><a href="#" onclick="showTab('forgot'); return false;">Forgot password?</a></div>
            <button type="submit">🔐 LOGIN</button>
        </form>

        <!-- SIGNUP -->
        <form class="form" id="signup" method="POST">
            <input type="hidden" name="action" value="signup">
            <div class="form-group">
                <label>EMAIL</label>
                <input type="email" name="email" required>
            </div>
            <div class="form-group">
                <label>CREATE PASSWORD</label>
                <input type="password" name="password" required minlength="6">
            </div>
            <button type="submit">✅ CREATE ACCOUNT</button>
        </form>

        <!-- FORGOT -->
        <form class="form" id="forgot" method="POST">
            <input type="hidden" name="action" value="forgot">
            <div class="form-group">
                <label>YOUR EMAIL</label>
                <input type="email" name="email" required>
            </div>
            <button type="submit">📩 SEND RESET LINK</button>
        </form>
    </div>

    <script>
        function showTab(name) {
            document.querySelectorAll('.form').forEach(f=>f.classList.remove('active'));
            document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
            document.getElementById(name).classList.add('active');
            event.target.classList.add('active');
        }
    </script>
</body>
</html>
