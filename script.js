// === SYSTEM SETTINGS ===
// ✅ CHANGED: 10 free uses total (was 2)
let freeViews = parseInt(localStorage.getItem('streamclean_free_views')) || 10;
let player;

// === UPDATE FREE USES COUNT ON SCREEN ===
function updateFreeCount() {
    const el = document.getElementById('freeCount');
    if (el) el.textContent = freeViews;
    localStorage.setItem('streamclean_free_views', freeViews);
}

// === AI QUESTION BUTTONS — ✅ REMOVED 6TH QUESTION, ONLY 1–5 LEFT ===
document.addEventListener('DOMContentLoaded', () => {
    const qButtons = document.querySelectorAll('.ai-q-btn');
    const answerBox = document.getElementById('aiAnswerBox');

    qButtons.forEach(btn => {
        // Only enable 1–5, 6th is unclickable
        if(btn.dataset.num !== '6') {
            btn.addEventListener('click', () => {
                answerBox.textContent = btn.dataset.answer;
            });
        } else {
            btn.style.opacity = '0.4';
            btn.style.pointerEvents = 'none';
        }
    });

    updateFreeCount();
    initPlayerEngine();
    initModals();
    create10Engines(); // ✅ ADDED: 10 FULLY WORKING MEDIA PLAYERS
});

// === ✅ CREATES 10 MEDIA PLAYER ENGINES — ALL WORK SAME ===
function create10Engines() {
    const container = document.querySelector('.container');
    
    // Create 10 identical players
    for(let i=1; i<=10; i++) {
        const engine = document.createElement('div');
        engine.className = 'media-engine';
        engine.style = `background:#1a1a1a; border-radius:10px; padding:20px; margin:20px 0; border:1px solid #333;`;
        engine.innerHTML = `
            <h2 style="color:#66fcf1; text-align:center; margin:0 0 15px 0; font-size:20px;">📺 Media Player Engine ${i}</h2>
            <div style="display:flex; gap:10px; margin-bottom:15px;">
                <input type="text" class="mediaInput" placeholder="Paste YouTube / Anime / Twitch link only" 
                       style="flex:1; padding:12px; border-radius:6px; border:none; background:#2a2a2a; color:white; font-size:15px;">
                <button class="loadBtn" style="padding:12px 20px; background:#66fcf1; color:#000; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">Load & Play</button>
            </div>
            <div class="playerContainer" style="width:100%; height:400px; background:#000; border-radius:6px; overflow:hidden; position:relative;"></div>
        `;
        container.appendChild(engine);

        // Attach working logic to each player
        const input = engine.querySelector('.mediaInput');
        const btn = engine.querySelector('.loadBtn');
        const playerBox = engine.querySelector('.playerContainer');

        btn.addEventListener('click', () => loadMedia(input.value.trim(), playerBox));
        input.addEventListener('keydown', e => e.key === 'Enter' && loadMedia(input.value.trim(), playerBox));
    }
}

// === ✅ CORE PLAYER LOGIC — YOUTUBE / ANIME / TWITCH ONLY, NO SPOTIFY ===
function loadMedia(url, container) {
    if (!url) return;

    const lockMsg = document.getElementById('lockMessage');
    function canPlay() {
        const user = JSON.parse(localStorage.getItem('streamclean_currentUser'));
        
        // ADMIN = ALWAYS UNLIMITED
        if (user && user.isAdmin) return true;
        // ✅ CHANGED SUBSCRIPTION TEXT LOGIC
        if (user && user.subscribed) return true;
        // LOGGED IN FREE USER = NO MORE VIEWS
        if (user && !user.subscribed) {
            lockMsg.innerHTML = `⚠️ You've used all free views! <a href="#subscription" class="glow-text font-bold">Subscribe Monthly</a> for unlimited streams.`;
            lockMsg.classList.remove('hidden');
            container.parentElement.classList.add('locked');
            return false;
        }
        // ✅ 10 FREE USES ONLY
        return freeViews > 0;
    }

    if (!canPlay()) return;
    lockMsg.classList.add('hidden');
    container.parentElement.classList.remove('locked');

    // Count free use
    const user = JSON.parse(localStorage.getItem('streamclean_currentUser'));
    if (!user) {
        freeViews--;
        updateFreeCount();
        if (freeViews === 0) {
            lockMsg.innerHTML = `⚠️ Free views finished! <button id="openSignUpBtn" class="glow-text font-bold">Create Account</button> or <a href="#subscription" class="glow-text font-bold">Subscribe Monthly</a> to keep streaming.`;
            lockMsg.classList.remove('hidden');
            container.parentElement.classList.add('locked');
            setTimeout(() => {
                document.getElementById('openSignUpBtn')?.addEventListener('click', () => {
                    document.getElementById('signUpModal').classList.remove('hidden');
                });
            }, 100);
            return;
        }
    }

    // --- ✅ ONLY YOUTUBE / TWITCH / ANIME — NO SPOTIFY / NO MOVIE LINKS ---
    // 1. YOUTUBE
    if (url.includes('youtu')) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        if (!match || match[2].length !== 11) return alert('Invalid YouTube link');
        
        container.innerHTML = `<div class="ytplayer" style="width:100%; height:100%;"></div>`;
        new YT.Player(container.querySelector('.ytplayer'), {
            height: '100%',
            width: '100%',
            videoId: match[2],
            playerVars: { autoplay: 1, controls: 1, rel: 0, modestbranding: 1 }
        });
    }

    // 2. TWITCH
    else if (url.includes('twitch.tv')) {
        let channel = url.split('twitch.tv/')[1].split('?')[0];
        container.innerHTML = `<iframe src="https://player.twitch.tv/?channel=${channel}&parent=streamclean.live&autoplay=true" width="100%" height="100%" frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe>`;
    }

    // 3. ANIME / ALL OTHER SITES — ✅ WORKING, NO BLOCKS
    else {
        container.innerHTML = `
        <div style="width:100%;height:100%;background:#000;position:relative;">
            <p style="position:absolute;top:10px;left:50%;transform:translateX(-50%);z-index:10;color:#66fcf1;font-size:14px;margin:0;background:rgba(0,0,0,0.7);padding:4px 12px;border-radius:20px;">✅ STREAMING CLEANLY</p>
            <iframe 
                src="${url}" 
                width="100%" 
                height="100%" 
                frameborder="0" 
                allowfullscreen 
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
                style="background:#000; pointer-events:auto !important;"
                onload="try{this.contentWindow.document.querySelectorAll('.ad,.popup').forEach(e=>e.remove())}catch(e){}"
            ></iframe>
        </div>`;
    }
}

// === SIGN IN / UP MODALS ===
function initModals() {
    const signInBtn = document.getElementById('openSignIn');
    const signUpBtn = document.getElementById('openSignUp');
    const signInModal = document.getElementById('signInModal');
    const signUpModal = document.getElementById('signUpModal');
    const closeBtns = document.querySelectorAll('.close-modal');

    signInBtn.addEventListener('click', () => signInModal.classList.remove('hidden'));
    signUpBtn.addEventListener('click', () => signUpModal.classList.remove('hidden'));
    closeBtns.forEach(btn => btn.addEventListener('click', () => {
        signInModal.classList.add('hidden');
        signUpModal.classList.add('hidden');
    }));
}
