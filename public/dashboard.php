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

    $stmt = $pdo->prepare("SELECT * FROM \"users\" WHERE id = ? LIMIT 1");
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // ✅ TIER DETECTION — matches your rules
    $isPremium = ($user['is_subscribed'] == true || $user['plan'] === 'premium'); // matches your DB column
    $totalStorageUsed = 0; // will load via JS now

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
        // ✅ YOUR EXACT ORIGINAL THEME COLORS — NO CHANGES
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
                <?= $isPremium ? 'Premium • Unlimited' : 'Free • 100MB Total' ?>
            </span>
            <a href="/auth.php?logout=1" class="text-gray-300 hover:text-neonPink transition-colors text-sm">Logout</a>
        </div>
    </header>

    <div class="container mx-auto px-3 py-5 max-w-7xl">

        <?php if (isset($_GET['success'])): ?>
        <div class="mb-5 p-3 rounded bg-neonBlue/10 text-neonBlue cyber-border shadow-neon-blue text-center text-sm">
            <?php 
            $s = $_GET['success'];
            if ($s === 'uploaded') echo "✅ Upload saved to cloud";
            if ($s === 'deleted') echo "🗑️ Deleted " . (int)$_GET['count'] . " items";
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

            <!-- ✅ YOUR EXACT ORIGINAL UPLOAD FORM -->
            <label for="fileInput" class="block border-2 border-dashed border-neonBlue/60 rounded-lg p-5 text-center cursor-pointer hover:border-neonPink hover:shadow-neon-pink transition-all bg-dark/40">
                <p class="font-medium mb-1">📱📂 Tap / Click to Upload</p>
                <p class="text-xs text-gray-400" id="uploadInfo">
                    <?= $isPremium ? 'Premium: Images + Videos • UNLIMITED STORAGE' : 'Free: Images only • 100 MB Total Limit' ?>
                </p>
            </label>
            <input type="file" id="fileInput" class="hidden" accept="<?= $isPremium ? 'image/*,video/*' : 'image/*' ?>">
            <button type="button" onclick="startUpload()" class="w-full mt-3 bg-gradient-to-r from-neonBlue to-blue-500 text-black font-bold py-2 px-4 rounded hover:shadow-neon-blue transition-shadow">📤 UPLOAD NOW</button>

            <div class="mt-4 text-xs text-center text-gray-500">
                Storage used: <span id="storageUsed">0 MB</span>
            </div>
        </div>

        <div class="bg-card/60 backdrop-blur-sm cyber-border rounded-lg p-4 mb-6 shadow-neon-blue/20">
            <h2 class="text-neonBlue font-semibold mb-4 uppercase text-sm tracking-wider">Your Files <?= $isPremium ? '(Multi-select • Unlimited)' : '' ?></h2>

            <form method="POST" id="mainForm">
                <div id="filesGrid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[700px] overflow-y-auto pr-1 scrollbar-hide">
                    <p class="text-gray-500 text-center py-8 col-span-full">Loading your files...</p>
                </div>

                <?php if ($isPremium): ?>
                <button type="button" onclick="deleteSelected()" class="mt-4 w-full bg-gradient-to-r from-neonPink to-purple-600 text-black font-bold py-2 rounded hover:shadow-neon-pink transition-shadow">🗑️ DELETE SELECTED</button>
                <?php endif; ?>
            </form>
        </div>

    </div>

    <div id="fullViewModal" class="fixed inset-0 z-[999] bg-black/90 backdrop-blur-md hidden flex-col items-center justify-center p-4 overflow-y-auto">
        <div class="w-full max-w-5xl bg-card cyber-border rounded-lg shadow-neon-blue relative">
            <button onclick="closeModal()" class="absolute -top-3 -right-3 bg-neonPink text-black rounded-full w-8 h-8 flex items-center justify-center font-bold z-10">×</button>
            <div id="modalContent" class="p-4"></div>
        </div>
    </div>

    <!-- ✅ COMPRESSION LIBRARY -->
    <script src="https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.0/dist/browser-image-compression.min.js"></script>
    <script>
        // ✅ USER DATA — EXACT AS BEFORE
        const USER_ID = "<?= $_SESSION['user_id'] ?>";
        const USER_IS_PREMIUM = <?= $isPremium ? 'true' : 'false' ?>;
      <script src="https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.0/dist/browser-image-compression.min.js"></script>
<script>
// ✅ USER DATA — EXACT AS BEFORE
const USER_ID = "<?= $_SESSION['user_id'] ?>";
const USER_IS_PREMIUM = <?= $isPremium ? 'true' : 'false' ?>;
const API_URL = "https://streamclean-backend.onrender.com/api"; // ✅ YOUR BACKEND URL
let selectedFiles = [];

// ✅ AUTO-CREATE DATABASE TABLE (NO TOOLS NEEDED)
fetch(`${API_URL}/init-db`, { method: 'POST', cache: 'no-cache' })
  .then(res => res.text())
  .then(ok => console.log('DB Ready:', ok))
  .catch(err => console.error('DB Setup:', err));

// ✅ UPLOAD FUNCTION — COMPRESSES IMAGES, CHECKS LIMITS, UPLOADS TO R2
async function startUpload() {
  const input = document.getElementById('fileInput');
  const file = input.files[0];
  if (!file) return alert('Please select a file first');

  let finalFile = file;

  // ✅ COMPRESS ALL IMAGES (keeps quality, saves space)
  if (file.type.startsWith('image/')) {
    try {
      finalFile = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebp: true,
        preserveExif: true
      });
    } catch (err) {
      return alert('Image compression failed — try another photo');
    }
  }

  try {
    // 1. Ask backend for permission
    const res = await fetch(`${API_URL}/get-upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: USER_ID,
        fileName: file.name,
        fileType: finalFile.type,
        fileSize: finalFile.size
      })
    });

    const data = await res.json();
    if (!res.ok) return alert(data.message || 'Upload blocked');

    // 2. Upload DIRECTLY to Cloudflare R2
    await fetch(data.uploadUrl, {
      method: 'PUT',
      body: finalFile,
      headers: { 'Content-Type': finalFile.type }
    });

    alert('✅ Upload complete!');
    loadUserFiles(); // refresh list

  } catch (err) {
    alert('❌ Upload failed: ' + err.message);
  }
}

// ✅ LOAD FILES FROM CLOUDFLARE R2 & SHOW IN YOUR EXACT GRID LAYOUT
async function loadUserFiles() {
  const grid = document.getElementById('filesGrid');
  try {
    const res = await fetch(`${API_URL}/list-files?userId=${USER_ID}`);
    const files = await res.json();

    if (files.length === 0) {
      grid.innerHTML = '<p class="text-gray-500 text-center py-8 col-span-full">No files yet — upload or import!</p>';
      return;
    }

    grid.innerHTML = '';
    files.forEach(f => {
      const card = document.createElement('div');
      card.className = 'file-card relative bg-dark/80 rounded overflow-hidden cyber-border hover:cyber-border-pink transition-all cursor-pointer group';
      card.dataset.key = f.fileKey;

      card.innerHTML = `
        <input type="checkbox" class="absolute top-2 left-2 w-4 h-4 accent-neonPink z-10 opacity-70 group-hover:opacity-100" onchange="toggleSelect('${f.fileKey}', this.checked)">
        <div class="h-32 bg-card flex items-center justify-center overflow-hidden" onclick="openFullView('${f.publicUrl}', '${f.fileType}')">
          ${f.fileType.startsWith('image/') 
            ? `<img src="${f.publicUrl}" class="w-full h-full object-cover">` 
            : `<video controls class="w-full h-full object-cover" src="${f.publicUrl}"></video>`
          }
        </div>
        <div class="p-2 text-xs">
          <div class="truncate font-medium">${f.fileName}</div>
          <div class="text-gray-500 text-[10px]">${USER_IS_PREMIUM ? 'Unlimited' : 'Free'}</div>
        </div>
      `;
      grid.appendChild(card);
    });

  } catch (err) {
    grid.innerHTML = '<p class="text-neonPink text-center py-8 col-span-full">Error loading files</p>';
  }
}

function toggleSelect(key, checked) {
  checked ? selectedFiles.push(key) : selectedFiles = selectedFiles.filter(k => k !== key);
}

async function deleteSelected() {
  if (selectedFiles.length === 0) return alert('Select files first');
  if (!confirm('Delete selected files?')) return;

  for (const key of selectedFiles) {
    await fetch(`${API_URL}/delete-file`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({userId:USER_ID, fileKey:key})
    });
  }
  selectedFiles = [];
  loadUserFiles();
}

function openFullView(url, type) {
  const modal = document.getElementById('fullViewModal');
  const content = document.getElementById('modalContent');
  
  content.innerHTML = type.startsWith('image/') 
    ? `<img src="${url}" class="max-w-full max-h-[70vh] mx-auto rounded cyber-border">` 
    : `<video controls class="max-w-full max-h-[70vh] mx-auto rounded cyber-border" src="${url}"></video>`;
  
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('fullViewModal').classList.add('hidden');
  document.body.style.overflow = 'auto';
}

// ✅ LOAD ON PAGE START
loadUserFiles();
</script>
</html>
