<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

include __DIR__ . '/../private/config.php';

try {
    $pdo = new PDO("pgsql:host=$host;dbname=$dbname", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ? LIMIT 1");
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        session_destroy();
        header("Location: login.php");
        exit;
    }

    $isPremium = isset($user['is_subscribed']) ? (bool)$user['is_subscribed'] : (isset($user['plan']) && $user['plan'] === 'premium' ? true : false);
    $totalStorageUsed = 0;

} catch (PDOException $e) {
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

    <header class="sticky top-0 z-50 bg-dark/80 backdrop-blur-md cyber-border shadow-neon-blue px-6 py-4 mb-8">
        <div class="flex items-center justify-between">
            <a href="/dashboard.php" class="text-neonBlue font-bold text-xl tracking-wider">STREAMCLEAN</a>
            <div class="flex items-center gap-3 flex-wrap">
                <span class="text-xs text-gray-400 hidden sm:inline"><?= htmlspecialchars($user['email'] ?? '') ?></span>
                <a href="/logout.php" class="text-sm text-neonPink hover:underline">Logout</a>
            </div>
        </div>
    </header>

    <main class="px-4 max-w-7xl mx-auto">
        <section class="bg-dark/60 rounded-lg cyber-border p-6 mb-8 shadow-neon-blue">
            <h2 class="text-neonBlue text-lg font-semibold mb-4">UPLOAD OR IMPORT</h2>

            <div id="dropZone" class="cyber-border-pink rounded-lg p-8 text-center bg-card/40 hover:bg-card/60 transition-colors cursor-pointer mb-4">
                <i class="fa fa-folder-open-o text-neonPink text-3xl mb-2"></i>
                <p class="text-gray-300">Tap / Click to Upload</p>
                <p class="text-xs text-gray-400">Premium: Images + Videos • UNLIMITED STORAGE</p>
            </div>

            <input type="file" id="fileInput" style="display:none" accept="<?= $isPremium ? '*/*' : 'image/*' ?>">

            <div class="relative mb-4">
                <input type="url" id="linkInput" placeholder="OR paste image/video link here..." class="w-full bg-card/60 border border-neonBlue/40 rounded py-2 px-3 text-sm focus:outline-none focus:border-neonBlue text-gray-200">
                <button id="fetchBtn" class="absolute right-1 top-1 bottom-1 bg-neonBlue/20 hover:bg-neonBlue/30 text-neonPink px-3 rounded text-xs">FETCH & SAVE</button>
            </div>

            <button id="uploadBtn" class="w-full bg-neonBlue/20 hover:bg-neonBlue/30 text-neonBlue font-semibold py-3 rounded-lg transition-all shadow-neon-blue mb-2">
                <i class="fa fa-cloud-upload mr-2"></i> UPLOAD NOW
            </button>

            <div class="text-right text-xs text-gray-400 mt-2">Storage used: <span id="storageUsed">0 MB</span></div>
        </section>

        <section class="mb-8">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-neonPink text-lg font-semibold">YOUR FILES (MULTI‑SELECT • UNLIMITED)</h2>
                <button id="deleteBtn" class="bg-neonPink/20 hover:bg-neonPink/30 text-neonPink px-3 py-1 rounded text-sm transition-all shadow-neon-pink">
                    <i class="fa fa-trash mr-1"></i> DELETE SELECTED
                </button>
            </div>
            <div id="filesGrid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <p class="text-gray-500 text-center py-8 col-span-full">No files yet — upload or import!</p>
            </div>
        </section>
    </main>

    <div id="fullViewModal" class="fixed inset-0 z-[999] bg-black/90 hidden flex items-center justify-center p-4">
        <div class="w-full max-w-5xl bg-card cyber-border rounded-lg overflow-hidden relative">
            <button onclick="closeModal()" class="absolute top-3 right-3 text-gray-400 hover:text-white text-xl">&times;</button>
            <div id="modalContent" class="p-4"></div>
        </div>
    </div>

    <script>
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const linkInput = document.getElementById('linkInput');
    const fetchBtn = document.getElementById('fetchBtn');

    dropZone.addEventListener('click', () => fileInput.click());

    ['dragenter','dragover','dragleave','drop'].forEach(e => {
        dropZone.addEventListener(e, ev => { ev.preventDefault(); ev.stopPropagation(); dropZone.classList.add('bg-card/60'); });
    });
    ['dragleave','drop'].forEach(e => {
        dropZone.addEventListener(e, () => dropZone.classList.remove('bg-card/60'));
    });

    dropZone.addEventListener('drop', e => {
        e.preventDefault(); e.stopPropagation();
        if(e.dataTransfer.files.length) { fileInput.files = e.dataTransfer.files; startUpload(); }
    });

    uploadBtn.addEventListener('click', startUpload);
    fetchBtn.addEventListener('click', startFetchUpload);
    </script>

    <script src="https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.0/dist/browser-image-compression.min.js"></script>
    <script>
    const USER_ID = "<?= $user['id'] ?>";
    const USER_IS_PREMIUM = <?= $isPremium ? 'true' : 'false' ?>;
    const API_URL = "https://streamclean-backend.onrender.com/api";
    let selectedFiles = [];

    fetch(`${API_URL}/init-db`, { method: 'POST' });

    async function startUpload() {
        const file = fileInput.files[0];
        if(!file) return alert('⚠️ Select or drop a file first!');

        if(!USER_IS_PREMIUM) {
            if(!file.type.startsWith('image/')) return alert('❌ Free: ONLY IMAGES');
            if(file.size > 100 * 1024 * 1024) return alert('❌ Free limit: 100MB');
        }

        let finalFile = file;
        if(file.type.startsWith('image/')) {
            try {
                finalFile = await imageCompression(file, { maxSizeMB:1, maxWidthOrHeight:1920, useWebp:true, preserveExif:true });
            } catch { return alert('❌ Image error'); }
        }

        try {
            const res = await fetch(`${API_URL}/get-upload-url`, {
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({userId:USER_ID, fileName:file.name, fileType:finalFile.type, fileSize:finalFile.size})
            });
            const data = await res.json();
            if(!res.ok) return alert('❌ '+(data.message||'Upload blocked'));

            await fetch(data.uploadUrl, { method:'PUT', body:finalFile, headers:{'Content-Type':finalFile.type} });
            alert('✅ UPLOAD SUCCESSFUL!');
            fileInput.value=''; loadUserFiles();
        } catch(err) { alert('❌ '+err.message); }
    }

    async function startFetchUpload() {
        const fileUrl = linkInput.value.trim();
        if(!fileUrl) return alert('⚠️ Paste a link first!');

        try {
            const res = await fetch(`${API_URL}/fetch-url`, {
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({userId:USER_ID, fileUrl:fileUrl, isPremium:USER_IS_PREMIUM})
            });
            const data = await res.json();
            if(!res.ok) return alert('❌ '+(data.message||'Failed'));

            alert('✅ LINK SAVED SUCCESSFULLY!');
            linkInput.value=''; loadUserFiles();
        } catch(err) { alert('❌ '+err.message); }
    }

    async function loadUserFiles() {
        const grid = document.getElementById('filesGrid');
        try {
            const res = await fetch(`${API_URL}/list-files`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({userId:USER_ID}) });
            const files = await res.json();

            if(files.length===0) { grid.innerHTML='<p class="text-gray-500 text-center py-8 col-span-full">No files yet — upload or import!</p>'; return; }

            grid.innerHTML='';
            files.forEach(f => {
                const card = document.createElement('div');
                card.className='file-card relative bg-dark/80 rounded overflow-hidden cyber-border hover:cyber-border-pink transition-all cursor-pointer group';
                card.innerHTML=`
                    <input type="checkbox" class="absolute top-2 left-2 w-4 h-4 accent-neonPink z-10 opacity-70 group-hover:opacity-100" onchange="toggleSelect('${f.fileKey}', this.checked)">
                    <div class="h-32 bg-card flex items-center justify-center overflow-hidden" onclick="openFullView('${f.publicUrl}', '${f.fileType}')">
                        ${f.fileType.startsWith('image/') ? `<img src="${f.publicUrl}" class="w-full h-full object-cover">` : `<video controls class="w-full h-full object-cover" src="${f.publicUrl}"></video>`}
                    </div>
                    <div class="p-2 text-xs">
                        <div class="truncate font-medium">${f.fileName}</div>
                        <div class="text-gray-500 text-[10px]">${USER_IS_PREMIUM ? 'Unlimited' : 'Free'}</div>
                    </div>
                `;
                grid.appendChild(card);
            });
        } catch { grid.innerHTML='<p class="text-neonPink text-center py-8 col-span-full">❌ Cannot load files</p>'; }
    }

    function toggleSelect(key, checked) { checked ? selectedFiles.push(key) : selectedFiles=selectedFiles.filter(k=>k!==key); }

    async function deleteSelected() {
        if(selectedFiles.length===0) return alert('⚠️ Select files first!');
        if(!confirm('🗑️ Delete selected files?')) return;

        for(const key of selectedFiles) {
            await fetch(`${API_URL}/delete-file`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({userId:USER_ID, fileKey:key}) });
        }
        selectedFiles=[]; loadUserFiles();
    }

    function openFullView(url,type) {
        const modal=document.getElementById('fullViewModal');
        const content=document.getElementById('modalContent');
        content.innerHTML=type.startsWith('image/') ? `<img src="${url}" class="max-w-full max-h-[70vh] mx-auto rounded cyber-border">` : `<video controls class="max-w-full max-h-[70vh] mx-auto rounded cyber-border" src="${url}"></video>`;
        modal.classList.remove('hidden'); document.body.style.overflow='hidden';
    }

    function closeModal() { document.getElementById('fullViewModal').classList.add('hidden'); document.body.style.overflow='auto'; }

    document.getElementById('deleteBtn').addEventListener('click', deleteSelected);
    loadUserFiles();
    </script>

</body>
</html>
