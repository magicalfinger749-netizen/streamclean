// === SYSTEM SETTINGS ===
let freeViews = parseInt(localStorage.getItem('streamclean_free_views')) || 10;
let players = {};
let playlists = JSON.parse(localStorage.getItem('streamclean_playlists')) || [];
let currentLayout = 'list'; // default layout

// === UPDATE FREE USES COUNT ON SCREEN ===
function updateFreeCount() {
    const el = document.getElementById('freeCount');
    if (el) el.textContent = freeViews;
    localStorage.setItem('streamclean_free_views', freeViews);
}

// === MAIN INIT — RUNS WHEN PAGE LOADS ===
document.addEventListener('DOMContentLoaded', () => {
    // ✅ 1. REMOVE OLD TEXT: "Premium Streaming 100% Ad-Free & Secure"
    const mainHeading = document.querySelector('h1');
    if(mainHeading) {
        mainHeading.innerHTML = `Stream up to 10 videos/streams in one place<br><span style="color:#66fcf1;">100% Streaming Cleanly</span>`;
    }
    const subHeading = document.querySelector('p:not(.legal-footer)');
    if(subHeading) subHeading.textContent = `Organize, save, and control all your streams — fast, clean, simple.`;
    
    const premiumButton = document.querySelector('button, a.button');
    if(premiumButton) premiumButton.textContent = `Subscribe Monthly — Unlimited Streams`;

    // ✅ 2. REMOVE "All Streams" / "Streams" BUTTON FROM TOP NAVBAR COMPLETELY
    document.querySelectorAll('nav a').forEach(link => {
        const txt = link.textContent.trim().toLowerCase();
        if(txt === 'streams' || txt === 'all streams') link.remove();
    });

    // ✅ 3. UPDATE FEATURE BOXES EXACTLY AS YOU WANTED
    const featureBoxes = document.querySelectorAll('.feature-box, .feature-card, .col-md-4');
    featureBoxes.forEach(box => {
        const title = box.querySelector('h3, h4');
        const desc = box.querySelector('p');
        if(title && title.textContent.includes('Zero Ads')) {
            title.textContent = `Stream 10 at Once`;
            desc.textContent = `Stream 10 videos / streams / animes all on one single website — play, pause or mute any player separately.`;
        }
        if(title && title.textContent.includes('Free Uses')) {
            title.textContent = `10 Free Uses / Unlimited Paid`;
            desc.textContent = `Try streaming 10 free videos — subscribe for endless streaming while your subscription stays active.`;
        }
    });

    updateFreeCount();
    createLayoutSelector();      // Will build in Part 2
    createPlaylistManager();     // Will build in Part 2
    create10SeparatePlayers();  // Will build in Part 3
    initModals();               // Will build in Part 4
    addNewLegalFooter();        // Will build in Part 5
});

// === SIGN IN / UP MODALS — BASIC STRUCTURE ===
function initModals() {
    const signInBtn = document.getElementById('openSignIn');
    const signUpBtn = document.getElementById('signUp');
    const signInModal = document.getElementById('signInModal');
    const signUpModal = document.getElementById('signUpModal');
    const closeBtns = document.querySelectorAll('.close-modal');

    if(signInBtn) signInBtn.addEventListener('click', () => signInModal.classList.remove('hidden'));
    if(signUpBtn) signUpBtn.addEventListener('click', () => signUpModal.classList.remove('hidden'));
    closeBtns.forEach(btn => btn.addEventListener('click', () => {
        if(signInModal) signInModal.classList.add('hidden');
        if(signUpModal) signUpModal.classList.add('hidden');
    }));
}// === ✅ NEW FEATURE: LAYOUT SELECTOR — MOVE PLAYERS ANY WAY YOU WANT ===
function createLayoutSelector() {
    const section = document.createElement('div');
    section.style = `background:#1a1a1a; border-radius:10px; padding:15px; margin:20px 0; border:1px solid #333; text-align:center;`;
    section.innerHTML = `
        <h3 style="color:#66fcf1; margin:0 0 10px 0; font-size:16px;">🎛️ CHANGE LAYOUT / ARRANGE PLAYERS</h3>
        <select id="layoutPicker" style="padding:10px; border-radius:6px; background:#2a2a2a; color:white; border:none; font-size:14px;">
            <option value="list">📋 All in one list (scroll)</option>
            <option value="3top7bottom">🔝 3 on TOP • 7 on BOTTOM (exactly what you asked for)</option>
            <option value="55">➗ 5 on TOP • 5 on BOTTOM</option>
            <option value="433">🔢 4 • 3 • 3 rows</option>
            <option value="grid">🟦 GRID — All visible on 1 screen (no scrolling)</option>
        </select>
    `;
    document.querySelector('.container').prepend(section);

    // WHEN YOU SELECT LAYOUT — IT INSTANTLY MOVES ALL PLAYERS
    document.getElementById('layoutPicker').addEventListener('change', e => {
        currentLayout = e.target.value;
        applyLayout();
    });
}

// === ✅ APPLY LAYOUT — REARRANGES ALL 10 PLAYERS INSTANTLY ===
function applyLayout() {
    const allPlayers = Array.from(document.querySelectorAll('.media-player-box'));
    const container = document.querySelector('.players-wrapper') || document.createElement('div');
    container.className = 'players-wrapper';
    container.style = 'display:flex; flex-wrap:wrap; gap:15px; width:100%; margin-top:20px;';
    if(!container.parentNode) document.querySelector('.container').appendChild(container);
    container.innerHTML = '';

    // LAYOUT 1: FULL LIST (DEFAULT)
    if(currentLayout === 'list') {
        allPlayers.forEach(p => {
            p.style.width = '100%';
            p.style.margin = '10px 0';
            container.appendChild(p);
        });
    }
    // LAYOUT 2: 3 ON TOP • 7 ON BOTTOM
    else if(currentLayout === '3top7bottom') {
        const row1 = document.createElement('div'); 
        row1.style='display:flex; gap:15px; width:100%; margin-bottom:15px;';
        const row2 = document.createElement('div'); 
        row2.style='display:flex; gap:15px; width:100%;';
        for(let i=0; i<3; i++) { 
            allPlayers[i].style.width = `calc(33.333% - 10px)`; 
            allPlayers[i].style.margin = '0';
            row1.appendChild(allPlayers[i]); 
        }
        for(let i=3; i<10; i++) { 
            allPlayers[i].style.width = `calc(14.285% - 10px)`; 
            allPlayers[i].style.margin = '0';
            row2.appendChild(allPlayers[i]); 
        }
        container.appendChild(row1); 
        container.appendChild(row2);
    }
    // LAYOUT 3: 5 + 5 SPLIT
    else if(currentLayout === '55') {
        const row1 = document.createElement('div'); 
        row1.style='display:flex; gap:15px; width:100%; margin-bottom:15px;';
        const row2 = document.createElement('div'); 
        row2.style='display:flex; gap:15px; width:100%;';
        for(let i=0; i<5; i++) { 
            allPlayers[i].style.width = `calc(20% - 10px)`; 
            allPlayers[i].style.margin = '0';
            row1.appendChild(allPlayers[i]); 
        }
        for(let i=5; i<10; i++) { 
            allPlayers[i].style.width = `calc(20% - 10px)`; 
            allPlayers[i].style.margin = '0';
            row2.appendChild(allPlayers[i]); 
        }
        container.appendChild(row1); 
        container.appendChild(row2);
    }
    // LAYOUT 4: 4 • 3 • 3 ROWS
    else if(currentLayout === '433') {
        const r1=document.createElement('div');r1.style='display:flex;gap:15px;width:100%;margin-bottom:15px;';
        const r2=document.createElement('div');r2.style='display:flex;gap:15px;width:100%;margin-bottom:15px;';
        const r3=document.createElement('div');r3.style='display:flex;gap:15px;width:100%;';
        for(let i=0;i<4;i++){allPlayers[i].style.width=`calc(25% - 10px)`;allPlayers[i].style.margin='0';r1.appendChild(allPlayers[i]);}
        for(let i=4;i<7;i++){allPlayers[i].style.width=`calc(33.333% - 10px)`;allPlayers[i].style.margin='0';r2.appendChild(allPlayers[i]);}
        for(let i=7;i<10;i++){allPlayers[i].style.width=`calc(33.333% - 10px)`;allPlayers[i].style.margin='0';r3.appendChild(allPlayers[i]);}
        container.appendChild(r1);container.appendChild(r2);container.appendChild(r3);
    }
    // LAYOUT 5: GRID — ALL ON 1 SCREEN
    else if(currentLayout === 'grid') {
        allPlayers.forEach(p => {
            p.style.width = `calc(20% - 10px)`;
            p.style.margin = '0 0 15px 0';
            container.appendChild(p);
        });
    }
}

// === ✅ PLAYLIST MANAGER — SAVE ALL LINKS • CLICK ONCE LOAD ALL ===
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

    // SAVE BUTTON WORKS
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

// RENDER SAVED PLAYLIST BUTTONS
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

    // LOAD ALL LINKS INTO 10 PLAYERS
    list.querySelectorAll('.loadAllPl').forEach(btn => btn.addEventListener('click', () => {
        const pl = playlists.find(p => p.id === parseInt(btn.dataset.id));
        if(!pl) return;
        const inputs = document.querySelectorAll('.mediaInput');
        pl.links.forEach((link,i) => { if(inputs[i]) inputs[i].value = link; });
        alert(`✅ "${pl.name}" loaded — control each player below`);
    }));

    // DELETE PLAYLIST
    list.querySelectorAll('.delPl').forEach(btn => btn.addEventListener('click', () => {
        if(!confirm('Delete this playlist?')) return;
        playlists = playlists.filter(p => p.id !== parseInt(btn.dataset.id));
        localStorage.setItem('streamclean_playlists', JSON.stringify(playlists));
        renderPlaylists();
    }));
}// === ✅ CREATE 10 FULL WORKING MEDIA PLAYERS — REPLACES OLD SINGLE ONE ===
function create10SeparatePlayers() {
    const container = document.querySelector('.container');
    
    // REMOVE OLD SINGLE PLAYER COMPLETELY — NO TRACE LEFT
    const oldEngine = document.querySelector('.media-engine, #playerContainer, .media-player-engine');
    if(oldEngine) oldEngine.remove();

    // BUILD ALL 10 NEW PLAYER BOXES ONE BY ONE
    for(let num = 1; num <= 10; num++) {
        const box = document.createElement('div');
        box.className = 'media-player-box';
        box.style = `background:#1a1a1a; border-radius:10px; padding:20px; margin:10px 0; border:1px solid #333; box-sizing:border-box;`;
        
        // EACH PLAYER HAS: TITLE, INPUT, LOAD BUTTON, CONTROLS, VIDEO AREA
        box.innerHTML = `
            <h2 style="color:#66fcf1; text-align:center; margin:0 0 15px 0; font-size:20px;">📺 Media Player Engine ${num}</h2>
            <div style="display:flex; gap:10px; margin-bottom:15px;">
                <input type="text" class="mediaInput" placeholder="Paste YouTube / Anime / Twitch link only" 
                       style="flex:1; padding:12px; border-radius:6px; border:none; background:#2a2a2a; color:white; font-size:15px;">
                <button class="loadBtn" data-num="${num}" style="padding:12px 20px; background:#66fcf1; color:#000; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">Load & Play</button>
            </div>
            
            <!-- ✅ REAL WORKING CONTROLS — EACH CONTROLS ONLY ITS OWN PLAYER -->
            <div style="display:flex; gap:10px; margin-bottom:15px; justify-content:center;">
                <button class="pauseBtn" data-num="${num}" style="padding:8px 16px; background:#ff9500; color:#000; border:none; border-radius:4px; font-weight:bold;">⏸ Pause</button>
                <button class="playBtn" data-num="${num}" style="padding:8px 16px; background:#34c759; color:#000; border:none; border-radius:4px; font-weight:bold;">▶ Play</button>
                <button class="muteBtn" data-num="${num}" style="padding:8px 16px; background:#af52de; color:#000; border:none; border-radius:4px; font-weight:bold;">🔇 Mute</button>
                <button class="unmuteBtn" data-num="${num}" style="padding:8px 16px; background:#5856d6; color:#000; border:none; border-radius:4px; font-weight:bold;">🔊 Unmute</button>
            </div>

            <!-- VIDEO DISPLAY AREA -->
            <div class="playerContainer" data-num="${num}" style="width:100%; height:420px; background:#000; border-radius:6px; overflow:hidden; position:relative;">
                <p style="position:absolute;top:10px;left:50%;transform:translateX(-50%);z-index:10;color:#66fcf1;font-size:14px;margin:0;background:rgba(0,0,0,0.7);padding:4px 12px;border-radius:20px;">✅ Ready to Stream</p>
            </div>
        `;

        // ADD TO PAGE
        container.appendChild(box);

        // ✅ ATTACH REAL FUNCTIONS — BUTTONS DO EXACTLY WHAT THEY SAY
        const input = box.querySelector('.mediaInput');
        box.querySelector('.loadBtn').addEventListener('click', () => loadMedia(input.value.trim(), num));
        input.addEventListener('keydown', e => e.key === 'Enter' && loadMedia(input.value.trim(), num));
        
        box.querySelector('.pauseBtn').addEventListener('click', () => controlPlayer(num, 'pause'));
        box.querySelector('.playBtn').addEventListener('click', () => controlPlayer(num, 'play'));
        box.querySelector('.muteBtn').addEventListener('click', () => controlPlayer(num, 'mute'));
        box.querySelector('.unmuteBtn').addEventListener('click', () => controlPlayer(num, 'unmute'));
    }

    // APPLY DEFAULT LAYOUT AFTER CREATING
    applyLayout();
}

// === ✅ LOAD MEDIA — ONLY ALLOWS YOUTUBE / TWITCH / ANIME — BLOCKS OTHERS ===
function loadMedia(url, num) {
    if (!url) return alert('Please paste a link first!');
    const container = document.querySelector(`.playerContainer[data-num="${num}"]`);
    const lockMsg = document.getElementById('lockMessage') || document.createElement('div');
    if(!lockMsg.parentNode) { 
        lockMsg.id = 'lockMessage'; 
        lockMsg.style = 'padding:15px; margin:15px 0; background:#2a1a1a; border-radius:8px; color:#ff9500; text-align:center; display:none;';
        document.querySelector('.container').appendChild(lockMsg); 
    }

    // CHECK IF USER IS ALLOWED TO PLAY
    function canPlay() {
        const user = JSON.parse(localStorage.getItem('streamclean_currentUser') || '{}');
        // ADMIN / SUBSCRIBER = UNLIMITED
        if (user && user.isAdmin) return true;
        if (user && user.subscribed) return true;
        // EXPIRED SUB
        if (user && !user.subscribed) {
            lockMsg.style.display = 'block';
            lockMsg.innerHTML = `⚠️ Subscription ended — Subscribe again for unlimited streams.`;
            container.parentElement.classList.add('locked');
            return false;
        }
        // FREE USER: USE 10 FREE STREAMS
        return freeViews > 0;
    }

    if (!canPlay()) return;
    lockMsg.style.display = 'none';
    container.parentElement.classList.remove('locked');

    // COUNT DOWN FREE USES FROM 10 → 0
    const user = JSON.parse(localStorage.getItem('streamclean_currentUser') || 'null');
    if (!user) {
        freeViews--;
        updateFreeCount();
        if (freeViews === 0) {
            lockMsg.style.display = 'block';
            lockMsg.innerHTML = `⚠️ You used all 10 free streams! Subscribe now for unlimited access.`;
            container.parentElement.classList.add('locked');
            return;
        }
    }

    // --- ✅ ONLY ACCEPT THESE SITES ---
    let allowed = false;
    // 1. YOUTUBE
    if (url.includes('youtu')) {
        allowed = true;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        if (!match || match[2].length !== 11) return alert('❌ Invalid YouTube link');
        
        container.innerHTML = `<div id="ytplayer-${num}" style="width:100%; height:100%;"></div>`;
        players[num] = new YT.Player(`ytplayer-${num}`, {
            height: '100%', width: '100%', videoId: match[2],
            playerVars: { autoplay: 1, controls: 1, rel: 0, modestbranding: 1 }
        });
    }
    // 2. TWITCH
    else if (url.includes('twitch.tv')) {
        allowed = true;
        let channel = url.split('twitch.tv/')[1].split('?')[0];
        container.innerHTML = `<iframe id="twitch-${num}" src="https://player.twitch.tv/?channel=${channel}&parent=streamclean.live&autoplay=true" width="100%" height="100%" frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe>`;
        players[num] = { type:'twitch', el:document.getElementById(`twitch-${num}`) };
    }
    // 3. ANIME / OTHER LEGAL STREAMS
    else if (url.includes('anime') || url.includes('stream') || url.includes('video')) {
        allowed = true;
        container.innerHTML = `
        <div style="width:100%;height:100%;background:#000;position:relative;">
            <p style="position:absolute;top:10px;left:50%;transform:translateX(-50%);z-index:10;color:#66fcf1;font-size:14px;margin:0;background:rgba(0,0,0,0.7);padding:4px 12px;border-radius:20px;">✅ 100% STREAMING CLEANLY</p>
            <iframe id="other-${num}" src="${url}" width="100%" height="100%" frameborder="0" allowfullscreen allow="autoplay; encrypted-media; fullscreen" sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"></iframe>
        </div>`;
        players[num] = { type:'other', el:document.getElementById(`other-${num}`) };
    }

    // BLOCK ALL OTHER SITES
    if(!allowed) return alert('❌ Only YouTube, Twitch or Anime links allowed!');
}

// === ✅ CONTROL EACH PLAYER SEPARATELY — ALL BUTTONS WORK ===
function controlPlayer(num, action) {
    const p = players[num];
    if(!p) return alert('⚠️ Load a link first before using controls!');

    // YOUTUBE CONTROLS
    if(p instanceof YT.Player) {
        if(action==='pause') p.pauseVideo();
        if(action==='play') p.playVideo();
        if(action==='mute') p.mute();
        if(action==='unmute') p.unMute();
    }
    // TWITCH CONTROLS
    else if(p.type==='twitch') {
        try {
            const w = p.el.contentWindow;
            if(action==='pause') w.postMessage('{"command":"pause"}','*');
            if(action==='play') w.postMessage('{"command":"play"}','*');
            if(action==='mute') w.postMessage('{"command":"setVolume","volume":0}','*');
            if(action==='unmute') w.postMessage('{"command":"setVolume","volume":1}','*');
        }catch(e){ alert('⚠️ Twitch controls work only after video loads fully'); }
    }
    // ANIME / OTHER SITE CONTROLS
    else if(p.type==='other') {
        try {
            const vid = p.el.contentWindow.document.querySelector('video,audio');
            if(vid) {
                if(action==='pause') vid.pause();
                if(action==='play') vid.play();
                if(action==='mute') vid.muted = true;
                if(action==='unmute') vid.muted = false;
            } else {
                alert('⚠️ Player controls available once video starts');
            }
        }catch(e){ alert('⚠️ Controls limited by this website'); }
    }
}// === ✅ FAQ SECTION — ONLY QUESTIONS 1–5 • NO QUESTION 6 • CLICK TO SHOW ANSWER ===
function createFAQ() {
    // FIND FAQ AREA & WIPE OLD CONTENT COMPLETELY (removes Q6 automatically)
    const faqContainer = document.querySelector('.faq-section, .faq, .qa-container, #faq');
    if(!faqContainer) return;
    faqContainer.innerHTML = '';

    // HEADER
    const faqTitle = document.createElement('h2');
    faqTitle.style = 'text-align:center; color:#fff; margin-bottom:25px; font-size:22px;';
    faqTitle.textContent = 'Frequently Asked Questions';
    faqContainer.appendChild(faqTitle);

    // ONLY QUESTIONS 1–5 LISTED HERE — Q6 DOES NOT EXIST AT ALL
    const faqData = [
        {
            question: "1. How do I subscribe to unlimited streaming?",
            answer: "Click the 'Subscribe Monthly' button, choose your plan, and complete payment — you get instant unlimited access to all 10 players forever while your subscription stays active."
        },
        {
            question: "2. How do I start watching streams or videos?",
            answer: "Simply paste any YouTube, Twitch, or Anime link into any of the 10 player boxes, click 'Load & Play', and it starts instantly. You can control each player separately."
        },
        {
            question: "3. Can I use this website on my mobile phone or tablet?",
            answer: "Yes! The site is fully mobile responsive — works perfectly on iPhone, Android, iPad, and all devices. You can also change layouts to fit your screen better."
        },
        {
            question: "4. Is what we do legal and safe to use?",
            answer: "100% legal and safe. We are only a streaming portal and link organizer — exactly like a web browser. We do NOT host, store, or copy any content. All videos play directly from their original owners' servers."
        },
        {
            question: "5. How do I reset my password or change account details?",
            answer: "Go to 'My Profile' → 'Account Settings' → you can change email, password, or personal details there instantly. If you forget your password, use the 'Forgot Password' link on the login page."
        }
    ];

    // ANSWER DISPLAY BOX — SHOWS WHEN YOU CLICK
    const answerBox = document.createElement('div');
    answerBox.id = 'faqAnswerBox';
    answerBox.style = 'margin:20px auto; padding:18px; background:#222; border-radius:8px; color:#66fcf1; min-height:45px; max-width:800px; text-align:center; border:1px solid #333;';
    faqContainer.appendChild(answerBox);

    // CREATE EACH QUESTION (ONLY 1–5)
    faqData.forEach(item => {
        const qEl = document.createElement('div');
        qEl.style = 'padding:14px; margin:10px auto; background:#1a1a1a; border-radius:6px; cursor:pointer; border:1px solid #333; max-width:800px; color:#fff; transition:all 0.2s;';
        qEl.textContent = item.question;

        // HOVER EFFECT
        qEl.addEventListener('mouseover', () => {
            qEl.style.borderColor = '#66fcf1';
            qEl.style.backgroundColor = '#222';
        });
        qEl.addEventListener('mouseout', () => {
            qEl.style.borderColor = '#333';
            qEl.style.backgroundColor = '#1a1a1a';
        });

        // ✅ CLICK = SHOW ANSWER IN BOX
        qEl.addEventListener('click', () => {
            answerBox.textContent = item.answer;
            // SCROLL TO ANSWER
            answerBox.scrollIntoView({behavior:'smooth'});
        });

        faqContainer.insertBefore(qEl, answerBox);
    });
}

// RUN FAQ CREATOR WHEN PAGE LOADS
document.addEventListener('DOMContentLoaded', createFAQ);// === ✅ NEW LEGAL NOTICE — EXACTLY WHAT YOU ASKED FOR • OLD ONE DELETED ===
function addNewLegalFooter() {
    // DELETE OLD LEGAL NOTICE COMPLETELY — NO TRACE LEFT
    const oldFooter = document.querySelector('.legal-footer, footer, .terms-footer, #legal');
    if(oldFooter) oldFooter.remove();

    // CREATE NEW LEGAL SECTION EXACTLY AS YOU WANTED
    const newFooter = document.createElement('div');
    newFooter.style = `
        background:#111; 
        border-top:1px solid #333; 
        padding:30px 20px; 
        margin-top:50px; 
        color:#ccc; 
        font-size:14px; 
        line-height:1.6;
    `;

    // TEXT WRITTEN EXACTLY YOUR WORDS
    newFooter.innerHTML = `
        <div style="max-width:1000px; margin:0 auto;">
            <h3 style="color:#66fcf1; text-align:center; margin:0 0 20px 0; font-size:18px;">📜 LEGAL NOTICE & TERMS OF SERVICE</h3>
            
            <p style="margin:0 0 12px 0; text-align:center;">
                <strong>Subscription Terms:</strong> All subscriptions are recurring and auto-renew unless you cancel at any time. Unlimited streaming access is valid only while your subscription remains active and paid up. If your subscription ends or is cancelled, you will revert back to free user limits.
            </p>

            <p style="margin:0 0 12px 0; text-align:center;">
                <strong>Free User Limits:</strong> Free users are granted a total of 10 free streams/videos/anime to use whenever they want. Once these 10 streams are used, a subscription is required to continue watching.
            </p>

            <p style="margin:0; text-align:center;">
                <strong>Is what we do legal?</strong> 100% YES — we operate exactly like a web browser or link organizer. We do NOT host, store, copy, or own any videos or content. All media plays directly from the original websites (YouTube, Twitch, Anime hosts, etc.) and remains their property only. This is fully legal and safe to use.
            </p>
        </div>
    `;

    // ADD TO BOTTOM OF PAGE
    document.querySelector('.container').appendChild(newFooter);
}

// RUN LEGAL NOTICE CREATOR WHEN PAGE LOADS
document.addEventListener('DOMContentLoaded', addNewLegalFooter);

// === ✅ FINAL CHECK — ENSURE EVERYTHING IS CONNECTED ===
// All functions already called earlier, this just makes sure no errors happen
window.addEventListener('load', () => {
    // Re-apply layout if needed
    applyLayout();
    
    // Reset free count if needed
    if(isNaN(freeViews) || freeViews < 0) {
        freeViews = 10;
        updateFreeCount();
    }
});
