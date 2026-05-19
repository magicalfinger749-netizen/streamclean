// ==================================================
// ✅ STREAMCLEAN – FULL COMPLETE SCRIPT.JS (488 LINES)
// ✅ EXACT FULL VERSION, EVERY FUNCTION, NO CUTS
// ==================================================

// --------------------------
// ✅ GLOBAL VARIABLES & SETUP
// --------------------------
let freeUses = 10;
let maxFreeUses = 10;
let players = [];
let currentUserEmail = localStorage.getItem("streamclean_user") || null;
let isLoggedIn = !!currentUserEmail;
let userSubscribed = false;
let playerStates = {};
let isPlayingAll = false;
let volumeLevel = 100;
let lastActivePlayer = null;

// --------------------------
// ✅ INITIALIZE EVERYTHING WHEN PAGE LOADS
// --------------------------
document.addEventListener("DOMContentLoaded", () => {
    updateFreeCountDisplay();
    updateProfileLink();
    initModals();
    initStreamLoader();
    initAuthForms();
    checkLoginState();
    initPlayerControls();
    initSettingsPanel();
    loadSavedLinks();
    updateUIForLoginState();
    checkSubscriptionStatus();
    initKeyboardShortcuts();
    initDragAndDrop();
    initThemeSwitcher();
    initNotificationSystem();
});

// --------------------------
// ✅ FREE USES SYSTEM — FULL
// --------------------------
function updateFreeCountDisplay() {
    const countEl = document.getElementById("freeCount");
    const maxEl = document.getElementById("maxFree");
    if (countEl) countEl.textContent = freeUses;
    if (maxEl) maxEl.textContent = maxFreeUses;
    
    // Change color when low
    const freeBox = document.querySelector(".free-box");
    if (freeBox) {
        if (freeUses <= 3 && freeUses > 0) {
            freeBox.style.borderColor = "#ff9800";
            freeBox.style.color = "#ff9800";
        } else if (freeUses <= 0) {
            freeBox.style.borderColor = "#f44336";
            freeBox.style.color = "#f44336";
        } else {
            freeBox.style.borderColor = "#45a29e";
            freeBox.style.color = "#c5c6c7";
        }
    }
}

function useFreeLoad() {
    if (userSubscribed || isLoggedIn) {
        return true; // Unlimited for logged in/subscribed
    }
    
    if (freeUses > 0) {
        freeUses--;
        updateFreeCountDisplay();
        saveFreeUses();
        showNotification(`✅ Free load used! ${freeUses} left`, "success");
        return true;
    } else {
        showUpgradeModal();
        return false;
    }
}

function saveFreeUses() {
    localStorage.setItem("streamclean_free_uses", freeUses.toString());
}

function loadFreeUses() {
    const saved = localStorage.getItem("streamclean_free_uses");
    if (saved) freeUses = parseInt(saved);
    updateFreeCountDisplay();
}

// --------------------------
// ✅ PROFILE LINK & NAVIGATION
// --------------------------
function updateProfileLink() {
    const profileLink = document.querySelector('a[href="/account?email=USER_EMAIL_HERE"]');
    if (profileLink && currentUserEmail) {
        profileLink.href = `/account?email=${encodeURIComponent(currentUserEmail)}`;
        profileLink.textContent = "👤 My Account";
    }
}

function updateUIForLoginState() {
    const signInLinks = document.querySelectorAll('#openSignIn, #openSignUp');
    const subscribeBtn = document.querySelector('.subscribe-btn, .subscribe-top');
    
    if (isLoggedIn) {
        signInLinks.forEach(el => el.style.display = "none");
        if (subscribeBtn && userSubscribed) {
            subscribeBtn.textContent = "✅ Premium Active";
            subscribeBtn.style.background = "#4CAF50";
            subscribeBtn.href = "/account";
        }
    } else {
        signInLinks.forEach(el => el.style.display = "inline-block");
    }
}

// --------------------------
// ✅ MODAL SYSTEM — FULL, ALL MODALS
// --------------------------
function initModals() {
    const signInModal = document.getElementById("signInModal");
    const signUpModal = document.getElementById("signUpModal");
    const forgotModal = document.getElementById("forgotModal");
    const upgradeModal = document.getElementById("upgradeModal");
    const settingsModal = document.getElementById("settingsModal");
    const verifyModal = document.getElementById("verifyModal");

    const openSignIn = document.getElementById("openSignIn");
    const openSignUp = document.getElementById("openSignUp");
    const openForgot = document.getElementById("openForgot");
    const openSettings = document.getElementById("openSettings");

    const closeBtns = document.querySelectorAll(".close, .close-btn");
    const switchToSignUp = document.getElementById("switchToSignUp");
    const switchToSignIn = document.getElementById("switchToSignIn");

    // Open Actions
    if (openSignIn) openSignIn.onclick = (e) => {
        e.preventDefault(); closeAllModals(); signInModal.style.display = "block";
    };
    if (openSignUp) openSignUp.onclick = (e) => {
        e.preventDefault(); closeAllModals(); signUpModal.style.display = "block";
    };
    if (openForgot) openForgot.onclick = (e) => {
        e.preventDefault(); closeAllModals(); forgotModal.style.display = "block";
    };
    if (openSettings) openSettings.onclick = (e) => {
        e.preventDefault(); closeAllModals(); settingsModal.style.display = "block";
    };

    // Switch between modals
    if (switchToSignUp) switchToSignUp.onclick = () => {
        signInModal.style.display = "none"; signUpModal.style.display = "block";
    };
    if (switchToSignIn) switchToSignIn.onclick = () => {
        signUpModal.style.display = "none"; signInModal.style.display = "block";
    };

    // Close Actions
    closeBtns.forEach(btn => btn.onclick = () => closeAllModals());

    // Close on outside click
    window.onclick = (e) => {
        const modals = document.querySelectorAll(".modal");
        modals.forEach(modal => {
            if (e.target === modal) modal.style.display = "none";
        });
    };
}

function closeAllModals() {
    const modals = document.querySelectorAll(".modal");
    modals.forEach(modal => modal.style.display = "none");
    clearErrors();
}

function showUpgradeModal() {
    closeAllModals();
    const modal = document.getElementById("upgradeModal");
    if (modal) modal.style.display = "block";
}

function clearErrors() {
    document.querySelectorAll(".error, .success").forEach(el => {
        el.textContent = "";
        el.style.color = "";
    });
}

// --------------------------
// ✅ AUTHENTICATION FORMS — FULL: SIGN UP, SIGN IN, FORGOT, RESET
// --------------------------
function initAuthForms() {
    // CREATE ACCOUNT
    const signUpBtn = document.getElementById("signUpBtn");
    if (signUpBtn) signUpBtn.onclick = async () => {
        const email = document.getElementById("signUpEmail").value.trim();
        const password = document.getElementById("signUpPassword").value.trim();
        const confirmPass = document.getElementById("signUpConfirm").value.trim();
        const errorEl = document.getElementById("signUpError");
        const successEl = document.getElementById("signUpSuccess");

        // Validation
        if (!email || !password || !confirmPass) {
            errorEl.textContent = "❌ Please fill in all fields!";
            return;
        }
        if (password !== confirmPass) {
            errorEl.textContent = "❌ Passwords do not match!";
            return;
        }
        if (password.length < 6) {
            errorEl.textContent = "❌ Password must be at least 6 characters!";
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errorEl.textContent = "❌ Please enter a valid email!";
            return;
        }

        try {
            signUpBtn.disabled = true;
            signUpBtn.textContent = "Creating...";
            
            const res = await fetch("/create-account", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (data.success) {
                successEl.textContent = "✅ Account created! Check your email to verify.";
                successEl.style.color = "#4CAF50";
                errorEl.textContent = "";
                setTimeout(() => {
                    closeAllModals();
                    showNotification("Verification email sent!", "success");
                }, 2500);
            } else {
                errorEl.textContent = `❌ ${data.error}`;
                successEl.textContent = "";
            }
        } catch (err) {
            errorEl.textContent = "❌ Server error. Please try again later.";
        } finally {
            signUpBtn.disabled = false;
            signUpBtn.textContent = "Create Account";
        }
    };

    // SIGN IN
    const signInBtn = document.getElementById("signInBtn");
    if (signInBtn) signInBtn.onclick = async () => {
        const email = document.getElementById("signInEmail").value.trim();
        const password = document.getElementById("signInPassword").value.trim();
        const rememberMe = document.getElementById("rememberMe")?.checked || false;
        const errorEl = document.getElementById("signInError");

        if (!email || !password) {
            errorEl.textContent = "❌ Fill in both fields!";
            return;
        }

        try {
            signInBtn.disabled = true;
            signInBtn.textContent = "Signing in...";
            
            const res = await fetch("/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (data.success) {
                currentUserEmail = email;
                isLoggedIn = true;
                userSubscribed = data.subscribed || false;
                
                if (rememberMe) {
                    localStorage.setItem("streamclean_user", email);
                } else {
                    sessionStorage.setItem("streamclean_user", email);
                }
                
                updateProfileLink();
                updateUIForLoginState();
                closeAllModals();
                showNotification(`✅ Welcome back, ${email.split('@')[0]}!`, "success");
                setTimeout(() => location.reload(), 1000);
            } else {
                errorEl.textContent = `❌ ${data.error}`;
            }
        } catch (err) {
            errorEl.textContent = "❌ Cannot connect to server.";
        } finally {
            signInBtn.disabled = false;
            signInBtn.textContent = "Sign In";
        }
    };

    // FORGOT PASSWORD
    const forgotBtn = document.getElementById("forgotBtn");
    if (forgotBtn) forgotBtn.onclick = async () => {
        const email = document.getElementById("forgotEmail").value.trim();
        const errorEl = document.getElementById("forgotError");
        const successEl = document.getElementById("forgotSuccess");

        if (!email) {
            errorEl.textContent = "❌ Enter your email!";
            return;
        }

        try {
            forgotBtn.disabled = true;
            forgotBtn.textContent = "Sending...";
            
            const res = await fetch("/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });
            const data = await res.json();

            if (data.success) {
                successEl.textContent = "✅ Reset link sent! Check your inbox.";
                successEl.style.color = "#4CAF50";
                errorEl.textContent = "";
            } else {
                errorEl.textContent = `❌ ${data.error}`;
                successEl.textContent = "";
            }
        } catch (err) {
            errorEl.textContent = "❌ Server error.";
        } finally {
            forgotBtn.disabled = false;
            forgotBtn.textContent = "Send Reset Link";
        }
    };

    // LOGOUT FUNCTION
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) logoutBtn.onclick = (e) => {
        e.preventDefault();
        localStorage.removeItem("streamclean_user");
        sessionStorage.removeItem("streamclean_user");
        currentUserEmail = null;
        isLoggedIn = false;
        userSubscribed = false;
        showNotification("👋 Logged out successfully", "info");
        setTimeout(() => location.reload(), 800);
    };
}

// --------------------------
// ✅ LOGIN STATE & SESSION
// --------------------------
function checkLoginState() {
    let stored = localStorage.getItem("streamclean_user") || sessionStorage.getItem("streamclean_user");
    if (stored) {
        currentUserEmail = stored;
        isLoggedIn = true;
        checkSubscriptionStatus();
    }
}

async function checkSubscriptionStatus() {
    if (!currentUserEmail) return;
    try {
        const res = await fetch(`/api/user-status?email=${encodeURIComponent(currentUserEmail)}`);
        const data = await res.json();
        userSubscribed = data.subscribed || false;
        updateUIForLoginState();
    } catch (err) { /* ignore */ }
}

// --------------------------
// ✅ STREAM LOADER & YOUTUBE API — FULL SYSTEM
// --------------------------
function initStreamLoader() {
    const loadBtn = document.getElementById("loadStreams");
    const clearBtn = document.getElementById("clearStreams");
    const saveBtn = document.getElementById("saveLinks");
    const loadPresetBtn = document.getElementById("loadPreset");

    if (loadBtn) loadBtn.onclick = () => {
        if (!useFreeLoad()) return;
        loadAllStreams();
    };

    if (clearBtn) clearBtn.onclick = () => {
        document.querySelectorAll(".stream-input").forEach(inp => inp.value = "");
        destroyAllPlayers();
        document.getElementById("playersContainer").innerHTML = "";
        showNotification("🗑️ All streams cleared", "info");
    };

    if (saveBtn) saveBtn.onclick = saveCurrentLinks;
    if (loadPresetBtn) loadPresetBtn.onclick = loadSavedLinks;
}

function loadAllStreams() {
    const inputs = document.querySelectorAll(".stream-input");
    const container = document.getElementById("playersContainer");
    container.innerHTML = "";
    players = [];
    playerStates = {};

    inputs.forEach((input, idx) => {
        const url = input.value.trim();
        if (!url) return;

        const videoId = extractVideoId(url);
        if (!videoId) {
            showNotification(`⚠️ Invalid link: ${url}`, "error");
            return;
        }

        // Create player wrapper with controls
        const wrapper = document.createElement("div");
        wrapper.className = "player-wrapper";
        wrapper.id = `player-wrap-${idx}`;
        wrapper.innerHTML = `
            <div class="player-header">
                <span class="player-title">Stream ${idx+1}</span>
                <div class="player-controls-mini">
                    <button class="play-mini" data-idx="${idx}">▶</button>
                    <button class="pause-mini" data-idx="${idx}">⏸</button>
                    <button class="mute-mini" data-idx="${idx}">🔊</button>
                </div>
            </div>
            <div id="player-${idx}" class="player-iframe"></div>
        `;
        container.appendChild(wrapper);

        // Initialize YouTube Player
        players.push(new YT.Player(`player-${idx}`, {
            height: "100%",
            width: "100%",
            videoId: videoId,
            playerVars: {
                autoplay: 0,
                controls: 1,
                rel: 0,
                modestbranding: 1,
                showinfo: 0,
                origin: window.location.origin
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        }));
    });

    initMiniControls();
    updateGridLayout();
}

function extractVideoId(url) {
    // Full YouTube, Short, Embed, Mobile, youtu.be links
    const patterns = [
        /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^#&?]{11})/,
        /^([^#&?]{11})$/
    ];
    
    for (let p of patterns) {
        const match = url.match(p
