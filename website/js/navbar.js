$(document).ready(function () {
        $(document.body).prepend(`
        <header>
            <nav id="navbar" class="guest">
                <h3 id="userWelcome">Welcome</h3>
                <a href="index.html"><span>🏠</span> Home</a>
                <a href="MyMovies.html" id="myMovies"><span>🎬</span> My Movies</a>
                <a href="addMovie.html" id="addMovie"><span>➕</span> Add Movies</a>
                <a href="editMyProfile.html" id="editMyProfile"><span>🔑</span> Edit My Profile</a>
                <a href="login.html" id="loginLink"><span>🔑</span> Login</a>
                <a href="adminPage.html" id="adminLink"><span>🔑</span> Admin Controls</a>
                <button id="logoutBtn"><span>🚪</span> Logout</button>
            </nav>
        </header>
    `);
    redirectToLogin();
    handleLoggedInWelocme();
    handleLogoutBtn();
});

function redirectToLogin() {
    const links = [$('#myMovies'), $('#addMovie')];
    const user = GetLoggedInUser();
    if (!user) {
        links.forEach(link => {
            link.click(function (event) {
                event.preventDefault();
                window.location.href = 'login.html';
            });
        });
    }
}

function handleLoggedInWelocme() {
    const user = GetLoggedInUser();
    const navbar = $('#navbar');
    const userWelcome = $('#userWelcome');
    if (user) {
        navbar.removeClass('guest');
        userWelcome.text(`Welcome ${user.name}!`);
    }
}

function handleLogoutBtn() {
    const logoutBtn = $('#logoutBtn');
    const user = GetLoggedInUser();
    if (user) {
        logoutBtn.show();
        logoutBtn.click(() => {
            localStorage.removeItem("user");
            window.location.replace("index.html");
        });
    } else {
        logoutBtn.hide();
    }

}