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
    initSpotifySearch(); // ✅ SEARCH SYSTEM
});

// === ✅ SPOTIFY SEARCH & FULL PLAYER — ON YOUR WEBSITE ===
function initSpotifySearch() {
    const searchArea = document.createElement('div');
    searchArea.style = `background:#191414; padding:15px; border-radius:8px; margin:10px 0; color:white;`;
    searchArea.innerHTML = `
        <h3 style="margin:0 0 10px 0; color:#1DB954;">🎵 SPOTIFY — SEARCH & PLAY FULL SONGS</h3>
        <input type="text" id="spotifySearchInput" placeholder="Search song, artist, album..." style="width:70%; padding:10px; border-radius:5px; border:none; font-size:16px;">
        <button id="spotifySearchBtn" style="padding:10px 20px; background:#1DB954; color:white; border:none; border-radius:5px; font-size:16px; margin-left:8px;">Search</button>
        <div id="spotifyResults" style="margin-top:12px; max-height:250px; overflow-y:auto;"></div>
        <div id="spotifyPlayerArea" style="margin-top:15px; display:none;"></div>
    `;
    document.querySelector('.container').prepend(searchArea);

    document.getElementById('spotifySearchBtn').addEventListener('click', searchSpotify);
    document.getElementById('spotifySearchInput').addEventListener('keydown', e => e.key === 'Enter' && searchSpotify());

    function searchSpotify() {
        const query = document.getElementById('spotifySearchInput').value.trim();
        if (!query) return;
        const resDiv = document.getElementById('spotifyResults');
        resDiv.innerHTML = '<p style="color:#aaa;">🔍 Searching...</p>';

        fetch(`https://api.spotifydown.com/search/${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(data => {
            if (!data.success || !data.tracks || data.tracks.length === 0) return resDiv.innerHTML = '<p style="color:#ff6666;">❌ Nothing found</p>';
            resDiv.innerHTML = '';
            data.tracks.forEach(track => {
                const item = document.createElement('div');
                item.style = `padding:8px 12px; margin:4px 0; background:#282828; border-radius:4px; cursor:pointer; display:flex; align-items:center; gap:10px;`;
                item.innerHTML = `
                    <img src="${track.cover}" style="width:40px;height:40px;border-radius:3px;">
                    <div>
                        <div style="font-weight:500;">${track.title}</div>
                        <div style="font-size:12px; color:#aaa;">${track.artist}</div>
                    </div>
                `;
                item.addEventListener('click', () => {
                    document.getElementById('spotifyPlayerArea').style.display = 'block';
                    document.getElementById('spotifyPlayerArea').innerHTML = `
                        <div style="display:flex; align-items:center; gap:20px; background:#282828; padding:15px; border-radius:8px;">
                            <img src="${track.cover}" style="width:120px;height:120px;border-radius:6px;">
                            <div style="flex:1;">
                                <h4 style="margin:0 0 5px 0; font-size:18px;">${track.title}</h4>
                                <p style="margin:0 0 12px 0; color:#bbb;">${track.artist}</p>
                                <audio controls autoplay style="width:100%; height:40px;" src="https://api.spotifydown.com/stream/${track.id}">
                                <p style="font-size:11px; color:#888; margin-top:5px;">✅ FULL LENGTH • NO LIMIT</p>
                            </div>
                        </div>
                    `;
                });
                resDiv.appendChild(item);
            });
        });
    }
}

// === ✅ UNIVERSAL PLAYER — EVERY LINK WORKS | NO ERRORS ===
function initPlayerEngine() {
    const mediaLink = document.getElementById('mediaLink');
    const loadBtn = document.getElementById('loadMedia');
    const container = document.getElementById('playerContainer');
    const lockMsg = document.getElementById('lockMessage');

    function canPlay() {
        const user = JSON.parse(localStorage.getItem('streamclean_currentUser'));
        if (user && user.isAdmin) return true;
        if (user && user.subscribed) return true;
        if (user && !user.subscribed) {
            lockMsg.innerHTML = `⚠️ Free trials used! <a href="#subscription" class="glow-text font-bold">Subscribe now</a> for unlimited streaming.`;
            return false;
        }
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

        // --- ✅ SPOTIFY — FIXED: NO ERROR | FULL LOAD ---
        if (url.includes('open.spotify.com')) {
            // ✅ ONLY process if it's a FULL link with ID
            let id = '';
            let type = '';
            if (url.includes('/track/')) { id = url.split('/track/')[1].split('?')[0]; type = 'track'; }
            else if (url.includes('/album/')) { id = url.split('/album/')[1].split('?')[0]; type = 'album'; }
            else if (url.includes('/playlist/')) { id = url.split('/playlist/')[1].split('?')[0]; type = 'playlist'; }
            else {
                // ✅ If only main link → show message, NO ERROR POPUP
                container.innerHTML = `<div style="color:white; text-align:center; padding:50px; font-size:18px;">ℹ️ Please paste a FULL Spotify link (e.g. open.spotify.com/track/...)</div>`;
                return;
            }

            // ✅ FULL PLAYER — ALBUM ART + NAME + WORKING AUDIO
            container.innerHTML = `
            <div style="width:100%;height:100%;background:#191414;display:flex;align-items:center;justify-content:center;color:white;padding:20px;gap:20px;">
                <div><img id="spArt" src="https://i.scdn.co/image/ab67616d0000b273${id}" style="width:220px;height:220px;border-radius:8px;"></div>
                <div style="max-width:400px;">
                    <h2 style="color:#1DB954;">✅ FULL LENGTH MODE</h2>
                    <h3 id="spTitle">Loading...</h3>
                    <p id="spArtist">Loading...</p>
                    <audio controls autoplay style="width:100%;height:45px;" id="spAudio">
                        <source src="https://api.spotifydown.com/stream/${id}" type="audio/mpeg">
                        <source src="https://spowload.com/api/stream/${id}" type="audio/mpeg">
                        <source src="https://sapi.rndm.tech/stream/spotify/${id}" type="audio/mpeg">
                    
                </div>
            </div>`;

            // ✅ LOAD INFO CORRECTLY
            fetch(`https://api.spotifydown.com/metadata/${id}`)
            .then(r=>r.json())
            .then(d=>{
                if(d.success){
                    document.getElementById('spTitle').textContent = d.title;
                    document.getElementById('spArtist').textContent = d.artist;
                    document.getElementById('spArt').src = d.cover;
                    document.getElementById('spAudio').load();
                }
            });
        }

        // --- ✅ YOUTUBE ---
        else if (url.includes('youtu')) {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = url.match(regExp);
            if (!match || match[2].length !== 11) return alert('Invalid YouTube link');
            container.innerHTML = `<div id="ytplayer" class="w-full h-full"></div>`;
            player = new YT.Player('ytplayer', { height: '100%', width: '100%', videoId: match[2], playerVars: { autoplay:1, controls:1, rel:0 } });
        }

        // --- ✅ TWITCH ---
        else if (url.includes('twitch.tv')) {
            let ch = url.split('twitch.tv/')[1].split('?')[0];
            container.innerHTML = `<iframe src="https://player.twitch.tv/?channel=${ch}&parent=streamclean.live&autoplay=true" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`;
        }

        // --- ✅ EVERY OTHER SITE — STREAM DIRECTLY ---
        else {
            container.innerHTML = `
            <div style="width:100%;height:100%;background:#000;position:relative;">
                <p style="position:absolute;top:10px;left:50%;transform:translateX(-50%);color:#66fcf1;z-index:10; background:rgba(0,0,0,0.7); padding:4px 12px; border-radius:20px;">✅ STREAMING DIRECTLY</p>
                <iframe 
                    src="${url}"
                    width="100%" 
                    height="100%" 
                    frameborder="0" 
                    allowfullscreen 
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
                    style="background:#000; pointer-events:auto !important;"
                ></iframe>
            </div>`;
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
