<?php
session_start();
// ✅ LOAD SECRET CONFIG FROM PRIVATE FOLDER
define('STREAMCLEAN', true);
include __DIR__ . '/../private/config.php';
include 'brevo_mail.php';

// ✅ CONNECT TO DATABASE
try {
    $pdo = new PDO("pgsql:host=$host;dbname=$dbname", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die("System error — please try again later");
}

// ✅ CREATE YOUR SPECIAL OWNER ACCOUNT — FIXED TABLE NAME
$check_owner = $pdo->query("SELECT id FROM \"users\" WHERE email = '$OWNER_EMAIL'")->rowCount();
if($check_owner == 0) {
    $hash_pass = password_hash($OWNER_PASS, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO \"users\" (email, password, plan, verified, hidden) VALUES (?, ?, 'premium', 1, ?)");
    $stmt->execute([$OWNER_EMAIL, $hash_pass, $OWNER_HIDDEN ? 1 : 0]);
}

// ✅ SIGNUP PROCESS — FIXED TABLE NAME
if(isset($_POST['signup'])) {
    $email = trim($_POST['email']);
    $pass = password_hash($_POST['password'], PASSWORD_DEFAULT);

    // CHECK IF EMAIL ALREADY EXISTS
    $exists = $pdo->prepare("SELECT id FROM \"users\" WHERE email = ?");
    $exists->execute([$email]);

    if($exists->rowCount() > 0) {
        echo "exists"; exit;
    }

    // ✅ CREATE NEW USER
    $stmt = $pdo->prepare("INSERT INTO \"users\" (email, password, verified) VALUES (?, ?, ?)");
    $stmt->execute([$email, $pass, $REQUIRE_EMAIL_VERIFICATION ? 0 : 1]);

    if($REQUIRE_EMAIL_VERIFICATION) {
        sendVerificationEmail($email);
        echo "verify";
    } else {
        echo "success";
    }
    exit;
}

// ✅ LOGIN PROCESS — FIXED TABLE NAME
if(isset($_POST['login'])) {
    $email = trim($_POST['email']);
    $pass = trim($_POST['password']);

    $stmt = $pdo->prepare("SELECT * FROM \"users\" WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if($user && password_verify($pass, $user['password'])) {
        $_SESSION['user'] = $user['id'];
        $_SESSION['plan'] = $user['plan'];
        echo "success";
    } else {
        echo "invalid";
    }
    exit;
}
