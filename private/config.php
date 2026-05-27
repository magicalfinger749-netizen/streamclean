<?php
// ✅ RENDER VERSION – DO NOT CHANGE
$host = getenv('DB_HOST');
$dbname = getenv('DB_NAME');
$username = getenv('DB_USER');
$password = getenv('DB_PASSWORD');

// ✅ POSTGRESQL CONNECTION
$db = pg_connect("host=$host dbname=$dbname user=$username password=$password");
if (!$db) {
    die("Database connection failed: " . pg_last_error());
}

// ✅ YOUR SETTINGS – LEAVE EXACTLY AS IS
$OWNER_EMAIL = "magicalfinger749@gmail.com";
$OWNER_PASS = "Kinghashim2";
$OWNER_HIDDEN = true;

$BREVO_API_KEY = "xxksyib-79b2d12909f4e2f4d6ee9b73c59ef04fde2a01fa15cad6f2110a83d224cd6656-1opxewx6ChEhsCKQ";
$BREVO_SENDER_EMAIL = "no-reply@streamclean.live";
$BREVO_SENDER_NAME = "StreamClean.live";

$ADSENSE_CLIENT = "ca-pub-9305851897238441";
$ADS_ENABLED = true;
$ADS_FOR_FREE_ONLY = true;

$FREE_PHOTO_LIMIT = 200000;
$FREE_VIDEO_ALLOWED = false;
$PREMIUM_PHOTO_LIMIT = 999999999;
$PREMIUM_VIDEO_ALLOWED = true;

$FREE_EDIT_LEVEL = "basic";
$PREMIUM_EDIT_LEVEL = "full";

$REQUIRE_EMAIL_VERIFICATION = true;
$ENCRYPT_PASSWORDS = true;
$SITE_URL = "https://streamclean.live";
