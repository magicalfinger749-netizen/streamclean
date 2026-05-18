// === SYSTEM SETTINGS ===
let freeViews = parseInt(localStorage.getItem('streamclean_free_views')) || 10;
let players = {};
let playlists = JSON.parse(localStorage.getItem('streamclean_playlists')) || [];

// === UPDATE FREE USES COUNT ON SCREEN ===
function updateFreeCount() {
    const el = document.getElementById('freeCount');
    if (el) el.textContent = freeViews;
    localStorage.setItem('streamclean_free_views', freeViews);
}

// === AI QUESTION BUTTONS — ONLY 1–5 • 6TH REMOVED ===
document.addEventListener('DOMContentLoaded', () => {
    // 👉 CHANGE MAIN HEADER TEXT HERE
    const mainHeader = document.querySelector('h1');
    if(mainHeader) {
        mainHeader.innerHTML = `Stream up to 10 videos/streams in one place<br><span style="color:#66fcf1;">100% Streaming Cleanly</span>`;
    }
    const subText = document.querySelector('p:not(.legal-text)');
    if(subText) subText.textContent = `Organize, save, and control all your streams from one website — fast, clean, simple.`;
    const premiumBtn = document.querySelector('button:contains("Unlimited Access")');
    if(premiumBtn) premiumBtn.textContent = `Subscribe Monthly — Unlimited Streams`;

    // 👉 REMOVE "STREAMS" FROM TOP NAV
    document.querySelectorAll('nav a').forEach(a => {
        if(a.textContent.trim() === 'Streams') a.remove();
    });

    const qButtons = document.querySelectorAll('.ai-q-btn');
    const answerBox = document.getElementById('aiAnswerBox');
    qButtons.forEach(btn => {
        if(btn.dataset.num !== '6') {
            btn.addEventListener('click', () => {
                answerBox.textContent = btn.dataset.answer;
            });
        } else {
            btn.style.opacity = '0.4';
            btn.style.pointerEvents = 'none';
            btn.style.cursor = 'not-allowed';
        }
    });

    updateFreeCount();
    createPlaylistManager();     // ✅ Save & Load All
    create10SeparatePlayers();  // ✅ 10 BOXES • EACH CONTROLLED SEPARATELY
    initModals();
    addLegalFooter();           // ✅ Legal Terms
});

// === ✅ PLAYLIST MANAGER — SAVE & CLICK ONCE LOAD ALL ===
function createPlaylistManager() {
    const section = document.createElement('div');
    section.style = `background:#1a1a1a; border-radius:10px; padding:20px; margin:20px 0; border:1px solid #333;`;
    section.innerHTML = `
        <h2 style="color:#66fcf1; text-align:center; margin:0 0 15px 0; font-size:20px;">📂 MY PLAYLISTS & SAVED LINKS</h2>
        <div style="display:flex; gap:10px; margin-bottom:15px; flex-wrap:wrap;">
            <input type="text" id="newPlaylistName" placeholder="Name your playlist..." style="flex:1; min-width:200px; padding:12px; border-radius:6px; border:none; background:#2a2a2a; color:white;">
            <button id="saveCurrentLinks" style="padding:12px 20px; background:#66fcf1; color:#000; border:none; border-radius:6px; font-weight:bold;">💾 Save All Current Links</button>
        </div>
        <div id="playlistsList" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:10px;"></div>
    `;
    document.querySelector('.container').prepend(section);

    document.getElementById('saveCurrentLinks').addEventListener('click', () => {
        const name = document.getElementById('newPlaylistName').value.trim();
        if(!name) return alert('Enter a name first!');
        const links = Array.from(document.querySelectorAll('.mediaInput')).map(i => i.value.trim()).filter(Boolean);
        if(links.length === 0) return alert('Load some links first!');
        
        playlists.push({ id:Date.now(), name, links });
        localStorage.setItem('streamclean_playlists', JSON.stringify(playlists));
        renderPlaylists();
        document.getElementById('newPlaylistName').value = '';
        alert(`✅ Playlist "${name}" saved!`);
    });

    renderPlaylists();
}

function renderPlaylists() {
    const list = document.getElementById('playlistsList');
    list.innerHTML = '';
    if(playlists.length === 0) { list.innerHTML = '<p style="color:#888; text-align:center; width:100%;">No playlists saved yet</p>'; return; }
    
    playlists.forEach(pl => {
        const card = document.createElement('div');
        card.style = `background:#2a2a2a; padding:12px; border-radius:6px; border:1px solid #444;`;
        card.innerHTML = `
            <h4 style="margin:0 0 8px 0; color:#66fcf1; font-size:15px;">${pl.name}</h4>
            <p style="margin:0 0 10px 0; color:#aaa; font-size:12px;">${pl.links.length} links saved</p>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
                <button class="loadAllPl" data-id="${pl.id}" style="flex:1; padding:8px; background:#66fcf1; color:#000; border:none; border-radius:4px; font-size:12px; font-weight:bold;">⚡ CLICK ONCE LOAD ALL</button>
                <button class="delPl" data-id="${pl.id}" style="flex:1; padding:8px; background:#ff4444; color:white; border:none; border-radius:4px; font-size:12px;">Delete</button>
            </div>
        `;
        list.appendChild(card);
    });

    list.querySelectorAll('.loadAllPl').forEach(btn => btn.addEventListener('click', () => {
        const pl = playlists.find(p => p.id === parseInt(btn.dataset.id));
        if(!pl) return;
        const inputs = document.querySelectorAll('.mediaInput');
        pl.links.forEach((link,i) => { if(inputs[i]) inputs[i].value = link; });
        alert(`✅ "${pl.name}" loaded — control each player below`);
    }));

    list.querySelectorAll('.delPl').forEach(btn => btn.addEventListener('click', () => {
        if(!confirm('Delete this playlist?')) return;
        playlists = playlists.filter(p => p.id !== parseInt(btn.dataset.id));
        localStorage.setItem('streamclean_playlists', JSON.stringify(playlists));
        renderPlaylists();
    }));
}

// === ✅ 10 SEPARATE PLAYERS — EACH WITH OWN PAUSE / PLAY / MUTE ===
function create10SeparatePlayers() {
    const container = document.querySelector('.container');
    
    for(let num=1; num<=10; num++) {
        const box = document.createElement('div');
        box.className = 'media-player-box';
        box.style = `background:#1a1a1a; border-radius:10px; padding:20px; margin:20px 0; border:1px solid #333;`;
        box.innerHTML = `
            <h2 style="color:#66fcf1; text-align:center; margin:0 0 15px 0; font-size:20px;">📺 Media Player ${num}</h2>
            <div style="display:flex; gap:10px; margin-bottom:15px;">
                <input type="text" class="mediaInput" placeholder="Paste YouTube / Anime / Twitch link only" 
                       style="flex:1; padding:12px; border-radius:6px; border:none; background:#2a2a2a; color:white; font-size:15px;">
                <button class="loadBtn" data-num="${num}" style="padding:12px 20px; background:#66fcf1; color:#000; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">Load & Play</button>
            </div>
            
            <!-- ✅ INDIVIDUAL CONTROLS -->
            <div style="display:flex; gap:10px; margin-bottom:15px; justify-content:center;">
                <button class="pauseBtn" data-num="${num}" style="padding:8px 16px; background:#ff9500; color:#000; border:none; border-radius:4px; font-weight:bold;">⏸ Pause</button>
                <button class="playBtn" data-num="${num}" style="padding:8px 16px; background:#34c759; color:#000; border:none; border-radius:4px; font-weight:bold;">▶ Play</button>
                <button class="muteBtn" data-num="${num}" style="padding:8px 16px; background:#af52de; color:#000; border:none; border-radius:4px; font-weight:bold;">🔇 Mute</button>
                <button class="unmuteBtn" data-num="${num}" style="padding:8px 16px; background:#5856d6; color:#000; border:none; border-radius:4px; font-weight:bold;">🔊 Unmute</button>
            </div>

            <div class="playerContainer" data-num="${num}" style="width:100%; height:420px; background:#000; border-radius:6px; overflow:hidden; position:relative;"></div>
        `;
        container.appendChild(box);

        // Attach events
        const input = box.querySelector('.mediaInput');
        box.querySelector('.loadBtn').addEventListener('click', () => loadMedia(input.value.trim(), num));
        input.addEventListener('keydown', e => e.key === 'Enter' && loadMedia(input.value.trim(), num));
        box.querySelector('.pauseBtn').addEventListener('click', () => controlPlayer(num, 'pause'));
        box.querySelector('.playBtn').addEventListener('click', () => controlPlayer(num, 'play'));
        box.querySelector('.muteBtn').addEventListener('click', () => controlPlayer(num, 'mute'));
        box.querySelector('.unmuteBtn').addEventListener('click', () => controlPlayer(num, 'unmute'));
    }
}

// === ✅ LOAD MEDIA — ONLY YOUTUBE / TWITCH / ANIME ===
function loadMedia(url, num) {
    if (!url) return;
    const container = document.querySelector(`.playerContainer[data-num="${num}"]`);
    const lockMsg = document.getElementById('lockMessage');

    function canPlay() {
        const user = JSON.parse(localStorage.getItem('streamclean_currentUser'));
        if (user && user.isAdmin) return true;
        if (user && user.subscribed) return true;
        if (user && !user.subscribed) {
            lockMsg.innerHTML = `⚠️ Free uses finished! <a href="#subscription" class="glow-text font-bold">Subscribe Monthly</a> for unlimited streams.`;
            lockMsg.classList.remove('hidden');
            container.parentElement.classList.add('locked');
            return false;
        }
        return freeViews > 0;
    }

    if (!canPlay()) return;
    lockMsg.classList.add('hidden');
    container.parentElement.classList.remove('locked');

    const user = JSON.parse(localStorage.getItem('streamclean_currentUser'));
    if (!user) {
        freeViews--;
        updateFreeCount();
        if (freeViews === 0) {
            lockMsg.innerHTML = `⚠️ Free uses finished! <button id="openSignUpBtn" class="glow-text font-bold">Create Account</button> or <a href="#subscription" class="glow-text font-bold">Subscribe Monthly</a>`;
            lockMsg.classList.remove('hidden');
            container.parentElement.classList.add('locked');
            setTimeout(() => document.getElementById('openSignUpBtn')?.addEventListener('click', () => document.getElementById('signUpModal').classList.remove('hidden')), 100);
            return;
        }
    }

    // --- ✅ ONLY ALLOWED SITES ---
    if (url.includes('youtu')) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        if (!match || match[2].length !== 11) return alert('Invalid YouTube link');
        
        container.innerHTML = `<div id="ytplayer-${num}" style="width:100%; height:100%;"></div>`;
        players[num] = new YT.Player(`ytplayer-${num}`, {
            height: '100%', width: '100%', videoId: match[2],
            playerVars: { autoplay: 1, controls: 1, rel: 0, modestbranding: 1 }
        });
    }
    else if (url.includes('twitch.tv')) {
        let channel = url.split('twitch.tv/')[1].split('?')[0];
        container.innerHTML = `<iframe id="twitch-${num}" src="https://player.twitch.tv/?channel=${channel}&parent=streamclean.live&autoplay=true" width="100%" height="100%" frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe>`;
        players[num] = { type:'twitch', el:document.getElementById(`twitch-${num}`) };
    }
    else {
        container.innerHTML = `
        <div style="width:100%;height:100%;background:#000;position:relative;">
            <p style="position:absolute;top:10px;left:50%;transform:translateX(-50%);z-index:10;color:#66fcf1;font-size:14px;margin:0;background:rgba(0,0,0,0.7);padding:4px 12px;border-radius:20px;">✅ 100% STREAMING CLEANLY</p>
            <iframe id="other-${num}" src="${url}" width="100%" height="100%" frameborder="0" allowfullscreen allow="autoplay; encrypted-media; fullscreen" sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"></iframe>
        </div>`;
        players[num] = { type:'other', el:document.getElementById(`other-${num}`) };
    }
}

// === ✅ CONTROL EACH PLAYER SEPARATELY ===
function controlPlayer(num, action) {
    const p = players[num];
    if(!p) return alert('Load a link first!');

    if(p instanceof YT.Player) {
        if(action==='pause') p.pauseVideo();
        if(action==='play') p.playVideo();
        if(action==='mute') p.mute();
        if(action==='unmute') p.unMute();
    }
    else if(p.type==='twitch') {
        try {
            const w = p.el.contentWindow;
            if(action==='pause') w.postMessage('{"command":"pause"}','*');
            if(action==='play') w.postMessage('{"command":"play"}','*');
            if(action==='mute') w.postMessage('{"command":"setVolume","volume":0}','*');
            if(action==='unmute') w.postMessage('{"command":"setVolume","volume":1}','*');
        }catch(e){}
    }
    else if(p.type==='other') {
        try {
            const vid = p.el.contentWindow.document.querySelector('video,audio');
            if(vid) {
                if(action==='pause') vid.pause();
                if(action==='play') vid.play();
                if(action==='mute') vid.muted=true;
                if(action==='unmute') vid.muted=false;
            }
        }
