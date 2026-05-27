<?php
session_start();
include __DIR__ . '/../private/config.php';

try {
    $pdo = new PDO("pgsql:host=$host;dbname=$dbname", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if(isset($_GET['email'], $_GET['token'])) {
        $email = urldecode($_GET['email']);
        $token = $_GET['token'];

        $check = $pdo->prepare("SELECT * FROM \"password_resets\" WHERE email=? AND token=? AND expires_at > NOW()");
        $check->execute([$email, $token]);

        if($check->rowCount() == 0) {
            echo "<div style='background:#0a0a12; color:#ff00ff; padding:50px; text-align:center;'><h1>❌ Invalid or expired link</h1></div>";
            exit;
        }

        if($_SERVER["REQUEST_METHOD"] === "POST") {
            $pass = password_hash($_POST['password'], PASSWORD_DEFAULT);
            $pdo->prepare("UPDATE \"users\" SET password=? WHERE email=?")->execute([$pass, $email]);
            $pdo->prepare("DELETE FROM \"password_resets\" WHERE email=?")->execute([$email]);
            echo "<div style='background:#0a0a12; color:#00f0ff; padding:50px; text-align:center;'><h1>✅ PASSWORD UPDATED</h1><a href='/auth.php' style='color:#ff00ff;'>Login</a></div>";
            exit;
        }
?>
<!DOCTYPE html>
<html style='background:#0a0a12; color:#e0e0ff;'>
<body style='display:flex; justify-content:center; align-items:center; min-height:100vh;'>
    <form method="POST" style='background:rgba(20,20,40,0.6); border:1px solid #ff00ff; border-radius:8px; padding:30px; box-shadow:0 0 20px #ff00ff30;'>
        <h2 style='color:#ff00ff; text-align:center;'>NEW PASSWORD</h2>
        <input type="password" name="password" required minlength="6" style='width:100%; padding:10px; margin:15px 0; background:#111; border:1px solid #ff00ff; color:#fff; border-radius:4px;'>
        <button type="submit" style='width:100%; padding:12px; background:linear-gradient(45deg,#ff00ff,#b000ff); color:#000; border:none; border-radius:4px; font-weight:bold;'>UPDATE</button>
    </form>
</body>
</html>
<?php
    }
} catch(Exception $e) { echo "Error"; }
?>
