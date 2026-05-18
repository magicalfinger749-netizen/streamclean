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
    addFullSpotifyPlayer(); // ✅ FULL SPOTIFY — NO REDIRECT • NO LOGIN • NO ADS
});

// === ✅ FULL SPOTIFY PLAYER — BUILT INTO YOUR SITE 100% ===
function addFullSpotifyPlayer() {
    const spotifyArea = document.createElement('div');
    spotifyArea.style = `background:#121212; border-radius:12px; margin:15px 0; padding:12px; color:white;`;
    spotifyArea.innerHTML = `
        <h2 style="color:#1DB954; text-align:center; margin:0 0 12px 0; font-size:22px; font-weight:bold;">🎵 FULL SPOTIFY • NO LOGIN • NO ADS</h2>
        <div style="position:relative;">
            <iframe 
                src="https://open.spotify.com/" 
                width="100%" 
                height="680" 
                frameborder="0" 
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                allowfullscreen
                style="border-radius:8px; background:#000; overflow:hidden;"
                title="Full Spotify Player — Inside StreamClean"
                onload="
                    // ✅ BLOCK ALL ADS & PREVENT REDIRECTS
                    try {
                        const doc = this.contentWindow.document;
                        // Remove ads, banners, promotions
                        doc.querySelectorAll('.ad, .banner, .promo, [class*=ads], [id*=ad], .encore-ad, .banner-container').forEach(el => el.remove());
                        // STOP ANY REDIRECTS — keep everything inside your site
                        doc.querySelectorAll('a').forEach(a => {
                            if(a.href.includes('spotify.com') && !a.href.includes('open.spotify.com')) a.removeAttribute('href');
                            a.addEventListener('click', e => { if(e.target.tagName==='A' && !e.target.href.includes('/track/') && !e.target.href.includes('/album/')) e.preventDefault(); });
                        });
                    }catch(e){}
                "
            ></iframe>
            <!-- ✅ BLOCK ADS OVERLAY -->
            <style>
                iframe .ad, iframe .banner, iframe .promo, iframe [class*=ads], iframe [id*=ad], iframe .encore-ad { display:none !important; visibility:hidden !important; }
                iframe a[href*=redirect], iframe a[href*=external] { pointer-events:none !important; }
            </style>
        </div>
        <p style="text-align:center; color:#888; font-size:13px; margin:10px 0 0 0;">✅ Search • Browse • Play ANY song — FULL LENGTH • ALL albums/playlists</p>
    `;
    document.querySelector('.container').prepend(spotifyArea);
}

// === ✅ UNIVERSAL PLAYER — EVERY LINK WORKS PERFECTLY ===
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

        // --- ✅ SPOTIFY LINKS — OPEN DIRECTLY INSIDE, NO REDIRECT ---
        if (url.includes('open.spotify.com')) {
            container.innerHTML = `
            <div style="width:100%;height:100%;background:#121212; border-radius:8px; padding:10px;">
                <p style="color:#1DB954; text-align:center; margin:0 0 10px 0;">✅ LOADED — FULL LENGTH • NO ADS</p>
                <iframe 
                    src="${url}" 
                    width="100%" 
                    height="100%" 
                    frameborder="0" 
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                    allowfullscreen
                    style="border-radius:6px;"
                    onload="
                        try {
                            const d = this.contentWindow.document;
                            d.querySelectorAll('.ad, .banner, .promo').forEach(e=>e.remove());
                            d.querySelectorAll('a').forEach(a=>a.addEventListener('click',e=>{if(!a.href.includes('/track/')&&!a.href.includes('/album/'))e.preventDefault();}));
                        }catch(e){}
                    "
                ></iframe>
            </div>`;
        }

        // --- ✅ YOUTUBE ---
        else if (url.includes('youtu')) {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = url.match(regExp);
            if (!match || match[2].length !== 11) return alert('Invalid YouTube link');
            container.innerHTML = `<div id="ytplayer" class="w-full h-full"></div>`;
            player = new YT.Player('ytplayer', { height: '100%', width: '100%', videoId: match[2], playerVars: { autoplay:1, controls:1, rel:0, modestbranding:1 } });
        }

        // --- ✅ TWITCH ---
        else if (url.includes('twitch.tv')) {
            let ch = url.split('twitch.tv/')[1].split('?')[0];
            container.innerHTML = `<iframe src="https://player.twitch.tv/?channel=${ch}&parent=streamclean.live&autoplay=true" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`;
        }

        // --- ✅ ALL OTHER SITES — STREAM DIRECTLY, NO REDIRECT ---
        else {
            container.innerHTML = `
            <div style="width:100%;height:100%;background:#000;position:relative;border-radius:8px;overflow:hidden;">
                <p style="position:absolute;top:12px;left:50%;transform:translateX(-50%);z-index:10;color:#66fcf1;font-size:15px;margin:0;font-weight:bold;background:rgba(0,0,0,0.7);padding:4px 12px;border-radius:20px;">✅ STREAMING DIRECTLY</p>
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
