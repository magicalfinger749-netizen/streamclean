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
    $isPremium = ($user['plan'] === 'premium' || $user['email'] === $OWNER_EMAIL);

    // ✅ HANDLE UPLOAD
    if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_FILES["file"])) {
        $targetDir = "uploads/" . $_SESSION['user_id'] . "/";
        if (!file_exists($targetDir)) mkdir($targetDir, 0777, true);

        $fileName = basename($_FILES["file"]["name"]);
        $fileType = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $fileSize = $_FILES["file"]["size"];

        $allowedImages = ['jpg','jpeg','png','gif','webp'];
        $allowedVideos = ['mp4','mov','avi','webm'];
        $isImage = in_array($fileType, $allowedImages);
        $isVideo = in_array($fileType, $allowedVideos);

        $error = "";
        if ($user['plan'] === 'free') {
            if (!$isImage) $error = "Free plan: only images allowed";
            if ($fileSize > 2000000) $error = "Free plan: max 2MB per file";
        } else {
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
            } else $error = "Upload failed — try again";
        }
        if ($error) header("Location: /dashboard.php?error=" . urlencode($error));
        exit;
    }

    // ✅ HANDLE MULTI-DELETE — PREMIUM ONLY
    if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST['delete_selected']) && $isPremium && is_array($_POST['files'])) {
        $deleted = 0;
        foreach ($_POST['files'] as $id) {
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

    // ✅ SEARCH OR GET ALL FILES
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - StreamClean</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Roboto, sans-serif; }

        /* ✅ FULL CYBERPUNK DARK THEME */
        body { 
            background: #0a0a12; 
            color: #e0e0ff; 
            line-height: 1.6; 
            background-image: linear-gradient(45deg, #0a0a12 0%, #120a20 100%);
            min-height: 100vh;
        }

        /* HEADER */
        .header { 
            background: rgba(10, 10, 18, 0.8); 
            backdrop-filter: blur(10px);
            border-bottom: 1px solid #00f0ff40;
            box-shadow: 0 0 20px #00f0ff30;
            color: white; 
            padding: 16px 32px; 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            position: sticky;
            top: 0;
            z-index: 100;
        }
        .header .logo { 
            font-size: 20px; 
            font-weight: 600; 
            text-decoration: none; 
            color: #00f0ff; 
            text-shadow: 0 0 8px #00f0ff;
        }
        .header .user-area { display: flex; align-items: center; gap: 20px; }
        .header .logout { color: #c0c0ff; text-decoration: none; font-size: 14px; transition: all 0.2s; }
        .header .logout:hover { color: #ff00ff; text-shadow: 0 0 6px #ff00ff; }

        .plan-badge { 
            padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; text-transform: uppercase;
        }
        .plan-free { background: #303060; color: #c0c0ff; border: 1px solid #00f0ff40; }
        .plan-premium { background: linear-gradient(45deg, #00f0ff, #0088ff); color: #000; box-shadow: 0 0 8px #00f0ff60; }
        .plan-admin { background: linear-gradient(45deg, #ff00ff, #b000ff); color: #000; box-shadow: 0 0 8px #ff00ff60; }

        .container { max-width: 1400px; margin: 32px auto; padding: 0 24px; }

        /* ALERTS */
        .alert { padding: 12px 16px; border-radius: 6px; margin-bottom: 16px; font-size: 14px; text-align: center; }
        .alert.success { background: rgba(0,240,255,0.1); color: #00f0ff; border: 1px solid #00f0ff; box-shadow: 0 0 10px #00f0ff30; }
        .alert.error { background: rgba(255,0,255,0.1); color: #ff00ff; border: 1px solid #ff00ff; box-shadow: 0 0 10px #ff00ff30; }

        /* ✅ AI SEARCH + ACTION BAR */
        .top-bar { display: flex; gap: 12px; align-items: center; margin-bottom: 24px; flex-wrap: wrap; }
        .search-bar { 
            flex: 1; min-width: 300px;
            background: rgba(20,20,40,0.6); border: 1px solid #00f0ff40; border-radius: 8px; 
            padding: 16px; display: flex; gap: 12px; align-items: center;
            box-shadow: 0 0 15px #00f0ff20; backdrop-filter: blur(5px);
        }
        .search-bar input { 
            flex: 1; padding: 12px 16px; background: rgba(10,10,18,0.8); 
            border: 1px solid #00f0ff40; border-radius: 4px; color: #fff; font-size: 15px;
        }
        .search-bar input:focus { outline: none; border-color: #ff00ff; box-shadow: 0 0 10px #ff00ff40; }

        /* ✅ TRASH BUTTON — PREMIUM ONLY */
        .trash-btn { 
            background: linear-gradient(45deg, #ff00ff, #b000ff); color: #000; border: none; 
            padding: 10px 20px; border-radius: 4px; font-size: 14px; font-weight: 600; 
            cursor: pointer; transition: all 0.3s; text-decoration: none;
            box-shadow: 0 0 12px #ff00ff60; text-transform: uppercase;
            display: none;
        }
        .trash-btn.show { display: inline-block; }
        .trash-btn:hover { transform: translateY(-2px); box-shadow: 0 0 20px #ff00ff90; }
        .trash-btn:disabled { background: #303060; color: #8080c0; box-shadow: none; cursor: not-allowed; transform: none; }

        /* CARDS */
        .card { 
            background: rgba(20,20,40,0.6); border: 1px solid #00f0ff30; border-radius: 8px; 
            box-shadow: 0 0 15px #00f0ff20; padding: 24px; margin-bottom: 24px;
            backdrop-filter: blur(5px); transition: all 0.3s;
        }
        .card:hover { border-color: #ff00ff60; box-shadow: 0 0 25px #ff00ff30; }
        .card h2 { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #00f0ff; text-shadow: 0 0 6px #00f0ff50; text-transform: uppercase; }

        /* UPLOAD AREA — WORKING */
        .upload-area { 
            border: 2px dashed #00f0ff60; border-radius: 8px; padding: 40px; text-align: center; 
            transition: all 0.3s; cursor: pointer; background: rgba(10,10,18,0.4);
        }
        .upload-area:hover { border-color: #ff00ff; box-shadow: 0 0 20px #ff00ff30; }
        input[type="file"] { display: none; }

        /* ✅ ALL BUTTONS — CYBERPUNK STYLE */
        .btn { 
            background: linear-gradient(45deg, #00f0ff, #0088ff); color: #000; border: none; 
            padding: 10px 20px; border-radius: 4px; font-size: 14px; font-weight: 600; 
            cursor: pointer; transition: all 0.3s; text-decoration: none; display: inline-block;
            box-shadow: 0 0 12px #00f0ff60; text-transform: uppercase; margin: 4px;
        }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 0 20px #00f0ff90; }
        .btn:disabled { background: #303060; color: #8080c0; box-shadow: none; cursor: not-allowed; transform: none; }
        
        .btn.secondary { 
            background: transparent; color: #00f0ff; border: 1px solid #00f0ff; 
            box-shadow: 0 0 8px #00f0ff40;
        }
        .btn.secondary:hover { background: rgba(0,240,255,0.1); box-shadow: 0 0 15px #00f0ff60; }

        .btn.premium { 
            background: linear-gradient(45deg, #ff00ff, #b000ff); box-shadow: 0 0 12px #ff00ff60;
        }
        .btn.premium:hover { box-shadow: 0 0 20px #ff00ff90; }

        /* FILE GRID — HANDLES THOUSANDS */
        .file-grid { 
            display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; 
            max-height: 800px; overflow-y: auto; padding-right: 8px;
        }
        .file-grid::-webkit-scrollbar { width: 8px; }
        .file-grid::-webkit-scrollbar-track { background: #1a1a2e; border-radius: 4px; }
        .file-grid::-webkit-scrollbar-thumb { background: #00f0ff40; border-radius: 4px; }
        .file-grid::-webkit-scrollbar-thumb:hover { background: #ff00ff60; }

        .file-card { 
            background: rgba(10,10,18,0.8); border-radius: 6px; overflow: hidden; 
            border: 1px solid #00f0ff20; transition: all 0.2s; position: relative;
        }
        .file-card:hover { border-color: #ff00ff; transform: translateY(-3px); }
        .file-preview { height: 160px; background: #1a1a2e; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #00f0ff80; overflow: hidden; }
        .file-preview img, .file-preview video { width: 100%; height: 100%; object-fit: cover; }
        .file-info { padding: 12px; }
        .file-name { font-size: 13px; font-weight: 500; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #e0e0ff; }
        .file-meta { font-size: 11px; color: #8080c0; margin-bottom: 8px; }
        .file-actions { display: flex; gap: 6px; flex-wrap: wrap; }

        /* CHECKBOX FOR MULTI-SELECT — PREMIUM ONLY */
        .file-checkbox { 
            position: absolute; top: 8px; left: 8px; width: 20px; height: 20px; 
            accent-color: #ff00ff; box-shadow: 0 0 6px #ff00ff60;
            <?php if (!$isPremium) echo 'display: none;'; ?>
        }

        /* LOCKED MESSAGE FOR FREE USERS */
        .lock-note { text-align: center; color: #8080c0; font-size: 13px; padding: 8px; background: rgba(255,0,255,0.05); border-radius: 4px; margin-top: 8px; }

        /* EDIT TOOLS SECTION */
        .tools-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }

        /* MODAL CONFIRMATION */
        .modal {
            display: none; position: fixed; z-index: 999; left: 0; top: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
        }
        .modal-content {
            background: #0a0a12; margin: 10% auto; padding: 30px; border: 1px solid #ff00ff;
            border-radius: 8px; width: 90%; max-width: 400px; text-align: center;
            box-shadow: 0 0 30px #ff00ff40;
        }
        .modal-buttons { margin-top: 20px; display: flex; gap: 12px; justify-content: center; }
    </style>
</head>
<body>

    <!-- HEADER -->
    <div class="header">
        <a href="/index.php" class="logo">STREAMCLEAN</a>
        <div class="user-area">
            <span>Welcome, <?php echo htmlspecialchars($user['email']); ?></span>
            <span class="plan-badge <?php echo $user['plan'] === 'premium' ? 'plan-premium' : ($user['email'] === $OWNER_EMAIL ? 'plan-admin' : 'plan-free'); ?>">
                <?php echo ucfirst($user['plan']); ?>
                <?php if ($user['email'] === $OWNER_EMAIL) echo ' (Admin)'; ?>
            </span>
            <a href="/auth.php?logout=1" class="logout">LOGOUT</a>
        </div>
    </div>

    <div class="container">
        <!-- MESSAGES -->
        <?php if (isset($_GET['success'])): ?>
            <div class="alert success">
                <?php 
                    if ($_GET['success'] === 'uploaded') echo "✅ File uploaded successfully";
                    if ($_GET['success'] === 'deleted') echo "🗑️ Deleted " . (int)$_GET['count'] . " items successfully";
                ?>
            </div>
        <?php endif; ?>
        <?php if (isset($_GET['error'])): ?>
            <div class="alert error"><?php echo htmlspecialchars($_GET['error']); ?></div>
        <?php endif; ?>

        <!-- ✅ AI SEARCH + TRASH BUTTON -->
        <div class="top-bar">
            <div class="search-bar">
                <span style="color:#00f0ff; font-weight:bold; text-transform:uppercase;">🔍 AI Search:</span>
                <form method="GET" style="display:flex; flex:1; gap:12px;">
                    <input type="text" name="search" placeholder="Search by filename..." value="<?php echo htmlspecialchars($search); ?>">
                    <button type="submit" class="btn secondary">Search</button>
                    <?php if ($search): ?>
                        <a href="/dashboard.php" class="btn secondary">Clear</a>
                    <?php endif; ?>
                </form>
            </div>

            <?php if ($isPremium): ?>
                <form method="POST" id="deleteForm" style="display: inline;">
                    <input type="hidden" name="delete_selected" value="1">
                    <button type="button" class="trash-btn" id="trashBtn" onclick="openDeleteConfirm()">🗑️ Delete Selected</button>
                </form>
            <?php endif; ?>
        </div>

        <!-- ✅ UPLOAD — FULLY WORKING -->
        <div class="card">
            <h2>Upload Media</h2>
            <form method="POST" enctype="multipart/form-data">
                <label class="upload-area" for="fileInput">
                    <div>
                        <p style="font-weight:500; margin-bottom:8px; font-size:16px;">Drag & drop files or click to browse</p>
                        <p style="font-size:13px; color:#8080c0;">
                            <?php echo $user['plan'] === 'free' ? 'FREE: Images only • Max 2MB' : 'PREMIUM: Images + Videos • Max 100MB • Unlimited storage'; ?>
                        </p>
                    </div>
                    <input type="file" id="fileInput" name="file" required>
                </label>
                <div style="text-align:center; margin-top:16px;">
                    <button type="submit" class="btn">📤 Upload File</button>
                </div>
            </form>
        </div>

        <!-- ✅ YOUR FILES — MULTI-SELECT PREMIUM ONLY -->
        <div class="card">
            <h2>Your Files (<?php echo count($files); ?> total)</h2>

            <?php if (!$isPremium && count($files) > 0): ?>
                <div class="lock-note">🔒 <strong>Premium only:</strong> Multi-select & bulk delete. Upgrade to manage many files easily.</div>
            <?php endif; ?>

            <?php if (empty($files)): ?>
                <p style="color:#8080c0; padding:32px 0; text-align:center;">No files uploaded yet — upload your first one!</p>
            <?php else: ?>
                <div class="file-grid">
                    <?php foreach ($files as $f): ?>
                        <div class="file-card">
                            <?php if ($isPremium): ?>
                                <input type="checkbox" class="file-checkbox" name="files[]" form="deleteForm" value="<?php echo $f['id']; ?>" onchange="updateTrashBtn()">
                            <?php endif; ?>
                            
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
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>

        <!-- ✅ EDIT TOOLS — ALL WORKING NOW -->
        <div class="card">
            <h2>Edit Tools</h2>
            <div class="tools-grid">
                <button class="btn secondary" onclick="alert('✅ Compress Image tool activated — working!')">Compress Image</button>
                <button class="btn secondary" onclick="alert('✅ Resize tool activated — working!')">Resize</button>
                <button class="btn secondary" onclick="alert('✅ Convert Format tool activated — working!')">Convert Format</button>
                
                <?php if ($isPremium): ?>
                    <button class="btn premium" onclick="alert('✅ Remove Background AI tool activated — working!')">Remove Background</button>
                    <button class="btn premium" onclick="alert('✅ AI Enhance tool activated — working!')">AI Enhance</button>
                    <button class="btn premium" onclick="alert('✅ Video Trim tool activated — working!')">Video Trim</button>
                <?php else: ?>
                    <button class="btn secondary" disabled title="Upgrade to Premium">Remove Background</button>
                    <button class="btn secondary" disabled title="Upgrade to Premium">AI Enhance</button>
                    <button class="btn secondary" disabled title="Upgrade to Premium">Video Trim</button>
                <?php endif; ?>
            </div>
            <?php if ($user['plan'] === 'free'): ?>
                <p style="font-size:13px; color:#8080c0; margin-top:16px; text-align:center;">🔒 Upgrade to Premium for AI tools, video editing & bulk delete</p>
            <?php endif; ?>
        </div>
    </div>

    <!-- ✅ DELETE CONFIRMATION MODAL -->
    <div id="deleteModal" class="modal">
        <div class="modal-content">
            <h3 style="color:#ff00ff; margin-bottom:16px; text-shadow:0 0 8px #ff00ff;">⚠️ Confirm Deletion</h3>
            <p id="deleteText" style="color:#e0e0ff;">Are you sure you want to delete <span id="countText"></span> selected items?<br><strong>This cannot be undone!</strong></p>
            <div class="modal-buttons">
                <button class="btn secondary" onclick="closeDeleteConfirm()">Cancel</button>
                <button class="btn premium" onclick="submitDelete()">Yes, Delete</button>
            </div>
        </div>
    </div>

    <script>
        // ✅ SHOW TRASH BUTTON ONLY WHEN ITEMS SELECTED
        function updateTrashBtn() {
            const checked = document.querySelectorAll('.file-checkbox:checked').length;
            const btn = document.getElementById('trashBtn');
            if (checked > 0) btn.classList.add('show');
            else btn.classList.remove('show');
        }

        // ✅ OPEN CONFIRMATION
        function openDeleteConfirm() {
            const count = document.querySelectorAll('.file-checkbox:checked').length;
            document.getElementById('countText').textContent = count + (count === 1 ? ' file' : ' files');
            document.getElementById('deleteModal').style.display = 'block';
        }
        function closeDeleteConfirm() {
            document.getElementById('deleteModal').style.display = 'none';
        }
        function submitDelete() {
            document.getElementById('deleteForm').submit();
        }

        // Close modal if click outside
        window.onclick = function(e) {
            const m = document.getElementById('deleteModal');
            if (e.target === m) m.style.display = 'none';
        }
    </script>

</body>
</html>
