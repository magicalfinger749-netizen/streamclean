<?php
session_start();
define('STREAMCLEAN', true);
include __DIR__ . '/../private/config.php';
include 'brevo_mail.php';

$message = "";
$messageType = "";

try {
    $pdo = new PDO("pgsql:host=$host;dbname=$dbname", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // ✅ CREATE ALL TABLES AUTOMATICALLY
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

    // ✅ CREATE OWNER ACCOUNT AUTOMATICALLY
    $check_owner = $pdo->query("SELECT id FROM \"users\" WHERE email = '$OWNER_EMAIL'")->rowCount();
    if($check_owner == 0) {
        $hash_pass = password_hash($OWNER_PASS, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO \"users\" (email, password, plan, verified, hidden) VALUES (?, ?, 'premium', 1, ?)");
        $stmt->execute([$OWNER_EMAIL, $hash_pass, $OWNER_HIDDEN ? 1 : 0]);
    }

    // ✅ HANDLE SIGNUP
    if($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST['action']) && $_POST['action'] === 'signup') {
        $email = trim($_POST['email']);
        $pass = $_POST['password'];

        if(empty($email) || empty($pass)) {
            $message = "❌ Please fill in all fields";
            $messageType = "error";
        } elseif(strlen($pass) < 6) {
            $message = "❌ Password must be at least 6 characters";
            $messageType = "error";
        } else {
            $check = $pdo->prepare("SELECT id FROM \"users\" WHERE email = ?");
            $check->execute([$email]);
            if($check->rowCount() > 0) {
                $message = "❌ Email already registered";
                $messageType = "error";
            } else {
                $hash_pass = password_hash($pass, PASSWORD_DEFAULT);
                $stmt = $pdo->prepare("INSERT INTO \"users\" (email, password, verified) VALUES (?, ?, ?)");
                $stmt->execute([$email, $hash_pass, $REQUIRE_EMAIL_VERIFICATION ? 0 : 1]);
                
                if($REQUIRE_EMAIL_VERIFICATION) {
                    sendVerificationEmail($email);
                    $message = "✅ Account created! Check your email to verify.";
                } else {
                    $message = "✅ Account created! You can login now.";
                }
                $messageType = "success";
            }
        }
    }

    // ✅ HANDLE LOGIN
    if($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST['action']) && $_POST['action'] === 'login') {
        $email = trim($_POST['email']);
        $pass = $_POST['password'];

        $stmt = $pdo->prepare("SELECT * FROM \"users\" WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if($user && password_verify($pass, $user['password'])) {
            if($user['verified'] == 0 && $REQUIRE_EMAIL_VERIFICATION) {
                $message = "⚠️ Please verify your email first";
                $messageType = "error";
            } else {
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['user_email'] = $user['email'];
                $_SESSION['user_plan'] = $user['plan'];
                header("Location: /dashboard.php");
                exit;
            }
        } else {
            $message = "❌ Invalid email or password";
            $messageType = "error";
        }
    }

    // ✅ HANDLE FORGOT PASSWORD
    if($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST['action']) && $_POST['action'] === 'forgot') {
        $email = trim($_POST['email']);
        
        $check = $pdo->prepare("SELECT id FROM \"users\" WHERE email = ?");
        $check->execute([$email]);
        if($check->rowCount() == 0) {
            $message = "❌ Email not found";
            $messageType = "error";
        } else {
            // Create reset token
            $token = bin2hex(random_bytes(32));
            $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));
            
            // Delete old tokens
            $pdo->prepare("DELETE FROM \"password_resets\" WHERE email = ?")->execute([$email]);
            
            // Save new token
            $stmt = $pdo->prepare("INSERT INTO \"password_resets\" (email, token, expires_at) VALUES (?, ?, ?)");
            $stmt->execute([$email, $token, $expires]);
            
            // Send email
            sendPasswordResetEmail($email, $token);
            $message = "✅ Reset link sent to your email (valid 1 hour)";
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
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: Arial, sans-serif;
        }
        body {
            background: #f0f2f5;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 400px;
        }
        h2 {
            text-align: center;
            margin-bottom: 20px;
            color: #1a73e8;
        }
        .message {
            padding: 12px;
            margin-bottom: 15px;
            border-radius: 5px;
            text-align: center;
            font-weight: 500;
        }
        .message.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .message.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .tab-buttons {
            display: flex;
            margin-bottom: 20px;
            border-bottom: 1px solid #ddd;
        }
        .tab-btn {
            flex: 1;
            padding: 10px;
            border: none;
            background: none;
            cursor: pointer;
            font-size: 16px;
            font-weight: 500;
            color: #666;
            border-bottom: 3px solid transparent;
        }
        .tab-btn.active {
            color: #1a73e8;
            border-bottom: 3px solid #1a73e8;
        }
        .form {
            display: none;
        }
        .form.active {
            display: block;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            color: #555;
        }
        input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
        }
        button[type="submit"] {
            width: 100%;
            padding: 12px;
            background: #1a73e8;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.3s;
            margin-bottom: 10px;
        }
        button[type="submit"]:hover {
            background: #1557b0;
        }
        .link {
            text-align: right;
            margin-top: -8px;
            margin-bottom: 10px;
        }
        .link a {
            color: #1a73e8;
            text-decoration: none;
            font-size: 14px;
        }
        .link a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>StreamClean</h2>

        <?php if(!empty($message)): ?>
            <div class="message <?php echo $messageType; ?>">
                <?php echo $message; ?>
            </div>
        <?php endif; ?>

        <div class="tab-buttons">
            <button class="tab-btn active" onclick="showTab('login')">Login</button>
            <button class="tab-btn" onclick="showTab('signup')">Create Account</button>
            <button class="tab-btn" onclick="showTab('forgot')">Reset</button>
        </div>

        <!-- LOGIN FORM -->
        <form class="form active" id="login-form" method="POST" action="">
            <input type="hidden" name="action" value="login">
            <div class="form-group">
                <label>Email Address</label>
                <input type="email" name="email" required>
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" name="password" required>
            </div>
            <div class="link">
                <a href="#" onclick="showTab('forgot'); return false;">Forgot Password?</a>
            </div>
            <button type="submit">🔐 Login</button>
        </form>

        <!-- SIGNUP FORM -->
        <form class="form" id="signup-form" method="POST" action="">
            <input type="hidden" name="action" value="signup">
            <div class="form-group">
                <label>Email Address</label>
                <input type="email" name="email" required>
            </div>
            <div class="form-group">
                <label>Create Password</label>
                <input type="password" name="password" required minlength="6">
            </div>
            <button type="submit">✅ Create Account</button>
        </form>

        <!-- FORGOT PASSWORD FORM -->
        <form class="form" id="forgot-form" method="POST" action="">
            <input type="hidden" name="action" value="forgot">
            <div class="form-group">
                <label>Enter Your Email</label>
                <input type="email" name="email" required>
            </div>
            <button type="submit">📩 Send Reset Link</button>
        </form>
    </div>

    <script>
        function showTab(tabName) {
            document.querySelectorAll('.form').forEach(f => f.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            
            document.getElementById(tabName + '-form').classList.add('active');
            event.target.classList.add('active');
        }
    </script>
</body>
</html>
