// === USER AUTHENTICATION SYSTEM ===
document.addEventListener('DOMContentLoaded', () => {
    initAuthForms();
    createAdminAccount();
    updateUIforLoggedInUser();
});

// === AUTO CREATE YOUR ADMIN ACCOUNT — UNLIMITED FOREVER ===
function createAdminAccount() {
    const adminEmail = "magicalfinger749@gmail.com";
    const adminPass = "Kinghashim2";

    let allUsers = JSON.parse(localStorage.getItem('streamclean_users')) || [];
    if (!allUsers.some(u => u.email === adminEmail)) {
        allUsers.push({
            name: "Admin",
            email: adminEmail,
            password: adminPass,
            subscribed: true,
            isAdmin: true,
            joinDate: new Date().toLocaleDateString()
        });
        localStorage.setItem('streamclean_users', JSON.stringify(allUsers));
    }
}

// === SIGN UP / SIGN IN LOGIC ===
function initAuthForms() {
    // SIGN UP
    document.getElementById('doSignUp').addEventListener('click', () => {
        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const pass = document.getElementById('signupPass').value.trim();

        if (!name || !email || !pass) return alert('Fill all fields');

        let allUsers = JSON.parse(localStorage.getItem('streamclean_users')) || [];
        if (allUsers.some(u => u.email === email)) return alert('Email already registered');

        // CREATE NEW USER (FREE PLAN)
        allUsers.push({
            name: name,
            email: email,
            password: pass,
            subscribed: false,
            isAdmin: false,
            joinDate: new Date().toLocaleDateString()
        });
        localStorage.setItem('streamclean_users', JSON.stringify(allUsers));
        localStorage.setItem('streamclean_currentUser', JSON.stringify({ name, email, subscribed: false, isAdmin: false }));
        
        alert('✅ Account created! You have 2 free views to start.');
        location.reload();
    });

    // SIGN IN
    document.getElementById('doSignIn').addEventListener('click', () => {
        const email = document.getElementById('signinEmail').value.trim();
        const pass = document.getElementById('signinPass').value.trim();

        let allUsers = JSON.parse(localStorage.getItem('streamclean_users')) || [];
        const user = allUsers.find(u => u.email === email && u.password === pass);

        if (!user) return alert('❌ Wrong email or password');

        localStorage.setItem('streamclean_currentUser', JSON.stringify(user));
        alert('✅ Welcome back!');
        location.reload();
    });
}

// === UPDATE NAVIGATION — ADMIN LINK ONLY FOR YOU ===
function updateUIforLoggedInUser() {
    const currentUser = JSON.parse(localStorage.getItem('streamclean_currentUser'));
    if (!currentUser) return;

    // ✅ ONLY YOU SEE THE RED ADMIN LINK
    const adminLink = currentUser.isAdmin 
        ? `<a href="admin.html" class="text-red-400 font-bold hover:scale-105 transition">⚙️ ADMIN PANEL</a>` 
        : '';

    // ✅ CHANGE STATUS TEXT BASED ON PLAN
    let statusText;
    if (currentUser.isAdmin) {
        statusText = `<span class="text-red-400 font-bold">ADMIN • UNLIMITED</span>`;
    } else if (currentUser.subscribed) {
        statusText = `<span class="text-green-400 font-bold">SUBSCRIBED • UNLIMITED</span>`;
    } else {
        statusText = `<span class="text-yellow-400">FREE USES: <span id="freeCount">${parseInt(localStorage.getItem('streamclean_free_views')) || 2}</span> LEFT</span>`;
    }

    const navButtons = document.querySelector('nav div.md\\:flex');
    navButtons.innerHTML = `
        <a href="index.html" class="glow-text font-semibold hover:scale-105 transition">🏠 Home</a>
        <a href="streams.html" class="hover:text-accent transition-colors">📺 Streams</a>
        <a href="profile.html" class="hover:text-accent transition-colors">👤 My Profile</a>
        ${adminLink}
        ${statusText}
        <button onclick="logoutUser()" class="px-5 py-2 border border-red-400 text-red-400 rounded-lg hover:bg-red-500/20 transition-all">Logout</button>
    `;
}

// === LOGOUT ===
function logoutUser() {
    localStorage.removeItem('streamclean_currentUser');
    location.reload();
}

// === UPDATE SUBSCRIPTION AFTER PAYMENT ===
window.updateSubscription = function(email) {
    const allUsers = JSON.parse(localStorage.getItem('streamclean_users')) || [];
    const updatedUsers = allUsers.map(u => {
        if (u.email === email) {
            u.subscribed = true;
            alert('✅ Payment confirmed! Unlimited access unlocked — active while subscription stays renewed.');
        }
        return u;
    });
    localStorage.setItem('streamclean_users', JSON.stringify(updatedUsers));
    const current = JSON.parse(localStorage.getItem('streamclean_currentUser'));
    if (current && current.email === email) {
        current.subscribed = true;
        localStorage.setItem('streamclean_currentUser', JSON.stringify(current));
    }
    location.reload();
};
