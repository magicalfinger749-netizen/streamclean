// ==============================================
// ✅ STREAMCLEAN — FULL CODE
// ✅ UNLIMITED ACCESS LINKED TO ACCOUNT AFTER PAYMENT
// ✅ FLOW: Must have account → pay → access linked forever
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
});

// --------------------------
// ✅ FREE USES VS UNLIMITED (LINKED TO ACCOUNT)
// --------------------------
function updateFreeCountDisplay() {
    // ✅ IF USER PAID → SHOW UNLIMITED INSTEAD OF NUMBER
    if (currentUser?.subscribed) {
        document.querySelector('.free-count-box').innerHTML = `
            🎁 <strong style="color:#66fcf1;">✅ UNLIMITED STREAMS ACTIVE</strong> — Enjoy full access
        `;
    } else {
        document.getElementById('freeCount').textContent = freeUsesLeft;
        localStorage.setItem('freeUsesLeft', freeUsesLeft);
    }
}

function useFreeStream() {
    // ✅ PAID USERS = ALWAYS UNLIMITED
    if (currentUser?.subscribed) return true;

    // ✅ FREE USERS = LIMITED
    if (freeUsesLeft > 0) {
        freeUsesLeft--;
        updateFreeCountDisplay();
        return true;
    } else {
        alert("⚠️ No free uses left! You must subscribe for unlimited access.");
        window.open(STRIPE_LINK, '_blank');
        return false;
    }
}

// --------------------------
// ✅ SUBSCRIBE BUTTON LOGIC — MUST BE LOGGED IN FIRST
// --------------------------
function setupSubscribeButton() {
    const topBtn = document.querySelector('.subscribe-top');
    const heroBtn = document.querySelector('.premium-btn.big-btn');

    const goSubscribe = (e) => {
        e.preventDefault();

        // ✅ CHECK IF LOGGED IN FIRST
        if (!currentUser) {
            alert("⚠️ Please Create Account or Sign In first!\n\nYou must have an account to get unlimited access linked to you.");
            document.getElementById('openSignUp').click();
            return;
        }

        // ✅ ALREADY PAID
        if (currentUser.subscribed) {
            alert("✅ You already have UNLIMITED access! Enjoy all features.");
            return;
        }

        // ✅ GO PAY → AFTER PAYMENT IT LINKS TO YOUR ACCOUNT
        if (confirm("You will be sent to payment page.\n\nAfter payment, unlimited access will be activated on your account forever.")) {
            // Save current email so we know who paid
            localStorage.setItem('payingUserEmail', currentUser.email);
            window.open(`${STRIPE_LINK}?email=${encodeURIComponent(currentUser.email)}`, '_blank');
            
            // ✅ CHECK EVERY 3 SECONDS IF PAYMENT DONE
            const checkPaid = setInterval(() => {
                if (currentUser?.subscribed) {
                    clearInterval(checkPaid);
                    updateFreeCountDisplay();
                    alert("✅ SUCCESS! Unlimited access activated on your account!");
                }
            }, 3000);
        }
    };

    topBtn.addEventListener('click', goSubscribe);
    heroBtn.addEventListener('click', goSubscribe);
}

// --------------------------
// ✅ ACCOUNT SYSTEM — SIGN IN / CREATE / VERIFY
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
        signInModal.classList.add('hidden'); signUpModal.classList.add('hidden');
    }));

    // ✅ LOGIN — ONLY VERIFIED USERS
    loginBtn.addEventListener('click', async () => {
        const email = document.getElementById('loginEmail').value.trim();
        const pass = document.getElementById('loginPass').value.trim();
        const res = await fetch('/login', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body:JSON.stringify({email, password:pass})
        });
        const data = await res.json();
        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateFreeCountDisplay();
            loadUserPlaylists(); // ✅ LOAD THEIR SAVED PLAYLISTS
            alert(`✅ Welcome ${email}! ${currentUser.subscribed ? '— UNLIMITED ACCESS ACTIVE' : ''}`);
            signInModal.classList.add('hidden');
        } else alert(data.error);
    });

    // ✅ CREATE ACCOUNT → SEND VERIFY EMAIL
    createBtn.addEventListener('click', async () => {
        const email = document.getElementById('newEmail').value.trim();
        const pass = document.getElementById('newPass').value.trim();
        if (!email || !pass) return alert("❌ Fill all fields!");

        const res = await fetch('/create-account', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body:JSON.stringify({email, password:pass})
        });
        const data = await res.json();
        alert(data.success ? `✅ ${data.message}` : `❌ ${data.error}`);
        if (data.success) signUpModal.classList.add('hidden');
    });
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
// ✅ LAYOUT CHANGER
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

// --------------------------
// ✅ MEDIA PLAYERS — FULLSCREEN FIXED
// --------------------------
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

        // ✅ FULLSCREEN FIX: Others keep playing
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
            <iframe
                src="https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}&autoplay=true"
                width="100%" height="100%" frameborder="0" allowfullscreen
                style="position:absolute; top:0; left:0; width:100%; height:100%;"
            ></iframe>
        `;
    }
    else {
        alert("❌ Only YouTube or Twitch links work!");
    }
}

function extractYoutubeId(url) {
    const match = url.match(/(?:youtu\.be\/|v=|\/embed\/)([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

function playMedia(n) { if (players[n].api) players[n].api.playVideo(); }
function pauseMedia(n) { if (players[n].api) players[n].api.pauseVideo(); }
function muteMedia(n) { if (players[n].api) players[n).api.mute(); }
function unmuteMedia(n) { if (players[n].api) players[n].api.unMute(); }

// --------------------------
// ✅ UNLIMITED PLAYLISTS — SAVED TO USER ACCOUNT
// --------------------------
function setupPlaylistManager() {
    const container = document.getElementById('mainContainer');
    const plDiv = document.createElement('div');
    plDiv.id = 'playlistManager';
    plDiv.innerHTML = `
        <h3>💾 My Playlists <span id="playlistNote" style="color:#66fcf1;"></span></h3>
        <button id="savePlaylistBtn" class="premium-btn">Save Current Layout</button>
        <div id="playlistsList"></div>
    `;
    container.appendChild(plDiv);

    // ✅ PAID USERS = UNLIMITED, FREE = LIMITED
    document.getElementById('savePlaylistBtn').addEventListener('click', () => {
        if (!currentUser) return alert("⚠️ Sign in first to save playlists!");
        
        const name = prompt("Name your playlist:");
        if (!name) return;

        const links = [];
        for (let i=1; i<=10; i++) links.push(document.getElementById(`input${i}`).value);
        
        // ✅ SAVE TO USER'S OWN ACCOUNT DATA
        if (!currentUser.playlists) currentUser.playlists = [];
        currentUser.playlists.push({ name, links });
        
        // ✅ FREE USERS = MAX 3 PLAYLISTS
        if (!currentUser.subscribed && currentUser.playlists.length > 3) {
            currentUser.playlists.pop();
            return alert("⚠️ Free users can save max 3 playlists.\n\nSubscribe for UNLIMITED playlists!");
        }

        // Save to storage + server
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        saveUserPlaylistsToDB();
        updatePlaylistUI();
        alert(`✅ Playlist saved! ${currentUser.subscribed ? 'UNLIMITED saves active' : '3 free saves only'}`);
    });

    updatePlaylistUI();
}

function loadUserPlaylists() {
    if (!currentUser) return;
    playlists = currentUser.playlists || [];
    updatePlaylistUI();
    // ✅ Update note
    const noteEl = document.getElementById('playlistNote');
    if (noteEl) noteEl.textContent = currentUser.subscribed ? "✅ UNLIMITED" : "(Max 3 free)";
}

function updatePlaylistUI() {
    const list = document.getElementById('playlistsList');
    if (!list) return;
    list.innerHTML = '';
    if (!currentUser || !currentUser.playlists) return;

    currentUser.playlists.forEach((pl, idx) => {
        const card = document.createElement('div');
        card.className = 'playlist-card';
        card.innerHTML = `<strong>${pl.name}</strong>`;
        card.addEventListener('click', () => {
            pl.links.forEach((link, i) => { document.getElementById(`input${i+1}`).value = link; });
            alert("✅ Playlist loaded! Click Load on each player.");
        });
        list.appendChild(card);
    });
}

function saveUserPlaylistsToDB() {
    fetch('/save-playlists', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email: currentUser.email, playlists: currentUser.playlists})
    });
}

// --------------------------
// ✅ FAQ — ONLY Q1-Q5
// --------------------------
function buildFAQ() {
    const faqDiv = document.getElementById('faq');
    faqDiv.innerHTML = `<h2
