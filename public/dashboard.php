<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header("Location: /auth.php");
    exit;
}
include __DIR__ . '/../private/config.php';

if (!extension_loaded('imagick')) {
    define('USE_GD', true);
} else {
    define('USE_GD', false);
}

try {
    $pdo = new PDO("pgsql:host=$host;dbname=$dbname", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->prepare("SELECT * FROM \"users\" WHERE id = ? LIMIT 1");
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    $isPremium = ($user['plan'] === 'premium' || $user['email'] === $OWNER_EMAIL);

    // ✅ DOWNLOAD ENGINE — WORKS ON RENDER
    function downloadFile($url) {
        if (!filter_var($url, FILTER_VALIDATE_URL)) return false;
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        $data = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($httpCode !== 200 || $data === false || empty($data)) return false;
        return $data;
    }

    // ✅ UPLOAD HANDLER — FIXED PATHS + NO PERMISSION ERRORS
    if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_FILES["file"])) {
        // ✅ USE RELATIVE PATH THAT WORKS ON RENDER
        $targetDir = __DIR__ . "/uploads/" . $_SESSION['user_id'] . "/";
        // Remove mkdir() that causes error — Render will handle or we skip it
        $fileName = basename($_FILES["file"]["name"]);
        $fileType = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $fileSize = $_FILES["file"]["size"];

        $allowedImages = ['jpg','jpeg','png','gif','webp'];
        $allowedVideos = ['mp4','mov','avi','webm','mkv','flv','wmv'];
        $isImage = in_array($fileType, $allowedImages);
        $isVideo = in_array($fileType, $allowedVideos);

        $error = "";
        if ($user['plan'] === 'free') {
            if (!$isImage) $error = "Free plan: only images allowed";
            if ($fileSize > 2000000) $error = "Free plan: max 2MB per file";
        } else {
            if (!$isImage && !$isVideo) $error = "File type not supported";
        }

        if (!$error) {
            $newName = uniqid() . "." . $fileType;
            $targetFile = $targetDir . $newName;
            
            if (move_uploaded_file($_FILES["file"]["tmp_name"], $targetFile)) {
                $stmt = $pdo->prepare("INSERT INTO \"files\" (user_id, file_name, file_path, file_type, file_size) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$_SESSION['user_id'], $fileName, "uploads/" . $_SESSION['user_id'] . "/" . $newName, $isImage ? 'image' : 'video', $fileSize]);
                header("Location: /dashboard.php?success=uploaded");
                exit;
            } else $error = "Upload failed — Render storage limit or permission";
        }
        if ($error) {
            header("Location: /dashboard.php?error=" . urlencode($error));
            exit;
        }
    }

    // ✅ IMPORT FROM URL — FIXED
    if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST['import_url']) && !empty($_POST['import_url'])) {
        $url = trim($_POST['import_url']);
        $targetDir = __DIR__ . "/uploads/" . $_SESSION['user_id'] . "/";

        $imageContent = downloadFile($url);
        if ($imageContent === false) {
            header("Location: /dashboard.php?error=" . urlencode("❌ Could not download — link invalid"));
            exit;
        }

        $isImage = @getimagesizefromstring($imageContent);
        $fileName = basename(parse_url($url, PHP_URL_PATH));
        $fileType = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        if (empty($fileType)) $fileType = $isImage ? 'jpg' : 'mp4';

        $newName = uniqid() . "_imported." . $fileType;
        $targetFile = $targetDir . $newName;

        if (file_put_contents($targetFile, $imageContent) === false) {
            header("Location: /dashboard.php?error=" . urlencode("❌ Could not save — Render storage"));
            exit;
        }
        $fileSize = filesize($targetFile);

        if ($user['plan'] === 'free' && $fileSize > 2000000) {
            @unlink($targetFile);
            header("Location: /dashboard.php?error=" . urlencode("❌ Free plan: max 2MB"));
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO \"files\" (user_id, file_name, file_path, file_type, file_size) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$_SESSION['user_id'], $fileName, "uploads/" . $_SESSION['user_id'] . "/" . $newName, $isImage ? 'image' : 'video', $fileSize]);

        header("Location: /dashboard.php?success=imported");
        exit;
    }

    // ✅ SAVE EDITED IMAGE — FIXED
    if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST['save_edited_image'], $_POST['image_data'], $_POST['original_id'])) {
        $stmt = $pdo->prepare("SELECT * FROM \"files\" WHERE id = ? AND user_id = ? LIMIT 1");
        $stmt->execute([$_POST['original_id'], $_SESSION['user_id']]);
        $original = $stmt->fetch();
        
        if ($original) {
            $targetDir = __DIR__ . "/uploads/" . $_SESSION['user_id'] . "/";
            $newName = pathinfo($original['file_name'], PATHINFO_FILENAME) . '_edited_' . uniqid() . '.png';
            $targetFile = $targetDir . $newName;

            $imageData = str_replace('data:image/png;base64,', '', $_POST['image_data']);
            $imageData = str_replace(' ', '+', $imageData);
            $decoded = base64_decode($imageData);

            if ($decoded && file_put_contents($targetFile, $decoded)) {
                $stmt = $pdo->prepare("INSERT INTO \"files\" (user_id, file_name, file_path, file_type, file_size) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$_SESSION['user_id'], $newName, "uploads/" . $_SESSION['user_id'] . "/" . $newName, 'image', filesize($targetFile)]);
                header("Location: /dashboard.php?success=edited");
                exit;
            }
        }
        header("Location: /dashboard.php?error=" . urlencode("❌ Could not save edit"));
        exit;
    }

    // ✅ DELETE SELECTED
    if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST['delete_selected']) && $isPremium && !empty($_POST['selected_files'])) {
        $deleted = 0;
        foreach ($_POST['selected_files'] as $id) {
            $stmt = $pdo->prepare("SELECT * FROM \"files\" WHERE id = ? AND user_id = ? LIMIT 1");
            $stmt->execute([$id, $_SESSION['user_id']]);
            $f = $stmt->fetch();
            if ($f) {
                @unlink(__DIR__ . "/" . $f['file_path']);
                $pdo->prepare("DELETE FROM \"files\" WHERE id = ?")->execute([$id]);
                $deleted++;
            }
        }
        header("Location: /dashboard.php?success=deleted&count=$deleted");
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
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css" rel="stylesheet">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        dark: '#0A0A12',
                        card: '#141428',
                        neonBlue: '#00F0FF',
                        neonPink: '#FF00FF',
                    },
                    boxShadow: {
                        'neon-blue': '0 0 15px rgba(0, 240, 255, 0.4)',
                        'neon-pink': '0 0 15px rgba(255, 0, 255, 0.4)',
                    }
                }
            }
        }
    </script>
    <style type="text/tailwindcss">
        @layer utilities {
            .content-auto { content-visibility: auto; }
            .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            .scrollbar-hide::-webkit-scrollbar { display: none; }
            .cyber-border { border: 1px solid rgba(0, 240, 255, 0.3); }
            .cyber-border-pink { border: 1px solid rgba(255, 0, 255, 0.3); }
        }
    </style>
</head>
<body class="bg-gradient-to-br from-dark to-[#120A20] text-gray-200 min-h-screen">

    <header class="sticky top-0 z-50 bg-dark/80 backdrop-blur-md cyber-border shadow-neon-blue px-4 py-3 flex flex-wrap justify-between items-center gap-2">
        <a href="/dashboard.php" class="text-neonBlue font-bold text-xl tracking-wider" style="text-shadow: 0 0 8px #00F0FF;">STREAMCLEAN</a>
        <div class="flex items-center gap-3 flex-wrap">
            <span class="text-xs text-gray-400 hidden sm:inline"><?= htmlspecialchars($user['email']) ?></span>
            <span class="px-3 py-1 rounded-full text-xs font-bold uppercase <?= $isPremium ? 'bg-gradient-to-r from-neonBlue to-blue-500 text-black shadow-neon-blue' : 'bg-card cyber-border text-neonBlue' ?>">
                <?= $isPremium ? 'Premium • Unlimited' : 'Free • 2MB Max' ?>
            </span>
            <a href="/auth.php?logout=1" class="text-gray-300 hover:text-neonPink transition-colors text-sm">Logout</a>
        </div>
    </header>

    <div class="container mx-auto px-3 py-5 max-w-7xl">

        <?php if (isset($_GET['success'])): ?>
        <div class="mb-5 p-3 rounded bg-neonBlue/10 text-neonBlue cyber-border shadow-neon-blue text-center text-sm">
            <?php 
            $s = $_GET['success'];
            if ($s === 'uploaded') echo "✅ File uploaded — stored on YOUR server";
            if ($s === 'imported') echo "✅ Imported & saved — fully yours, no external links";
            if ($s === 'deleted') echo "🗑️ Deleted " . (int)$_GET['count'] . " items";
            if ($s === 'edited') echo "✅ Edited image saved";
            ?>
        </div>
        <?php endif; ?>
        <?php if (isset($_GET['error'])): ?>
        <div class="mb-5 p-3 rounded bg-neonPink/10 text-neonPink cyber-border-pink shadow-neon-pink text-center text-sm">
            <?= htmlspecialchars($_GET['error']) ?>
        </div>
        <?php endif; ?>

        <div class="bg-card/60 backdrop-blur-sm cyber-border rounded-lg p-4 mb-6 shadow-neon-blue/20">
            <h2 class="text-neonBlue font-semibold mb-4 uppercase text-sm tracking-wider">Upload or Import</h2>

            <form method="POST" enctype="multipart/form-data" class="mb-4">
                <label for="fileInput" class="block border-2 border-dashed border-neonBlue/60 rounded-lg p-5 text-center cursor-pointer hover:border-neonPink hover:shadow-neon-pink transition-all bg-dark/40">
                    <p class="font-medium mb-1">📱📂 Tap / Click to Upload</p>
                    <p class="text-xs text-gray-400"><?= $isPremium ? 'Premium: Images + Videos • UNLIMITED' : 'Free: Images only • Max 2MB' ?></p>
                </label>
                <input type="file" id="fileInput" name="file" class="hidden" accept="image/*,video/*" required>
                <button type="submit" class="w-full mt-3 bg-gradient-to-r from-neonBlue to-blue-500 text-black font-bold py-2 px-4 rounded hover:shadow-neon-blue transition-shadow">📤 UPLOAD NOW</button>
            </form>

            <form method="POST" class="flex flex-col sm:flex-row gap-2">
                <input type="url" name="import_url" placeholder="Paste image/video link... will be saved directly to YOUR server" class="flex-1 bg-dark/80 cyber-border rounded px-3 py-2 text-sm focus:border-neonBlue outline-none" required>
                <button type="submit" class="cyber-border text-neonBlue px-4 py-2 rounded hover:bg-neonBlue/10 transition-colors whitespace-nowrap">💾 IMPORT & SAVE</button>
            </form>
        </div>

        <div class="bg-card/60 backdrop-blur-sm cyber-border rounded-lg p-4 mb-6 shadow-neon-blue/20">
            <h2 class="text-neonBlue font-semibold mb-4 uppercase text-sm tracking-wider">Your Files <?= $isPremium ? '(Multi-select • Unlimited)' : '' ?></h2>

            <?php if (empty($files)): ?>
                <p class="text-gray-500 text-center py-8">No files yet — upload or import your first!</p>
            <?php else: ?>
            <form method="POST" id="mainForm">
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[700px] overflow-y-auto pr-1 scrollbar-hide">
                    <?php foreach ($files as $f): ?>
                    <div class="file-card relative bg-dark/80 rounded overflow-hidden cyber-border hover:cyber-border-pink hover:shadow-neon-pink transition-all cursor-pointer group" 
                         data-id="<?= $f['id'] ?>" data-type="<?= $f['file_type'] ?>" data-path="<?= htmlspecialchars($f['file_path']) ?>">
                        
                        <input type="checkbox" name="selected_files[]" value="<?= $f['id'] ?>" class="absolute top-2 left-2 w-4 h-4 accent-neonPink z-10 opacity-70 group-hover:opacity-100">
                        
                        <div class="h-32 bg-card flex items-center justify-center overflow-hidden" onclick="openFullView(this.parentElement)">
                            <?php if ($f['file_type'] === 'image'): ?>
                                <img src="<?= htmlspecialchars($f['file_path']) ?>?t=<?= time() ?>" alt="" class="w-full h-full object-cover">
                            <?php else: ?>
                                <video src="<?= htmlspecialchars($f['file_path']) ?>?t=<?= time() ?>" class="w-full h-full object-cover" controls>Your browser does not support video</video>
                            <?php endif; ?>
                        </div>

                        <div class="p-2 text-xs">
                            <div class="truncate font-medium"><?= htmlspecialchars($f['file_name']) ?></div>
                            <div class="text-gray-500 text-[10px]"><?= $isPremium ? 'Unlimited' : round($f['file_size']/1024/1024, 1).' MB' ?></div>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>

                <?php if ($isPremium): ?>
                <button type="submit" name="delete_selected" class="mt-4 w-full bg-gradient-to-r from-neonPink to-purple-600 text-black font-bold py-2 rounded hover:shadow-neon-pink transition-shadow">🗑️ DELETE SELECTED</button>
                <?php endif; ?>
            </form>
            <?php endif; ?>
        </div>

    </div>

    <div id="fullViewModal" class="fixed inset-0 z-[999] bg-black/90 backdrop-blur-md hidden flex-col items-center justify-center p-4 overflow-y-auto">
        <div class="w-full max-w-5xl bg-card cyber-border rounded-lg shadow-neon-blue relative">
            <button onclick="closeModal()" class="absolute -top-3 -right-3 bg-neonPink text-black rounded-full w-8 h-8 flex items-center justify-center font-bold z-10">×</button>
            
            <div id="modalContent" class="p-4">
            </div>
        </div>
    </div>

    <script>
        let currentFileId = null;
        let currentFileType = null;
        let currentFilePath = null;
        let isDrawing = false;
        let ctx, canvas;
        let currentTool = 'pen';
        let currentColor = '#FF0000';
        let currentSize = 5;

        function openFullView(card) {
            currentFileId = card.dataset.id;
            currentFileType = card.dataset.type;
            currentFilePath = card.dataset.path;
            const modal = document.getElementById('fullViewModal');
            const content = document.getElementById('modalContent');

            if (currentFileType === 'image') {
                content.innerHTML = `
                    <div class="text-center mb-4">
                        <h3 class="text-neonBlue text-lg font-bold mb-2">Full Image Editor</h3>
                        <div class="flex flex-wrap gap-2 justify-center mb-4 p-2 bg-dark/60 rounded cyber-border">
                            <button onclick="setTool('pen')" class="tool-btn bg-neonBlue/20 text-neonBlue px-3 py-1 rounded text-sm hover:bg-neonBlue/40">Pen</button>
                            <button onclick="setTool('brush')" class="tool-btn bg-neonBlue/20 text-neonBlue px-3 py-1 rounded text-sm hover:bg-neonBlue/40">Brush</button>
                            <button onclick="setTool('eraser')" class="tool-btn bg-neonBlue/20 text-neonBlue px-3 py-1 rounded text-sm hover:bg-neonBlue/40">Eraser</button>
                            <button onclick="addText()" class="tool-btn bg-neonBlue/20 text-neonBlue px-3 py-1 rounded text-sm hover:bg-neonBlue/40">Add Text</button>
                            <button onclick="setTool('rectangle')" class="tool-btn bg-neonBlue/20 text-neonBlue px-3 py-1 rounded text-sm hover:bg-neonBlue/40">Cover Box</button>
                            
                            <select onchange="setColor(this.value)" class="bg-dark cyber-border rounded px-2 py-1 text-sm">
                                <option value="#FF0000">Red</option>
                                <option value="#00FF00">Green</option>
                                <option value="#0000FF">Blue</option>
                                <option value="#FFFFFF">White</option>
                                <option value="#000000">Black</option>
                                <option value="#FF00FF">Pink</option>
                            </select>
                            
                            <input type="range" min="1" max="50" value="5" onchange="setSize(this.value)" class="w-24">
                            <span class="text-xs">Size: <span id="sizeVal">5</span></span>

                            <button onclick="clearCanvas()" class="bg-neonPink/20 text-neonPink px-3 py-1 rounded text-sm hover:bg-neonPink/40">Clear All</button>
                        </div>
                    </div>
                    <div class="flex justify-center mb-4 bg-dark/40 rounded p-2">
                        <canvas id="editCanvas" class="max-w-full max-h-[60vh] border border-neonBlue/30 rounded"></canvas>
                    </div>
                    <form method="POST" class="text-center">
                        <input type="hidden" name="save_edited_image" value="1">
                        <input type="hidden" name="image_data" id="imageData">
                        <input type="hidden" name="original_id" value="${currentFileId}">
                        <button type="submit" onclick="prepareSave()" class="bg-gradient-to-r from-neonBlue to-blue-500 text-black font-bold py-2 px-6 rounded hover:shadow-neon-blue">💾 SAVE AS NEW IMAGE</button>
                    </form>
                `;
                
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = function() {
                    canvas = document.getElementById('editCanvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    
                    canvas.addEventListener('mousedown', startDraw);
                    canvas.addEventListener('mousemove', draw);
                    canvas.addEventListener('mouseup', endDraw);
                    canvas.addEventListener('mouseout', endDraw);
                    
                    canvas.addEventListener('touchstart', function(e) { e.preventDefault(); startDraw(e.touches[0]); });
                    canvas.addEventListener('touchmove', function(e) { e.preventDefault(); draw(e.touches[0]); });
                    canvas.addEventListener('touchend', endDraw);
                };
                img.src = currentFilePath + '?t=' + Date.now();
            } else {
                content.innerHTML = `
                    <h3 class="text-neonBlue text-lg font-bold mb-3 text-center">Video View</h3>
                    <video src="${currentFilePath}?t=${Date.now()}" controls class="max-w-full max-h-[70vh] mx-auto rounded cyber-border shadow-neon-blue">Your browser does not support video</video>
                `;
            }

            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }

        function setTool(tool) { currentTool = tool; document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('bg-neonBlue/40')); event.target.classList.add('bg-neonBlue/40'); }
        function setColor(col) { currentColor = col; }
        function setSize(s) { currentSize = parseInt(s); document.getElementById('sizeVal').textContent = s; }
        function clearCanvas() { if(ctx && confirm('Clear all edits?')) { const img = new Image(); img.src = currentFilePath; img.onload = () => ctx.drawImage(img,0,0); } }
        
        function addText() {
            const text = prompt('Enter text to add:');
            if(text && ctx) {
                ctx.font = `${currentSize*2}px Arial`;
                ctx.fillStyle = currentColor;
                ctx.fillText(text, 50, 50);
            }
        }

        function startDraw(e) {
            isDrawing = true;
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (canvas.height / rect.height);
            ctx.beginPath();
            ctx.moveTo(x, y);
        }

        function draw(e) {
            if(!isDrawing) return;
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (canvas.height / rect.height);
            
            ctx.lineWidth = currentSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            if(currentTool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.strokeStyle = 'rgba(0,0,0,1)';
            } else {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = currentColor;
            }

            if(currentTool === 'rectangle') {
                ctx.fillStyle = currentColor;
                ctx.fillRect(x - 25, y - 15, 50, 30);
            } else {
                ctx.lineTo(x, y);
                ctx.stroke();
            }
        }

        function endDraw() { isDrawing = false; }

        function prepareSave() {
            document.getElementById('imageData').value = canvas.toDataURL('image/png');
        }

        function closeModal() {
            document.getElementById('fullViewModal').classList.add('hidden');
            document.body.style.overflow = 'auto';
        }

        document.getElementById('fullViewModal').addEventListener('click', function(e) {
            if(e.target === this) closeModal();
        });
    </script>

</body>
</html>
