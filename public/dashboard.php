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

    // Handle Upload
    if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_FILES["file"])) {
        $targetDir = "uploads/" . $_SESSION['user_id'] . "/";
        if (!file_exists($targetDir)) mkdir($targetDir, 0777, true);

        $fileName = basename($_FILES["file"]["name"]);
        $fileType = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $fileSize = $_FILES["file"]["size"];

        // Check file type
        $allowedImages = ['jpg','jpeg','png','gif','webp'];
        $allowedVideos = ['mp4','mov','avi','webm'];
        $isImage = in_array($fileType, $allowedImages);
        $isVideo = in_array($fileType, $allowedVideos);

        // Check limits
        $error = "";
        if ($user['plan'] === 'free') {
            if (!$isImage) $error = "Free plan: only images allowed";
            if ($fileSize > 2000000) $error = "Free plan: max 2MB per file";
        } else { // premium
            if (!$isImage && !$isVideo) $error = "File type not allowed";
            if ($fileSize > 100000000) $error = "Max 100MB per file";
        }

        if (!$error) {
            $newName = uniqid() . "." . $fileType;
            $targetFile = $targetDir . $newName;
            
            if (move_uploaded_file($_FILES["file"]["tmp_name"], $targetFile)) {
                $stmt = $pdo->prepare("INSERT INTO \"files\" (user_id, file_name, file_path, file_type, file_size) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$_SESSION['user_id'], $fileName, $targetFile, $isImage ? 'image' : 'video', $fileSize]);
                header("Location: /dashboard.php?success=uploaded");
                exit;
            } else $error = "Upload failed";
        }
        if ($error) header("Location: /dashboard.php?error=" . urlencode($error));
        exit;
    }

    // Handle Delete
    if (isset($_GET['delete'])) {
        $stmt = $pdo->prepare("SELECT * FROM \"files\" WHERE id = ? AND user_id = ? LIMIT 1");
        $stmt->execute([$_GET['delete'], $_SESSION['user_id']]);
        $file = $stmt->fetch();
        if ($file) {
            unlink($file['file_path']);
            $pdo->prepare("DELETE FROM \"files\" WHERE id = ?")->execute([$_GET['delete']]);
        }
        header("Location: /dashboard.php?success=deleted");
        exit;
    }

    // Get user files
    $files = $pdo->prepare("SELECT * FROM \"files\" WHERE user_id = ? ORDER BY uploaded_at DESC");
    $files->execute([$_SESSION['user_id']]);
    $files = $files->fetchAll();

} catch(PDOException $e) {
    die("System error: " . $e->getMessage());
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - StreamClean</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Roboto, sans-serif; }
        body { background: #f5f7fa; color: #1e293b; }

        /* HEADER — YOUR THEME */
        .header { background: #0b1a3f; color: white; padding: 16px 32px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
        .header .logo { font-size: 20px; font-weight: 600; text-decoration: none; color: white; }
        .header .user-area { display: flex; align-items: center; gap: 20px; }
        .header .logout { color: #cbd5e1; text-decoration: none; font-size: 14px; transition: color 0.2s; }
        .header .logout:hover { color: white; text-decoration: underline; }

        .container { max-width: 1200px; margin: 32px auto; padding: 0 24px; }

        .card { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 24px; margin-bottom: 24px; }
        .card h2 { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #0b1a3f; }

        .alert { padding: 12px 16px; border-radius: 6px; margin-bottom: 16px; font-size: 14px; }
        .alert.success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
        .alert.error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

        .plan-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; }
        .plan-free { background: #e2e8f0; color: #334155; }
        .plan-premium { background: #165DFF; color: white; }
        .plan-admin { background: #dc2626; color: white; }

        .upload-area { border: 2px dashed #cbd5e1; border-radius: 8px; padding: 32px; text-align: center; transition: border-color 0.2s; }
        .upload-area:hover { border-color: #165DFF; }
        input[type="file"] { display: none; }
        .btn { background: #165DFF; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.2s; text-decoration: none; display: inline-block; }
        .btn:hover { background: #0f48c9; }
        .btn.secondary { background: #e2e8f0; color: #334155; }
        .btn.secondary:hover { background: #cbd5e1; }

        .file-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-top: 16px; }
        .file-card { background: #f8fafc; border-radius: 6px; overflow: hidden; position: relative; }
        .file-preview { height: 140px; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #94a3b8; }
        .file-preview img, .file-preview video { width: 100%; height: 100%; object-fit: cover; }
        .file-info { padding: 12px; }
        .file-name { font-size: 13px; font-weight: 500; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .file-meta { font-size: 11px; color: #64748b; margin-bottom: 8px; }
        .file-actions { display: flex; gap: 8px; }
        .btn-sm { padding: 4px 8px; font-size: 12px; border-radius: 4px; text-decoration: none; }
    </style>
</head>
<body>

    <!-- HEADER — LINKED TO MAIN PAGE -->
    <div class="header">
        <a href="/index.php" class="logo">StreamClean</a>
        <div class="user-area">
            <span>Welcome, <?php echo htmlspecialchars($user['email']); ?></span>
            <span class="plan-badge <?php echo $user['plan'] === 'premium' ? 'plan-premium' : ($user['email'] === $OWNER_EMAIL ? 'plan-admin' : 'plan-free'); ?>">
                <?php echo ucfirst($user['plan']); ?>
                <?php if ($user['email'] === $OWNER_EMAIL) echo ' (Admin)'; ?>
            </span>
            <a href="/auth.php?logout=1" class="logout">Logout</a>
        </div>
    </div>

    <div class="container">
        <!-- MESSAGES -->
        <?php if (isset($_GET['success'])): ?>
            <div class="alert success">
                <?php 
                    if ($_GET['success'] === 'uploaded') echo "File uploaded successfully";
                    if ($_GET['success'] === 'deleted') echo "File deleted successfully";
                ?>
            </div>
        <?php endif; ?>
        <?php if (isset($_GET['error'])): ?>
            <div class="alert error"><?php echo htmlspecialchars($_GET['error']); ?></div>
        <?php endif; ?>

        <!-- UPLOAD CARD -->
        <div class="card">
            <h2>Upload Media</h2>
            <form method="POST" enctype="multipart/form-data">
                <label class="upload-area" for="fileInput">
                    <div>
                        <p style="font-weight:500; margin-bottom:8px;">Drag & drop files or click to browse</p>
                        <p style="font-size:13px; color:#64748b;">
                            <?php echo $user['plan'] === 'free' ? 'Free: Images only, max 2MB' : 'Premium: Images & Videos, max 100MB'; ?>
                        </p>
                    </div>
                    <input type="file" id="fileInput" name="file" required>
                </label>
                <div style="text-align:center; margin-top:16px;">
                    <button type="submit" class="btn">Upload File</button>
                </div>
            </form>
        </div>

        <!-- FILES CARD -->
        <div class="card">
            <h2>Your Files</h2>
            <?php if (empty($files)): ?>
                <p style="color:#64748b; padding:16px 0;">No files uploaded yet</p>
            <?php else: ?>
                <div class="file-grid">
                    <?php foreach ($files as $f): ?>
                        <div class="file-card">
                            <div class="file-preview">
                                <?php if ($f['file_type'] === 'image'): ?>
                                    <img src="<?php echo htmlspecialchars($f['file_path']); ?>" alt="Image">
                                <?php else: ?>
                                    <video src="<?php echo htmlspecialchars($f['file_path']); ?>" controls></video>
                                <?php endif; ?>
                            </div>
                            <div class="file-info">
                                <div class="file-name"><?php echo htmlspecialchars($f['file_name']); ?></div>
                                <div class="file-meta"><?php echo round($f['file_size']/1024/1024, 1); ?> MB • <?php echo date('d M Y', strtotime($f['uploaded_at'])); ?></div>
                                <div class="file-actions">
                                    <a href="<?php echo htmlspecialchars($f['file_path']); ?>" class="btn secondary btn-sm" download>Download</a>
                                    <a href="?delete=<?php echo $f['id']; ?>" class="btn secondary btn-sm" style="color:#dc2626;" onclick="return confirm('Delete this file?')">Delete</a>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>

        <!-- EDIT TOOLS -->
        <div class="card">
            <h2>Edit Tools</h2>
            <div style="display:flex; gap:12px; flex-wrap:wrap;">
                <button class="btn secondary">Compress Image</button>
                <button class="btn secondary">Resize</button>
                <button class="btn secondary">Convert Format</button>
                <?php if ($user['plan'] === 'premium' || $user['email'] === $OWNER_EMAIL): ?>
                    <button class="btn">Remove Background</button>
                    <button class="btn">AI Enhance</button>
                    <button class="btn">Video Trim</button>
                <?php endif; ?>
            </div>
            <?php if ($user['plan'] === 'free'): ?>
                <p style="font-size:13px; color:#64748b; margin-top:12px;">Upgrade to Premium for advanced editing tools</p>
            <?php endif; ?>
        </div>
    </div>

</body>
</html>
