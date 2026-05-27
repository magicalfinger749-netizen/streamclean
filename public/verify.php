<?php
session_start();
include __DIR__ . '/../private/config.php';

try {
    $pdo = new PDO("pgsql:host=$host;dbname=$dbname", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if(isset($_GET['email'])) {
        $email = urldecode($_GET['email']);
        $stmt = $pdo->prepare("UPDATE \"users\" SET verified = 1 WHERE email = ?");
        $stmt->execute([$email]);
        echo "<div style='background:#0a0a12; color:#00f0ff; padding:50px; text-align:center; font-family:Arial;'>
            <h1 style='text-shadow:0 0 10px #00f0ff;'>✅ EMAIL VERIFIED</h1>
            <p>Your account is now active — <a href='/auth.php' style='color:#ff00ff;'>Login here</a></p>
        </div>";
    }
} catch(Exception $e) { echo "Error"; }
?>
