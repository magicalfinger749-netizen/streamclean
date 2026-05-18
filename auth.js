// === USER AUTHENTICATION SYSTEM ===
// Save users to browser storage (works instantly; will connect to database later)
function saveUser(user) {
    const users = JSON.parse(localStorage.getItem('streamclean_users')) || [];
    localStorage.setItem('streamclean_users', JSON.stringify([...users, user]));
}

function findUser(email, password) {
    const users = JSON.parse(localStorage.getItem('streamclean_users')) || [];
    return users.find(u => u.email === email && u.password === password);
}

// === SIGN UP LOGIC ===
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const signUpModal = document.getElementById('signUpModal');
        const signUpBtn = signUpModal.querySelector('.glow-btn');
        
        signUpBtn.addEventListener('click', () => {
            const name = signUpModal.querySelectorAll('input')[0].value.trim();
            const email = signUpModal.querySelectorAll('input')[1].value.trim();
            const password = signUpModal.querySelectorAll('input')[2].value.trim();

            if (!name || !email || !password) return alert('Please fill in all fields!');
            
            // Check if email already exists
            const existing = JSON.parse(localStorage.getItem('streamclean_users')) || [];
            if (existing.some(u => u.email === email)) return alert('Email already registered!');

            // Save new user
            const newUser = { name, email, password, subscribed: false, joinDate: new Date().toLocaleDateString() };
            saveUser(newUser);
            alert('✅ Account created successfully! You can now Sign In.');
            signUpModal.classList.add('hidden');
        });

        // === SIGN IN LOGIC ===
        const signInModal = document.getElementById('signInModal');
        const signInBtn = signInModal.querySelector('.glow-btn');

        signInBtn.addEventListener('click', () => {
            const email = signInModal.querySelectorAll('input')[0].value.trim();
            const password = signInModal.querySelectorAll('input')[1].value.trim();

            const user = findUser(email, password);
            if (!user) return alert('❌ Invalid email or password!');

            // Save logged-in user
            localStorage.setItem('streamclean_currentUser', JSON.stringify(user));
            alert(`✅ Welcome back, ${user.name}!`);
            signInModal.classList.add('hidden');
            updateUIforLoggedInUser(); // Change buttons to Logout/Profile
        });

        // === LOGOUT FUNCTION ===
        window.logoutUser = function() {
            localStorage.removeItem('streamclean_currentUser');
            location.reload();
        };

        // === UPDATE UI WHEN LOGGED IN ===
        function updateUIforLoggedInUser() {
            const currentUser = JSON.parse(localStorage.getItem('streamclean_currentUser'));
            if (!currentUser) return;

            // Replace Sign In/Up buttons with Profile & Logout
            const navButtons = document.querySelector('nav div.hidden.md\\:flex');
            navButtons.innerHTML = `
                <a href="index.html" class="glow-text font-semibold hover:scale-105 transition">🏠 Home</a>
                <a href="streams.html" class="hover:text-accent transition-colors">📺 Streams</a>
                <a href="profile.html" class="hover:text-accent transition-colors">👤 My Profile</a>
                <button onclick="logoutUser()" class="px-5 py-2 border border-red-400 text-red-400 rounded-lg hover:bg-red-500/20 transition-all">Logout</button>
            `;
        }

        // Run check on page load
        updateUIforLoggedInUser();
    }, 100);
});
