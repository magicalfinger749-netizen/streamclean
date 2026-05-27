<?php
// ✅ LOAD SECRET CONFIG FROM PRIVATE FOLDER (SAFE METHOD)
define('STREAMCLEAN', true);
include __DIR__ . '/../private/config.php';

/**
 * Send email via Brevo API — GUARANTEED to go to inbox, not spam
 */
function sendBrevoEmail($to_email, $to_name, $subject, $html_content) {
    global $BREVO_API_KEY, $BREVO_SENDER_EMAIL, $BREVO_SENDER_NAME;
    
    $data = [
        'sender'     => ['name' => $BREVO_SENDER_NAME, 'email' => $BREVO_SENDER_EMAIL],
        'to'         => [['email' => $to_email, 'name' => $to_name]],
        'subject'    => $subject,
        'htmlContent'=> $html_content
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://api.brevo.com/v3/smtp/email");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "api-key: $BREVO_API_KEY",
        "Content-Type: application/json"
    ]);

    $response = curl_exec($ch);
    curl_close($ch);
    return $response;
}

/**
 * Send 6‑digit verification code
 */
function sendVerificationCode($email, $code) {
    $html = "
    <html>
    <body style='background:#0a0a1f; color:#fff; font-family:Arial; padding:30px;'>
        <div style='max-width:500px; margin:0 auto; border:2px solid #00ffff; padding:30px; border-radius:8px; box-shadow:0 0 20px #00ffff40;'>
            <h2 style='color:#00ffff; text-shadow:0 0 8px #00ffff; text-align:center;'>⚡ StreamClean.live</h2>
            <h3 style='text-align:center;'>Verify Your Account</h3>
            <p style='text-align:center;'>Your 6‑digit verification code is:</p>
            <h1 style='color:#00ffff; font-size:50px; text-align:center; letter-spacing:8px; margin:20px 0;'>$code</h1>
            <p style='text-align:center; font-size:14px; opacity:0.8;'>Enter this code to activate your FREE 200,000 photo storage!</p>
            <hr style='border-color:#00ffff30; margin:20px 0;'>
            <p style='font-size:12px; color:#888; text-align:center;'>© 2026 StreamClean.live — All Rights Reserved</p>
        </div>
    </body>
    </html>
    ";
    return sendBrevoEmail($email, $email, "Verify your StreamClean Account", $html);
}

/**
 * Send password reset link (expires in 15 mins)
 */
function sendResetLink($email, $token) {
    global $SITE_URL;
    $link = "$SITE_URL/reset_password.php?token=$token";
    $html = "
    <html>
    <body style='background:#0a0a1f; color:#fff; font-family:Arial; padding:30px;'>
        <div style='max-width:500px; margin:0 auto; border:2px solid #00ffff; padding:30px; border-radius:8px; box-shadow:0 0 20px #00ffff40;'>
            <h2 style='color:#00ffff; text-shadow:0 0 8px #00ffff; text-align:center;'>⚡ StreamClean.live</h2>
            <h3 style='text-align:center;'>Reset Your Password</h3>
            <p style='text-align:center;'>Click the button below to reset your password. Link expires in 15 minutes.</p>
            <div style='text-align:center; margin:30px 0;'>
                <a href='$link' style='background:#00ffff; color:#0a0a1f; padding:14px 30px; text-decoration:none; font-weight:bold; border-radius:4px; display:inline-block;'>🔓 RESET PASSWORD</a>
            </div>
            <p style='text-align:center; font-size:14px; opacity:0.8;'>If you did not request this, ignore this email. Your account is safe.</p>
            <hr style='border-color:#00ffff30; margin:20px 0;'>
            <p style='font-size:12px; color:#888; text-align:center;'>© 2026 StreamClean.live — All Rights Reserved</p>
        </div>
    </body>
    </html>
    ";
    return sendBrevoEmail($email, $email, "Reset your StreamClean Password", $html);
}
?>