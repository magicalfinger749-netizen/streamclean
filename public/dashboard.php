<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header("Location: /auth.php");
    exit;
}
include __DIR__ . '/../private/config.php';

// ✅ REQUIRE IMAGICK FOR PROCESSING
if (!extension_loaded('imagick')) {
    define('USE_GD', true);
} else {
    define('USE_GD', false);
}

try {
    $pdo = new PDO("pgsql:host=$host;dbname=$dbname", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get user data
    $stmt = $pdo->prepare("SELECT * FROM \"users\" WHERE id = ? LIMIT 1");
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    $isPremium = ($user['plan'] === 'premium' || $user['email'] === $OWNER_EMAIL);

    // ✅ HANDLE UPLOAD — PC + PHONE (GALLERY/FILES)
    if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_FILES["file"])) {
        $targetDir = "uploads/" . $_SESSION['user_id'] . "/";
        if (!file_exists($targetDir)) mkdir($targetDir, 0777, true);

        $fileName = basename($_FILES["file"]["name"]);
        $fileType = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $fileSize = $_FILES["file"]["size"];

        $allowedImages = ['jpg','jpeg','png','gif','webp'];
        $allowedVideos = ['mp4','mov','avi','webm','mkv','flv','wmv'];
        $isImage = in_array($fileType, $allowedImages);
        $isVideo = in_array($fileType, $allowedVideos);

        $error = "";
        // 👇 ONLY FREE HAS LIMITS — PREMIUM = NO LIMITS
        if ($user['plan'] === 'free') {
            if (!$isImage) $error = "Free plan: only images allowed";
            if ($fileSize > 2000000) $error = "Free plan: max 2MB per file";
        } else {
            // ✅ PREMIUM: NO SIZE LIMIT, ANY FILE TYPE
            if (!$isImage && !$isVideo) $error = "File type not supported — contact support";
        }

        if (!$error) {
            $newName = uniqid() . "." . $fileType;
            $targetFile = $targetDir . $newName;
            
            if (move_uploaded_file($_FILES["file"]["tmp_name"], $targetFile)) {
                $stmt = $pdo->prepare("INSERT INTO \"files\" (user_id, file_name, file_path, file_type, file_size) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$_SESSION['user_id'], $fileName, $targetFile, $isImage ? 'image' : 'video', $fileSize]);
                header("Location: /dashboard.php?success=uploaded");
                exit;
            } else $error = "Upload failed — file too big or server limit reached";
        }
        if ($error) header("Location: /dashboard.php?error=" . urlencode($error));
        exit;
    }

    // ✅ IMPORT FROM URL — DOWNLOADS & SAVES TO YOUR SERVER
    if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST['import_url']) && !empty($_POST['import_url'])) {
        $url = trim($_POST['import_url']);
        $targetDir = "uploads/" . $_SESSION['user_id'] . "/";
        if (!file_exists($targetDir)) mkdir($targetDir, 0777, true);

        // Check if it's a real image
        $valid = @getimagesize($url);
        if (!$valid) {
            header("Location: /dashboard.php?error=" . urlencode("❌ Not a valid image link"));
            exit;
        }

        // Get file details
        $fileName = basename(parse_url($url, PHP_URL_PATH));
        $fileType = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        if (!in_array($fileType, ['jpg','jpeg','png','gif','webp'])) $fileType = 'jpg';

        // DOWNLOAD IMAGE TO YOUR SERVER (no external link now!)
        $newName = uniqid() . "_imported." . $fileType;
        $targetFile = $targetDir . $newName;
        $imageContent = @file_get_contents($url);
        
        if ($imageContent === false) {
            header("Location: /dashboard.php?error=" . urlencode("❌ Could not download image"));
            exit;
        }

        file_put_contents($targetFile, $imageContent);
        $fileSize = filesize($targetFile);

        // ✅ Premium: no size check, Free: still 2MB limit
        if ($user['plan'] === 'free' && $fileSize > 2000000) {
            unlink($targetFile);
            header("Location: /dashboard.php?error=" . urlencode("❌ Free plan: max 2MB per file"));
            exit;
        }

        // Save to database — now it's YOUR file
        $stmt = $pdo->prepare("INSERT INTO \"files\" (user_id, file_name, file_path, file_type, file_size) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$_SESSION['user_id'], $fileName, $targetFile, 'image', $fileSize]);

        header("Location: /dashboard.php?success=imported");
        exit;
    }

    // ✅ DELETE SELECTED FILES
    if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST['delete_selected']) && $isPremium && !empty($_POST['selected_files'])) {
        $deleted = 0;
        foreach ($_POST['selected_files'] as $id) {
            $stmt = $pdo->prepare("SELECT * FROM \"files\" WHERE id = ? AND user_id = ? LIMIT 1");
            $stmt->execute([$id, $_SESSION['user_id']]);
            $f = $stmt->fetch();
            if ($f) {
                if (file_exists($f['file_path'])) unlink($f['file_path']);
                $pdo->prepare("DELETE FROM \"files\" WHERE id = ?")->execute([$id]);
                $deleted++;
            }
        }
        header("Location: /dashboard.php?success=deleted&count=$deleted");
        exit;
    }

    // ✅ EDIT TOOLS — ONLY WORKS IF YOU SELECT A PICTURE FIRST
    if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST['tool'], $_POST['selected_file'])) {
        $stmt = $pdo->prepare("SELECT * FROM \"files\" WHERE id = ? AND user_id = ? LIMIT 1");
        $stmt->execute([$_POST['selected_file'], $_SESSION['user_id']]);
        $file = $stmt->fetch();
        
        if (!$file) {
            header("Location: /dashboard.php?error=" . urlencode("❌ Select a picture first!"));
            exit;
        }

        $originalPath = $file['file_path'];
        $newName = pathinfo($file['file_name'], PATHINFO_FILENAME) . '_' . $_POST['tool'] . '.' . pathinfo($file['file_name'], PATHINFO_EXTENSION);
        $newPath = 'uploads/' . $_SESSION['user_id'] . '/' . uniqid() . '_' . $newName;
        $success = false;
        $message = "";

        switch ($_POST['tool']) {
            case 'compress':
                if ($file['file_type'] === 'image') {
                    if (USE_GD) {
                        $img = imagecreatefromstring(file_get_contents($originalPath));
                        imagejpeg($img, $newPath, 75);
                        imagedestroy($img);
                    } else {
                        $img = new Imagick($originalPath);
                        $img->setImageCompressionQuality(75);
                        $img->stripImage();
                        $img->writeImage($newPath);
                        $img->clear();
                    }
                    $success = true;
                    $message = "✅ Image compressed";
                } else $message = "❌ Only images can be compressed";
                break;

            case 'resize':
                if ($file['file_type'] === 'image') {
                    $width = 800; $height = 600;
                    if (USE_GD) {
                        list($w, $h) = getimagesize($originalPath);
                        $img = imagecreatefromstring(file_get_contents($originalPath));
                        $newImg = imagecreatetruecolor($width, $height);
                        imagecopyresampled($newImg, $img, 0,0,0,0, $width,$height,$w,$h);
                        imagejpeg($newImg, $newPath, 90);
                        imagedestroy($img); imagedestroy($newImg);
                    } else {
                        $img = new Imagick($originalPath);
                        $img->resizeImage($width, $height, Imagick::FILTER_LANCZOS, 1);
                        $img->writeImage($newPath);
                        $img->clear();
                    }
                    $success = true;
                    $message = "✅ Image resized to 800×600";
                } else $message = "❌ Only images can be resized";
                break;

            case 'convert':
                $newExt = 'webp';
                $newName = pathinfo($file['file_name'], PATHINFO_FILENAME) . '_converted.' . $newExt;
                $newPath = 'uploads/' . $_SESSION['user_id'] . '/' . uniqid() . '_' . $newName;
                if ($file['file_type'] === 'image') {
                    if (USE_GD) {
                        $img = imagecreatefromstring(file_get_contents($originalPath));
                        imagewebp($img, $newPath, 80);
                        imagedestroy($img);
                    } else {
                        $img = new Imagick($originalPath);
                        $img->setImageFormat('webp');
                        $img->writeImage($newPath);
                        $img->clear();
                    }
                    $success = true;
                    $message = "✅ Converted to WebP";
                } else $message = "❌ Only images can be converted";
                break;

            case 'removebg':
                if ($isPremium && $file['file_type'] === 'image') {
                    if (!USE_GD) {
                        $img = new Imagick($originalPath);
                        $img->setImageBackgroundColor('transparent');
                        $img->transparentPaintImage('white', 0, 1000, false);
                        $img->setImageFormat('png');
                        $newPath = 'uploads/' . $_SESSION['user_id'] . '/' . uniqid() . '_nobg.png';
                        $img->writeImage($newPath);
                        $img->clear();
                        $success = true;
                        $message = "✅ Background removed";
                    } else $message = "⚠️ Advanced processing needs full server";
                } else $message = "🔒 Premium only: Remove Background";
                break;

            case 'enhance':
                if ($isPremium && $file['file_type'] === 'image') {
                    if (!USE_GD) {
                        $img = new Imagick($originalPath);
                        $img->sharpenImage(2, 1);
                        $img->modulateImage(110, 110, 100);
                        $img->writeImage($newPath);
                        $img->clear();
                        $success = true;
                        $message = "✅ Image enhanced";
                    } else $message = "⚠️ Advanced processing needs full server";
                } else $message = "🔒 Premium only: AI Enhance";
                break;

            case 'trim':
                if ($isPremium && $file['file_type'] === 'video') {
                    if (function_exists('exec')) {
                        $newPath = 'uploads/' . $_SESSION['user_id'] . '/' . uniqid() . '_trimmed.mp4';
                        $cmd = "ffmpeg -i " . escapeshellarg($originalPath) . " -t 10 -c copy " . escapeshellarg($newPath) . " 2>&1";
                        exec($cmd, $out, $ret);
                        if ($ret === 0 && file_exists($newPath)) {
                            $success = true;
                            $message = "✅ Video trimmed to 10s";
                        } else $message = "⚠️ Video processing enabled — works on full servers";
                    } else $message = "⚠️ Enable exec on server for video tools";
                } else $message = "🔒 Premium only: Video Trim";
                break;
        }

        if ($success) {
            $stmt = $pdo->prepare("INSERT INTO \"files\" (user_id, file_name, file_path, file_type, file_size) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$_SESSION['user_id'], $newName, $newPath, $file['file_type'], filesize($newPath)]);
            header("Location: /dashboard.php?success=tool&msg=" . urlencode($message));
        } else {
            header("Location: /dashboard.php?error=" . urlencode($message));
        }
        exit;
    }

    // ✅ GET ALL FILES
    $search = isset($_GET['search']) ? trim($_GET['search']) : "";
    if ($search) {
        $stmt = $pdo->prepare("SELECT * FROM \"files\" WHERE user_id = ? AND file_name ILIKE ? ORDER BY uploaded_at DESC");
        $stmt->execute([$_SESSION['user_id'], "%$search%"]);
    } else {
        $stmt = $pdo->prepare("SELECT * FROM \"files\" WHERE user_id = ? ORDER BY uploaded_at DESC");
        $stmt->execute([$_SESSION['user_id']]);
    }
    $files = $stmt->fetchAll();

} catch(PDOException $e) {
    die("System error: " . $e->getMessage());
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Dashboard - StreamClean</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Roboto, sans-serif; }
        body { background: #0a0a12; color: #e0e0ff; line-height: 1.6; background-image: linear-gradient(45deg, #0a0a12 0%, #120a20 100%); min-height: 100vh; -webkit-font-smoothing: antialiased; }

        .header { background: rgba(10,10,18,0.8); backdrop-filter: blur(10px); border-bottom: 1px solid #00f0ff40; box-shadow: 0 0 20px #00f0ff30; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; flex-wrap: wrap; gap:8px; }
        .logo { font-size:18px; font-weight:bold; color:#00f0ff; text-shadow:0 0 8px #00f0ff; text-decoration:none; }
        .user-area { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
        .plan-badge { padding:3px 10px; border-radius:12px; font-size:11px; font-weight:500; text-transform:uppercase; }
        .plan-free { background:#303060; color:#c0c0ff; border:1px solid #00f0ff40; }
        .plan-premium { background:linear-gradient(45deg,#00f0ff,#0088ff); color:#000; box-shadow:0 0 8px #00f0ff60; }
        .logout { color:#c0c0ff; text-decoration:none; font-size:13px; }
        .logout:hover { color:#ff00ff; text-shadow:0 0 6px #ff00ff; }

        .container { max-width:1400px; margin:20px auto; padding:0 16px; }
        .alert { padding:12px 16px; border-radius:6px; margin-bottom:16px; font-size:14px; text-align:center; }
        .alert.success { background:rgba(0,240,255,0.1); color:#00f0ff; border:1px solid #00f0ff; box-shadow:0 0 10px #00f0ff30; }
        .alert.error { background:rgba(255,0,255,0.1); color:#ff00ff; border:1px solid #ff00ff; box-shadow:0 0 10px #ff00ff30; }

        .card { background:rgba(20,20,40,0.6); border:1px solid #00f0ff30; border-radius:8px; box-shadow:0 0 15px #00f0ff20; padding:16px; margin-bottom:20px; backdrop-filter:blur(5px); }
        .card h2 { font-size:16px; font-weight:600; margin-bottom:12px; color:#00f0ff; text-shadow:0 0 6px #00f0ff50; text-transform:uppercase; }

        .upload-area { border:2px dashed #00f0ff60; border-radius:8px; padding:30px 16px; text-align:center; cursor:pointer; background:rgba(10,10,18,0.4); margin-bottom:12px; }
        .upload-area:hover { border-color:#ff00ff; box-shadow:0 0 20px #ff00ff30; }
        input[type="file"] { display:none; accept:"image/*,video/*"; }
        .import-url { display:flex; gap:8px; margin-top:12px; flex-wrap:wrap; }
        .import-url input { flex:1; min-width:200px; padding:10px 14px; background:rgba(10,10,18,0.8); border:1px solid #00f0ff40; border-radius:4px; color:#fff; }

        .btn { background:linear-gradient(45deg,#00f0ff,#0088ff); color:#000; border:none; padding:10px 16px; border-radius:4px; font-size:14px; font-weight:600; cursor:pointer; transition:all 0.3s; text-decoration:none; display:inline-block; text-transform:uppercase; box-shadow:0 0 12px #00f0ff60; width:100%; text-align:center; }
        .btn:hover { transform:translateY(-2px); box-shadow:0 0 20px #00f0ff90; }
        .btn.secondary { background:transparent; color:#00f0ff; border:1px solid #00f0ff; box-shadow:0 0 8px #00f0ff40; }
        .btn.secondary:hover { background:rgba(0,240,255,0.1); }
        .btn.premium { background:linear-gradient(45deg,#ff00ff,#b000ff); box-shadow:0 0 12px #ff00ff60; }
        .btn.premium:hover { box-shadow:0 0 20px #ff00ff90; }
        .btn:disabled { background:#303060; color:#8080c0; box-shadow:none; cursor:not-allowed; transform:none; }

        .file-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:12px; max-height:700px; overflow-y:auto; padding-right:4px; }
        .file-grid::-webkit-scrollbar { width:6px; }
        .file-grid::-webkit-scrollbar-track { background:#1a1a2e; border-radius:4px; }
        .file-grid::-webkit-scrollbar-thumb { background:#00f0ff40; border-radius:4px; }
        .file-grid::-webkit-scrollbar-thumb:hover { background:#ff00ff60; }

        .file-card { background:rgba(10,10,18,0.8); border-radius:6px; overflow:hidden; border:1px solid #00f0ff20; transition:all 0.2s; position:relative; cursor:pointer; }
        .file-card.selected { border-color:#ff00ff; box-shadow:0 0 15px #ff00ff60; transform:scale(1.02); }
        .file-card:hover { border-color:#ff00ff; transform:translateY(-3px); }
        .file-preview { height:120px; background:#1a1a2e; display:flex; align-items:center; justify-content:center; font-size:20px; color:#00f0ff80; overflow:hidden; }
        .file-preview img, .file-preview video { width:100%; height:100%; object-fit:cover; }
        .file-info { padding:8px; }
        .file-name { font-size:12px; font-weight:500; margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .file-meta { font-size:10px; color:#8080c0; }
        .file-checkbox { position:absolute; top:6px; left:6px; width:18px; height:18px; accent-color:#ff00ff; box-shadow:0 0 6px #ff00ff60; }

        .tools-section { margin-top:20px; }
        .tools-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:8px; }
        .selected-info { padding:10px; background:rgba(255,0,255,0.1); border:1px solid #ff00ff30; border-radius:4px; margin-bottom:12px; text-align:center; font-size:14px; }
    </style>
</head>
<body>

    <div class="header">
        <a href="/dashboard.php" class="logo">STREAMCLEAN</a>
        <div class="user-area">
            <span style="font-size:12px;"><?php echo htmlspecialchars($user['email']); ?></span>
            <span class="plan-badge <?php echo $isPremium ? 'plan-premium' : 'plan-free'; ?>">
                <?php echo $isPremium ? 'PREMIUM • UNLIMITED' : 'FREE • 2MB MAX'; ?>
            </span>
            <a href="/auth.php?logout=1" class="logout">LOGOUT</a>
        </div>
    </div>

    <div class="container">
        <?php if (isset($_GET['success'])): ?>
            <div class="alert success">
                <?php
                $s = $_GET['success'];
                if ($s === 'uploaded') echo "✅ File uploaded successfully";
                if ($s === 'imported') echo "✅ Image imported & saved to your account";
                if ($s === 'deleted') echo "🗑️ Deleted " . (int)$_GET['count'] . " items";
                if ($s === 'tool') echo "🛠️ " . htmlspecialchars($_GET['msg']);
                ?>
            </div>
        <?php endif; ?>
        <?php if (isset($_GET['error'])): ?>
            <div class="alert error"><?php echo htmlspecialchars($_GET['error']); ?></div>
        <?php endif; ?>

        <!-- UPLOAD + IMPORT -->
        <div class="card">
            <h2>Upload or Import</h2>
            <form method="POST" enctype="multipart/form-data">
                <label class="upload-area" for="fileInput">
                    <div>
                        <p style="font-weight:500; margin-bottom:8px; font-size:15px;">📱📂 Tap / Click to Upload</p>
                        <p style="font-size:12px; color:#8080c0;">
                            <?php echo $isPremium ? 'PREMIUM: Images + Videos • <strong>UNLIMITED SIZE</strong>' : 'FREE: Images only • Max 2MB'; ?>
                        </p>
                    </div>
                    <input type="file" id="fileInput" name="file" required>
                </label>
                <button type="submit" class="btn">📤 UPLOAD NOW</button>
            </form>

            <form method="POST" class="import-url">
                <input type="url" name="import_url" placeholder="Paste image link from any website..." required>
                <button type="submit" class="btn secondary">IMPORT & SAVE</button>
            </form>
        </div>

        <!-- FILES LIBRARY -->
        <div class="card">
            <h2>Your Files <?php if ($isPremium) echo '(Multi-select enabled • Unlimited Storage)'; ?></h2>
            <?php if (empty($files)): ?>
                <p style="color:#8080c0; padding:24px 0; text-align:center;">No files yet — upload or import your first!</p>
            <?php else: ?>
                <form method="POST" id="mainForm">
                    <div class="file-grid">
                        <?php foreach ($files as $f): ?>
                            <div class="file-card" onclick="selectFile(<?php echo $f['id']; ?>, event)">
                                <input type="checkbox" name="selected_files[]" value="<?php echo $f['id']; ?>" class="file-checkbox" id="file-<?php echo $f['id']; ?>">
                                <div class="file-preview">
                                    <?php if ($f['file_type'] === 'image'): ?>
                                        <img src="<?php echo htmlspecialchars($f['file_path']); ?>" alt="">
                                    <?php else: ?>
                                        <video src="<?php echo htmlspecialchars($f['file_path']); ?>" controls></video>
                                    <?php endif; ?>
                                </div>
                                <div class="file-info">
                                    <div class="file-name"><?php echo htmlspecialchars($f['file_name']); ?></div>
                                    <div class="file-meta"><?php echo $isPremium ? 'Unlimited' : round($f['file_size']/1024/1024,1).' MB'; ?></div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>

                    <?php if ($isPremium): ?>
                        <button type="submit" name="delete_selected" class="btn premium" style="margin-top:12px;">🗑️ DELETE SELECTED</button>
                    <?php endif; ?>

                    <!-- HIDDEN INPUT FOR EDIT TOOLS -->
                    <input type="hidden" name="selected_file" id="selectedFileInput" value="">
                </form>
            <?php endif; ?>
        </div>

        <!-- EDIT TOOLS -- NOW YOU MUST SELECT A PICTURE FIRST -->
        <div class="card tools-section">
            <h2>Edit Tools</h2>
            <div id="selectedStatus" class="selected-info">⚠️ Select a picture above first to use tools</div>
            <div class="tools-grid">
                <form method="POST" style="display:contents;">
                    <input type="hidden" name="tool" value="compress">
                    <button type="submit" class="btn secondary tool-btn" disabled>Compress Image</button>
                </form>
                <form method="POST" style="display:contents;">
                    <input type="hidden" name="tool" value="resize">
                    <button type="submit" class="btn secondary tool-btn" disabled>Resize</button>
                </form>
                <form method="POST" style="display:contents;">
                    <input type="hidden" name="tool" value="convert">
                    <button type="submit" class="btn secondary tool-btn" disabled>Convert Format</button>
                </form>
                <form method="POST" style="display:contents;">
                    <input type="hidden" name="tool" value="removebg">
                    <button type="submit" class="btn premium tool-btn" <?php echo $isPremium ? '' : 'disabled'; ?>>Remove Background</button>
                </form>
                <form method="POST" style="display:contents;">
                    <input type="hidden" name="tool" value="enhance">
                    <button type="submit" class="btn premium tool-btn" <?php echo $isPremium ? '' : 'disabled'; ?>>AI Enhance</button>
                </form>
                <form method="POST" style="display:contents;">
                    <input type="hidden" name="tool" value="trim">
                    <button type="submit" class="btn premium tool-btn" <?php echo $isPremium ? '' : 'disabled'; ?>>Video Trim</button>
                </form>
            </div>
        </div>

    </div>

    <script>
        let selectedFileId = null;

        function selectFile(id, e) {
            const card = e.currentTarget;
            const checkbox = card.querySelector('input[type="checkbox"]');
            
            // Only select ONE file for editing
            if (!e.target.classList.contains('file-checkbox')) {
                // Unselect all
                document.querySelectorAll('.file-card').forEach(c => c.classList.remove('selected'));
                document.querySelectorAll('.file-checkbox').forEach(cb => cb.checked = false);
                // Select this one
                card.classList.add('selected');
                checkbox.checked = true;
                selectedFileId = id;
                document.getElementById('selectedFileInput').value = id;
                document.getElementById('selectedStatus').textContent = "✅ Selected file ready to edit";
                document.querySelectorAll('.tool-btn').forEach(btn => btn.disabled = false);
            }
        }
    </script>

</body>
</html>
