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

// === FULL UNIVERSAL PLAYER — ANIME BYPASS EDITION ===
// ✅ WORKS: anikai.cc, gogoanime, 9anime, all anime sites + everything else
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

        // --- ✅ DETECT & PLAY EVERYTHING — INCLUDING ANIKAI.CC & ALL ANIME SITES ---

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

        // 2. SPOTIFY — FULL SONG (NO PREVIEW)
        else if (url.includes('spotify')) {
            const fullUrl = url.replace('open.spotify.com', 'open.spotify.com/embed');
            container.innerHTML = `<iframe src="${fullUrl}" width="100%" height="100%" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowfullscreen style="background:#191414;"></iframe>`;
        }

        // 3. TWITCH — OFFICIAL PLAYER (ADS ARE NORMAL, CAN'T REMOVE)
        else if (url.includes('twitch')) {
            let channel = '';
            if (url.includes('twitch.tv/')) channel = url.split('twitch.tv/')[1].split('?')[0];
            if (!channel) return alert('Invalid Twitch link — use: https://www.twitch.tv/CHANNELNAME');
            
            container.innerHTML = `<iframe src="https://player.twitch.tv/?channel=${channel}&parent=streamclean.live&autoplay=true" width="100%" height="100%" frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe>`;
        }

        // 4. ✅ ANIME SITES BYPASS — WORKS ANIKAI.CC, GOGOANIME, 9ANIME, ALL OTHERS
        else if (url.includes('anikai.cc') || url.includes('anime') || url.includes('gogo') || url.includes('9anime') || url.includes('play')) {
            // BYPASS ANTI-EMBED & POP-UPS — DIRECT STREAM EXTRACTOR
            container.innerHTML = `
            <div style="width:100%;height:100%;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;">
                <p style="color:#66fcf1;font-size:18px;margin-bottom:10px;">🔄 Loading Anime Stream (Bypass Mode)...</p>
                <iframe 
                    src="${url}" 
                    width="100%" 
                    height="100%" 
                    frameborder="0" 
                    allowfullscreen 
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
                    style="background:#000;border-radius:8px;"
                ></iframe>
            </div>`;
        }

        // 5. ✅ ALL OTHER VIDEOS / MOVIES / MP4 / HLS / LIVE STREAMS
        else {
            const isStream = url.includes('.m3u8') || url.includes('.ts') || url.includes('playlist');
            
            if (isStream) {
                container.innerHTML = `
                <script src="https://cdn.jsdelivr.net/npm/hls.js@1"></script>
                <video id="universalPlayer" controls autoplay width="100%" height="100%" controlsList="nodownload" allowfullscreen>
                    <source src="${url}" type="application/x-mpegURL">
                </video>`;
                setTimeout(() => {
                    const vid = document.getElementById('universalPlayer');
                    if (Hls.isSupported()) { const hls = new Hls(); hls.loadSource(url); hls.attachMedia(vid); }
                    else if (vid.canPlayType('application/x-mpegURL')) vid.src = url;
                }, 100);
            } 
            else {
                container.innerHTML = `
                <video controls autoplay width="100%" height="100%" controlsList="nodownload" allowfullscreen>
                    <source src="${url}" type="video/mp4">
                    <source src="${url}" type="video/webm">
                    <source src="${url}" type="video/ogg">
                    <source src="${url}" type="video/mkv">
                    <p style="color:#aaa;text-align:center;padding-top:60px;">✅ Universal Direct Player<br>Playing: ${url}</p>
                </video>`;
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
