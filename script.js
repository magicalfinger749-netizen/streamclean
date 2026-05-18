// ==============================================
// ✅ STREAMCLEAN — FULLY UPDATED
// ✅ Create/Sign In WORKING, Forgot Password Added, Free Flow Fixed
// ✅ 10 Free Uses FIRST, then ask to register
// ==============================================

// --------------------------
// GLOBAL SETTINGS
// --------------------------
let freeUsesLeft = localStorage.getItem('freeUsesLeft') ? parseInt(localStorage.getItem('freeUsesLeft')) : 10;
let currentUser = null;
let players = [];
let playlists = [];
const STRIPE_LINK = "https://buy.stripe.com/aFa6oHarE6aa10N3M9bQY00";
const ADMIN_EMAIL = "magicalfinger749@gmail.com";
const ADMIN_PASS = "Kinghashim2";

// --------------------------
// INITIALIZE EVERYTHING
// --------------------------
document.addEventListener('DOMContentLoaded', () => {
    updateFreeCountDisplay();
    setupModals();
    buildLayoutSelector();
    buildPlayers(10);
    buildFAQ();
    buildLegalNotice();
    checkUserSession();
    setupSubscribeButton();
    loadUserPlaylists();
    setupHomeButton();
    setupFreeUsageLink();
});

// --------------------------
// ✅ FREE USES — 10 FIRST BEFORE ACCOUNT
// --------------------------
function updateFreeCountDisplay() {
    if (currentUser?.subscribed) {
        document.querySelector('.free-count-box').innerHTML = `
            🎁 <strong style="color:#66fcf1;">✅ UNLIMITED STREAMS ACTIVE</strong>
        `;
    } else {
        // ✅ REMOVED "FOREVER", MADE CLICKABLE
        document.querySelector('.free-count-box').innerHTML = `
            🎁 <strong id="freeUsageLink" style="color:#66fcf1; text-decoration:underline; cursor:pointer;">Free Uses Left: <span id="freeCount">${freeUsesLeft}</span> — 10 streams free</strong>
        `;
    }
}

// ✅ CLICK FREE USES → GO TO ENGINES
function setupFreeUsageLink() {
    document.addEventListener('click', (e) => {
        if (e.target.id === 'freeUsageLink') {
            document.getElementById('mainContainer').scrollIntoView({behavior:'smooth'});
        }
    });
}

function useFreeStream() {
    if (currentUser?.subscribed) return true;

    if (freeUsesLeft > 0) {
        freeUsesLeft--;
        updateFreeCountDisplay();
        localStorage.setItem('freeUsesLeft', freeUsesLeft);
        return true;
    } else {
        alert("⚠️ You have used all 10 free streams!\n\nCreate an account & subscribe to get unlimited access.");
        window.scrollTo(0,0);
        return false;
    }
}

// --------------------------
// ✅ HOME BUTTON — GO TO FULL HOME
// --------------------------
function setupHomeButton() {
    document.querySelector('.nav-links a[href="#"]').addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({top:0, behavior:'smooth'});
    });
}

// --------------------------
// ✅ SUBSCRIBE BUTTON LOGIC
// --------------------------
function setupSubscribeButton() {
    const topBtn = document.querySelector('.subscribe-top');
    const heroBtn = document.querySelector('.premium-btn.big-btn');

    const goSubscribe = (e) => {
        e.preventDefault();
        if (!currentUser) {
            alert("⚠️ Create Account or Sign In first to link unlimited access.");
            document.getElementById('openSignUp').click();
            return;
        }
        if (currentUser.subscribed) {
            alert("✅ You already have unlimited access!");
            return;
        }
        if (confirm("After payment, unlimited access will be added to your account.")) {
            localStorage.setItem('payingUserEmail', currentUser.email);
            window.open(`${STRIPE_LINK}?email=${encodeURIComponent(currentUser.email)}`, '_blank');
        }
    };

    topBtn.addEventListener('click', goSubscribe);
    heroBtn.addEventListener('click', goSubscribe);
}

// --------------------------
// ✅ ACCOUNT SYSTEM — FULLY WORKING + FORGOT PASSWORD
// --------------------------
function setupModals() {
    const signInBtn = document.getElementById('openSignIn');
    const signUpBtn = document.getElementById('openSignUp');
    const signInModal = document.getElementById('signInModal');
    const signUpModal = document.getElementById('signUpModal');
    const closeBtns = document.querySelectorAll('.close-modal');
    const loginBtn = document.getElementById('loginBtn');
    const createBtn = document.getElementById('createBtn');

    signInBtn.addEventListener('click', e => { e.preventDefault(); signInModal.classList.remove('hidden'); });
    signUpBtn.addEventListener('click', e => { e.preventDefault(); signUpModal.classList.remove('hidden'); });
    closeBtns.forEach(btn => btn.addEventListener('click', () => {
        signInModal.classList.add('hidden');
        signUpModal.classList.add('hidden');
        document.getElementById('forgotModal')?.classList.add('hidden');
    }));

    // ✅ LOGIN — WORKING
    loginBtn.addEventListener('click', async () => {
        const email = document.getElementById('loginEmail').value.trim();
        const pass = document.getElementById('loginPass').value.trim();
        if (!email || !pass) return alert("❌ Fill all fields!");

        const res = await fetch('/login', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body:JSON.stringify({email, password:pass})
        });
        const data = await res.json();
        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateFreeCountDisplay();
            loadUserPlaylists();
            alert(`✅ Welcome ${email}!`);
            signInModal.classList.add('hidden');
        } else {
            alert(data.error);
            // ✅ FORGOT PASSWORD LINK IF WRONG
            if (data.error.includes("password") || data.error.includes("email")) {
                if (confirm("❌ Wrong details? Click OK to reset password.")) openForgotModal(email);
            }
        }
    });

    // ✅ CREATE ACCOUNT — FULLY WORKING
    createBtn.addEventListener('click', async () => {
        const email = document.getElementById('newEmail').value.trim();
        const pass = document.getElementById('newPass').value.trim();
        const confirmPass = document.getElementById('newPass2').value.trim();

        if (!email || !pass || !confirmPass) return alert("❌ Fill all fields!");
        if (pass !== confirmPass) return alert("❌ Passwords do NOT match!");
        if (pass.length < 6) return alert("❌ Password must be at least 6 characters!");

        const res = await fetch('/create-account', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body:JSON.stringify({email, password:pass})
        });
        const data = await res.json();
        alert(data.success ? `✅ ${data.message}` : `❌ ${data.error}`);
        if (data.success) signUpModal.classList.add('hidden');
    });

    // ✅ FORGOT PASSWORD FUNCTION
    function openForgotModal(preEmail = "") {
        if (document.getElementById('forgotModal')) return;
        const modal = document.createElement('div');
        modal.id = 'forgotModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Reset Password</h2>
                <input type="email" id="forgotEmail" placeholder="Your email" value="${preEmail}">
                <button id="sendResetBtn">Send Reset Link</button>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        modal.classList.remove('hidden');

        document.getElementById('sendResetBtn').addEventListener('click', async () => {
            const email = document.getElementById('forgotEmail').value.trim();
            if (!email) return alert("❌ Enter your email!");
            const res = await fetch('/forgot-password', {
                method:'POST', headers:{'Content-Type':'application/json'},
                body:JSON.stringify({email})
            });
            const data = await res.json();
            alert(data.message);
            modal.remove();
        });
    }

    // ✅ ADD CONFIRM PASSWORD + FORGOT LINK TO CREATE/SIGNIN
    document.querySelector('#signUpModal .modal-content').insertAdjacentHTML('beforeend', `
        <input type="password" id="newPass2" placeholder="Confirm password">
    `);
    document.querySelector('#signInModal .modal-content').insertAdjacentHTML('beforeend', `
        <p style="text-align:center; margin-top:10px; color:#66fcf1; cursor:pointer;" id="openForgot">Forgot Password?</p>
    `);
    document.getElementById('openForgot').addEventListener('click', () => { signInModal.classList.add('hidden'); openForgotModal(); });
}

function checkUserSession() {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
        currentUser = JSON.parse(saved);
        updateFreeCountDisplay();
        loadUserPlaylists();
    }
}

// --------------------------
// ✅ LAYOUT & PLAYERS
// --------------------------
function buildLayoutSelector() {
    const container = document.getElementById('mainContainer');
    const div = document.createElement('div');
    div.id = 'layoutSelector';
    div.innerHTML = `
        <h3>📐 Change Layout View</h3>
        <select id="layoutPicker">
            <option value="grid">Grid View (All Equal)</option>
            <option value="layout3-7">3 Big + 7 Small</option>
            <option value="layout5-5">5 Big + 5 Small</option>
            <option value="list">List View (Full Width)</option>
        </select>
    `;
    container.appendChild(div);

    document.getElementById('layoutPicker').addEventListener('change', e => {
        const layout = e.target.value;
        document.querySelectorAll('.media-player-box').forEach((box, i) => {
            box.style.gridColumn = '';
            box.style.gridRow = '';
            box.style.height = 'auto';

            if (layout === 'layout3-7') {
                box.style.gridColumn = i < 3 ? 'span 4' : 'span 2';
                box.style.height = i < 3 ? '500px' : '300px';
            } else if (layout === 'layout5-5') {
                box.style.gridColumn = i < 5 ? 'span 3' : 'span 2';
                box.style.height = i < 5 ? '450px' : '280px';
            } else if (layout === 'list') {
                box.style.gridColumn = 'span 12';
                box.style.height = '500px';
            }
        });
    });
}

function buildPlayers(count) {
    const container = document.getElementById('mainContainer');
    const playersGrid = document.createElement('div');
    playersGrid.style.display = 'grid';
    playersGrid.style.gridTemplateColumns = 'repeat(12, 1fr)';
    playersGrid.style.gap = '20px';
    playersGrid.id = 'playersGrid';
    container.appendChild(playersGrid);

    for (let i = 1; i <= count; i++) {
        const playerBox = document.createElement('div');
        playerBox.className = 'media-player-box';
        playerBox.id = `playerBox${i}`;
        playerBox.innerHTML = `
            <h2>Player ${i}</h2>
            <div style="display:flex; gap:10px; margin-bottom:10px;">
                <input type="text" class="mediaInput" id="input${i}" placeholder="Paste YouTube / Twitch URL">
                <button class="loadBtn" id="load${i}">Load</button>
            </div>
            <div style="display:flex; gap:5px; margin-bottom:10px;">
                <button class="playBtn" id="play${i}">Play</button>
                <button class="pauseBtn" id="pause${i}">Pause</button>
                <button class="muteBtn" id="mute${i}">Mute</button>
                <button class="unmuteBtn" id="unmute${i}">Unmute</button>
            </div>
            <div class="playerContainer" id="container${i}"></div>
        `;
        playersGrid.appendChild(playerBox);
        document.getElementById(`container${i}`).setAttribute('allowfullscreen', 'true');
        document.getElementById(`container${i}`).style.isolation = 'isolate';

        document.getElementById(`load${i}`).addEventListener('click', () => loadMedia(i));
        document.getElementById(`play${i}`).addEventListener('click', () => playMedia(i));
        document.getElementById(`pause${i}`).addEventListener('click', () => pauseMedia(i));
        document.getElementById(`mute${i}`).addEventListener('click', () => muteMedia(i));
        document.getElementById(`unmute${i}`).addEventListener('click', () => unmuteMedia(i));

        players[i] = { type: null, api: null };
    }
}

function loadMedia(num) {
    if (!useFreeStream()) return;
    const url = document.getElementById(`input${num}`).value.trim();
    const container = document.getElementById(`container${num}`);
    container.innerHTML = '';

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const vidId = extractYoutubeId(url);
        players[num].type = 'youtube';
        players[num].api = new YT.Player(`container${num}`, {
            height: '100%', width: '100%', videoId: vidId,
            playerVars: { autoplay: 1, controls: 1, modestbranding: 1 }
        });
    }
    else if (url.includes('twitch.tv')) {
        players[num].type = 'twitch';
        const channel = url.split('twitch.tv/')[1].split('/')[0];
        container.innerHTML = `
            <iframe src="https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}&autoplay=true"
            width="100%" height="100%" frameborder="0" allowfullscreen
            style="position:absolute; top:0; left:0;"></iframe>
        `;
    }
    else alert("❌ Only YouTube/Twitch links work!");
}

function extractYoutubeId(url) {
    const match = url.match(/(?:youtu\.be\/|v=|\/embed\/)([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

function playMedia(n) { if (players[n].api) players[n].api.playVideo(); }
function pauseMedia(n) { if (players[n].api) players[n].api.pauseVideo(); }
function muteMedia(n) { if (players[n].api) players[n].api.mute(); }
function unmuteMedia(n) { if (players[n].api) players[n].api.unMute(); }

// --------------------------
// ✅ PLAYLISTS
// --------------------------
function setupPlaylistManager() {
    const container = document.getElementById('mainContainer');
    const plDiv = document.createElement('div');
    plDiv.id = 'playlistManager';
    plDiv.innerHTML = `
        <h3>💾 My Playlists <span id="playlistNote"></span></h3>
        <button id="savePlaylistBtn" class="premium-btn">Save Current Layout</button>
        <div id="playlistsList"></div>
    `;
    container.appendChild(plDiv);

    document.getElementById('savePlaylistBtn').addEventListener('click', () => {
        if (!currentUser) return alert("⚠️ Sign in first to save playlists!");
        const name = prompt("Name your playlist:");
        if (!name) return;
        const links = [];
        for (let i=1; i<=10; i++) links.push(document.getElementById(`input${i}`).value);
        
        if (!currentUser.playlists) currentUser.playlists = [];
        if (!currentUser.subscribed && currentUser.playlists.length >= 3) return alert("⚠️ Free users: max 3 playlists. Subscribe for unlimited.");
        
        currentUser.playlists.push({name, links});
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        saveUserPlaylistsToDB();
        updatePlaylistUI();
        alert("✅ Playlist saved!");
    });

    updatePlaylistUI();
}

function loadUserPlaylists() {
    if (!currentUser) return;
    playlists = currentUser.playlists || [];
    updatePlaylistUI();
    const noteEl = document.getElementById('playlistNote
