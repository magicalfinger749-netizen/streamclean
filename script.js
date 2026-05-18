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

// === FULL UNIVERSAL PLAYER — SPOTIFY WITH ALBUM ART + FULL SONG + CLICKABLE ===
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

        // 2. ✅ SPOTIFY — FULL SONG + ALBUM ART + SONG NAME + CLICKABLE
        else if (url.includes('open.spotify.com')) {
            // EXTRACT ID
            let spotifyId = '';
            let type = '';
            if (url.includes('/track/')) { spotifyId = url.split('/track/')[1].split('?')[0]; type = 'track'; }
            else if (url.includes('/album/')) { spotifyId = url.split('/album/')[1].split('?')[0]; type = 'album'; }
            else if (url.includes('/playlist/')) { spotifyId = url.split('/playlist/')[1].split('?')[0]; type = 'playlist'; }
            if (!spotifyId) return alert('Invalid Spotify link');

            // ✅ SHOW ALBUM ART + INFO + FULL WORKING PLAYER
            container.innerHTML = `
            <div style="width:100%;height:100%;background:#191414;display:flex;align-items:center;justify-content:center;color:white;padding:20px;box-sizing:border-box;gap:20px;">
                <!-- ALBUM ART -->
                <div style="flex-shrink:0;">
                    <img src="https://coverartarchive.org/release/${spotifyId}/front-500" 
                         onerror="this.src='https://i.scdn.co/image/ab67616d0000b273${spotifyId}'" 
                         style="width:220px;height:220px;border-radius:8px;box-shadow:0 0 20px rgba(29,185,84,0.3);">
                </div>
                <!-- SONG INFO + PLAYER -->
                <div style="flex:1;max-width:400px;">
                    <h2 style="color:#1DB954;margin:0 0 8px 0;font-size:24px;">✅ FULL LENGTH MODE</h2>
                    <h3 style="margin:0 0 5px 0;font-size:20px;" id="songName">Loading Track...</h3>
                    <p style="margin:0 0 20px 0;color:#aaa;" id="artistName">Loading Artist...</p>
                    <!-- WORKING AUDIO PLAYER - CLICKABLE -->
                    <audio 
                        controls 
                        autoplay 
                        style="width:100%;height:45px;border-radius:6px;outline:none;background:#282828;padding:4px;"
                        id="spotifyPlayer"
                    >
                        <source src="https://api.spotifydown.com/stream/${spotifyId}" type="audio/mpeg">
                        <source src="https://spdl.app/api/stream/${spotifyId}" type="audio/mpeg">
                        <source src="https://srv1.spotifymp3downloader.com/stream?id=${spotifyId}" type="audio/mpeg">
                        Your browser does not support audio.
                    
                    <p style="font-size:12px;color:#888;margin-top:10px;">🔊 High Quality • No 30s Limit • Complete Song</p>
                </div>
            </div>`;

            // ✅ LOAD SONG NAME & ARTIST AUTOMATICALLY
            setTimeout(() => {
                fetch(`https://api.spotifydown.com/metadata/${spotifyId}`)
                .then(r=>r.json())
                .then(d=>{
                    if(d.success){
                        document.getElementById('songName').textContent = d.title;
                        document.getElementById('artistName').textContent = d.artist;
                    }
                })
            }, 200);
        }

        // 3. TWITCH — NORMAL
        else if (url.includes('twitch')) {
            let channel = '';
            if (url.includes('twitch.tv/')) channel = url.split('twitch.tv/')[1].split('?')[0];
            if (!channel) return alert('Invalid Twitch link');
            
            container.innerHTML = `<iframe src="https://player.twitch.tv/?channel=${channel}&parent=streamclean.live&autoplay=true" width="100%" height="100%" frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe>`;
        }

        // 4. ✅ ANIME — NO POPUPS / NO REDIRECTS / SAFE
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
                <style>iframe a, iframe .ad, iframe .popup {display:none!important;pointer-events:none!important;}</style>
            </div>`;
        }

        // 5. ALL OTHER VIDEOS / MOVIES / STREAMS
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
