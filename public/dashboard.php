<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header("Location: /auth.php");
    exit;
}
include __DIR__ . '/../private/config.php';

try {
    $pdo = new PDO("pgsql:host=$host;dbname=$dbname", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get user data
    $stmt = $pdo->prepare("SELECT * FROM \"users\" WHERE id = ? LIMIT 1");
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

} catch(PDOException $e) {
    die("Error: " . $e->getMessage());
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - StreamClean</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: Arial, sans-serif;
        }
        body {
            background: #f0f2f5;
            min-height: 100vh;
        }
        .header {
            background: #1a73e8;
            color: white;
            padding: 15px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .header h1 {
            font-size: 20px;
        }
        .header a {
            color: white;
            text-decoration: none;
            font-weight: 500;
        }
        .container {
            max-width: 1000px;
            margin: 40px auto;
            padding: 0 20px;
        }
        .card {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .info-row {
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .label {
            font-weight: bold;
            color: #555;
            width: 150px;
            display: inline-block;
        }
        .badge {
            background: #1a73e8;
            color: white;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 12px;
        }
        .badge.admin { background: #d93025; }
        .badge.premium { background: #f9ab00; }
        .badge.free { background: #34a853; }
    </style>
</head>
<body>

    <div class="header">
        <h1>🚀 StreamClean Dashboard</h1>
        <div>
            <span>Welcome, <?php echo htmlspecialchars($user['email']); ?></span>
            <a href="/auth.php?logout=1" style="margin-left:20px;">🚪 Logout</a>
        </div>
    </div>

    <div class="container">
        <div class="card">
            <h2 style="margin-bottom:20px; color:#333;">👤 Account Details</h2>

            <div class="info-row">
                <span class="label">Email:</span>
                <span><?php echo htmlspecialchars($user['email']); ?></span>
            </div>

            <div class="info-row">
                <span class="label">Plan:</span>
                <span class="badge <?php echo $user['plan']; ?>">
                    <?php echo ucfirst($user['plan']); ?>
                    <?php if($user['email'] === $OWNER_EMAIL) echo " (ADMIN)"; ?>
                </span>
            </div>

            <div class="info-row">
                <span class="label">Verified:</span>
                <span><?php echo $user['verified'] ? "✅ Yes" : "❌ No"; ?></span>
            </div>

            <div class="info-row">
                <span class="label">Joined:</span>
                <span><?php echo $user['created_at']; ?></span>
            </div>
        </div>

        <div class="card">
            <h2 style="margin-bottom:20px; color:#333;">📁 Your Files</h2>
            <p style="color:#666;">Upload feature coming soon — everything works perfectly!</p>
        </div>
    </div>

</body>
</html>
