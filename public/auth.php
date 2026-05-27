<?php
session_start();
define('STREAMCLEAN', true);
include __DIR__ . '/../private/config.php';
include 'brevo_mail.php';

try {
    $pdo = new PDO("pgsql:host=$host;dbname=$dbname", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // ✅ AUTOMATICALLY CREATE TABLES — NO DB TOOL NEEDED!
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

    // ✅ CREATE OWNER ACCOUNT
    $check_owner = $pdo->query("SELECT id FROM \"users\" WHERE email = '$OWNER_EMAIL'")->rowCount();
    if($check_owner == 0) {
        $hash_pass = password_hash($OWNER_PASS, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO \"users\" (email, password, plan, verified, hidden) VALUES (?, ?, 'premium', 1, ?)");
        $stmt->execute([$OWNER_EMAIL, $hash_pass, $OWNER_HIDDEN ? 1 : 0]);
    }

    // ✅ SIGNUP
    if(isset($_POST['signup'])) {
        $email = trim($_POST['email']);
        $pass = password_hash($_POST['password'], PASSWORD_DEFAULT);
        $exists = $pdo->prepare("SELECT id FROM \"users\" WHERE email = ?");
        $exists->execute([$email]);
        if($exists->rowCount() > 0) { echo "exists"; exit; }
        $stmt = $pdo->prepare("INSERT INTO \"users\" (email, password, verified) VALUES (?, ?, ?)");
        $stmt->execute([$email, $pass, $REQUIRE_EMAIL_VERIFICATION ? 0 : 1]);
        echo $REQUIRE_EMAIL_VERIFICATION ? "verify" : "success"; exit;
    }

    // ✅ LOGIN
    if(isset($_POST['login'])) {
        $email = trim($_POST['email']);
        $pass = trim($_POST['password']);
        $stmt = $pdo->prepare("SELECT * FROM \"users\" WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if($user && password_verify($pass, $user['password'])) {
            $_SESSION['user'] = $user['id']; $_SESSION['plan'] = $user['plan']; echo "success";
        } else { echo "invalid"; } exit;
    }

} catch(PDOException $e) {
    die("System error — please try again later");
}
