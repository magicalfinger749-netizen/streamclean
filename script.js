// === SYSTEM SETTINGS ===
let freeViews = parseInt(localStorage.getItem('streamclean_free_views')) || 2;
let player;

// === UPDATE FREE USES COUNT ON SCREEN ===
function updateFreeCount() {
    const el = document.getElementById('freeCount');
    if (el) el.textContent = freeViews;
    localStorage.setItem('streamclean_free_views', freeViews);
}

// === AI QUESTION BUTTONS — NO TYPING, CLICK = ANSWER ===
document.addEventListener('DOMContentLoaded', () => {
    const qButtons = document.querySelectorAll('.ai-q-btn');
    const answerBox = document.getElementById('aiAnswerBox');

    qButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            answerBox.textContent = btn.dataset.answer;
        });
    });

    updateFreeCount();
    initPlayerEngine();
    initModals();
});

// === FULL UNIVERSAL PLAYER — SPOTIFY FULL SONG FIXED + ANIME SAFE ===
function initPlayerEngine() {
    const mediaLink = document.getElementById('mediaLink');
    const loadBtn = document.getElementById('loadMedia');
    const container = document.getElementById('playerContainer');
    const lockMsg = document.getElementById('lockMessage');

    function canPlay() {
        const user = JSON.parse(localStorage.getItem('streamclean_currentUser'));
        
        // ADMIN = ALWAYS UNLIMITED
        if (user && user.isAdmin) return true;
        // SUBSCRIBER = UNLIMITED
        if (user && user.subscribed) return true;
        // LOGGED IN FREE USER = NO MORE FREE VIEWS
        if (user && !user.subscribed) {
            lockMsg.innerHTML = `⚠️ Free trials used! <a href="#subscription" class="glow-text font-bold">Subscribe now</a> for unlimited streaming.`;
            return false;
        }
        // GUEST = 2 FREE USES FIRST
        return freeViews > 0;
    }

    loadBtn.addEventListener('click', () => {
        const url = mediaLink.value.trim();
        if (!url) return;

        if (!canPlay()) {
            lockMsg.classList.remove('hidden');
            container.classList.add('locked');
            return;
        }
        lockMsg.classList.add('hidden');
        container.classList.remove('locked');

        // COUNT FREE USE — ONLY GUESTS
        const user = JSON.parse(localStorage.getItem('streamclean_currentUser'));
        if (!user) {
            freeViews--;
            updateFreeCount();
            if (freeViews === 0) {
                lockMsg.innerHTML = `⚠️ Free views finished! <button id="openSignUpBtn" class="glow-text font-bold">Create Free Account</button> or <a href="#subscription" class="glow-text font-bold">Subscribe</a> to keep watching.`;
                lockMsg.classList.remove('hidden');
                container.classList.add('locked');
                setTimeout(() => {
                    document.getElementById('openSignUpBtn')?.addEventListener('click', () => {
                        document.getElementById('signUpModal').classList.remove('hidden');
                    });
                }, 100);
                return;
            }
        }

        // --- ✅ DETECT & PLAY EVERYTHING ---

        // 1. YOUTUBE
        if (url.includes('youtu')) {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = url.match(regExp);
            if (!match || match[2].length !== 11) return alert('Invalid YouTube link');
            
            container.innerHTML = `<div id="ytplayer" class="w-full h-full"></div>`;
            player = new YT.Player('ytplayer', {
                height: '100%',
                width: '100%',
                videoId: match[2],
                playerVars: { autoplay: 1, controls: 1, rel: 0, modestbranding: 1 }
            });
        }

        // 2. ✅ SPOTIFY — FULL SONG — NO EMBED, NO PREVIEW, DIRECT FULL AUDIO
        else if (url.includes('open.spotify.com')) {
            // EXTRACT ID
            let id = '';
            if (url.includes('/track/')) id = url.split('/track/')[1].split('?')[0];
            else if (url.includes('/album/')) id = url.split('/album/')[1].split('?')[0];
            else if (url.includes('/playlist/')) id = url.split('/playlist/')[1].split('?')[0];
            if (!id) return alert('Invalid Spotify link');

            // ✅ DIRECT FULL AUDIO SOURCE — PLAYS 100% LENGTH
            container.innerHTML = `
            <div style="width:100%;height:100%;background:#191414;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;padding:30px;box-sizing:border-box;">
                <h2 style="color:#1DB954;margin:0 0 20px 0;font-size:22px;">✅ SPOTIFY — FULL LENGTH MODE</h2>
                <p style="margin:0 0 25px 0;font-size:16px;color:#ccc;">No 30s limit — plays complete song</p>
                <audio 
                    controls 
                    autoplay 
                    style="width:90%;height:50px;border-radius:8px;outline:none;background:#282828;padding:5px;"
                >
                    <source src="https://spowload.com/api/stream/${id}" type="audio/mpeg">
                    <source src="https://api.spotifydown.com/download/${id}" type="audio/mpeg">
                    <source src="https://sapi.rndm.tech/stream/spotify/${id}" type="audio/mpeg">
                
                <p style="font-size:13px;color:#888;margin-top:20px;">🔊 High Quality • Direct Stream • Full Length</p>
            </div>`;
        }

        // 3. TWITCH — NORMAL
        else if (url.includes('twitch')) {
            let channel = '';
            if (url.includes('twitch.tv/')) channel = url.split('twitch.tv/')[1].split('?')[0];
            if (!channel) return alert('Invalid Twitch link');
            
            container.innerHTML = `<iframe src="https://player.twitch.tv/?channel=${channel}&parent=streamclean.live&autoplay=true" width="100%" height="100%" frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe>`;
        }

        // 4. ✅ ANIME — NO POPUPS / NO REDIRECTS
        else if (url.includes('anikai.cc') || url.includes('anime') || url.includes('gogo') || url.includes('9anime') || url.includes('play')) {
            container.innerHTML = `
            <div style="width:100%;height:100%;background:#000;position:relative;">
                <p style="position:absolute;top:10px;left:50%;transform:translateX(-50%);z-index:10;color:#66fcf1;font-size:14px;margin:0;">✅ Safe Mode — No Popups / No Redirects</p>
                <iframe 
                    src="${url}" 
                    width="100%" 
                    height="100%" 
                    frameborder="0" 
                    allowfullscreen 
                    sandbox="allow-same-origin allow-scripts allow-forms"
                    style="background:#000;border-radius:8px;"
                    onload="try{this.contentWindow.document.querySelectorAll('a, .ad, .popup, [onclick]').forEach(e=>{e.remove()})}catch(e){}"
                ></iframe>
                <style>iframe a, iframe .ad, iframe .popup {display:none!important;}</style>
            </div>`;
        }

        // 5. ALL OTHER VIDEOS
        else {
            const isStream = url.includes('.m3u8') || url.includes('.ts');
            if (isStream) {
                container.innerHTML = `
                <script src="https://cdn.jsdelivr.net/npm/hls.js@1"></script>
                <video id="p" controls autoplay width="100%" height="100%" allowfullscreen></video>`;
                setTimeout(()=>{
                    const v = document.getElementById('p');
                    if (Hls.isSupported()) { const h=new Hls();h.loadSource(url);h.attachMedia(v); }
                    else if (v.canPlayType('application/x-mpegURL')) v.src=url;
                },100);
            } else {
                container.innerHTML = `<video controls autoplay width="100%" height="100%" allowfullscreen><source src="${url}"></video>`;
            }
        }
    });
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
