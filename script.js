// === SYSTEM SETTINGS ===
let freeViews = parseInt(localStorage.getItem('streamclean_free_views')) || 2;
let player;

// === UPDATE FREE USES COUNT ON SCREEN ===
function updateFreeCount() {
    document.getElementById('freeCount').textContent = freeViews;
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

// === FULL MEDIA PLAYER ENGINE — NO ADS, NO REDIRECTS, FULLSCREEN WORKS ===
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
        // FREE USER = 2 USES ONLY
        return freeViews > 0;
    }

    loadBtn.addEventListener('click', () => {
        const url = mediaLink.value.trim();
        if (!url) return;

        // CHECK IF ALLOWED
        if (!canPlay()) {
            lockMsg.classList.remove('hidden');
            container.classList.add('locked');
            return;
        }
        lockMsg.classList.add('hidden');
        container.classList.remove('locked');

        // COUNT FREE USE (ONLY IF NOT ADMIN/SUBSCRIBED)
        const user = JSON.parse(localStorage.getItem('streamclean_currentUser'));
        if (!user || (!user.isAdmin && !user.subscribed)) {
            freeViews--;
            updateFreeCount();
        }

        // --- DETECT LINK TYPE & PLAY ---
        // YOUTUBE
        if (url.includes('youtu')) {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = url.match(regExp);
            if (!match || match[2].length !== 11) return alert('Invalid YouTube link');
            
            container.innerHTML = `<div id="ytplayer" class="w-full h-full"></div>`;
            player = new YT.Player('ytplayer', {
                height: '100%',
                width: '100%',
                videoId: match[2],
                playerVars: {
                    autoplay: 1,
                    controls: 1,
                    rel: 0,
                    modestbranding: 1
                }
            });
        }
        // SPOTIFY
        else if (url.includes('spotify')) {
            const embedUrl = url.replace('open.spotify.com', 'embed.spotify.com');
            container.innerHTML = `<iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
        }
        // ANY STREAM / ANIME / VIDEO FILE
        else {
            container.innerHTML = `<video controls autoplay width="100%" height="100%" controlsList="nodownload" allowfullscreen>
                <source src="${url}" type="video/mp4">
                <source src="${url}" type="video/webm">
                Your browser does not support this video.
            </video>`;
        }
    });
}

// === SIGN IN / UP MODALS — WORKING ===
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
