$(document).ready(function () {
  // Create navbar structure using jQuery
  const $nav = $("<nav>", {
    class: "navbar navbar-expand-lg navbar-dark bg-primary",
  });

  const $container = $("<div>", { class: "container" });

  // Brand
  const $brand = $("<a>", {
    class: "navbar-brand",
    href: "index.html",
  }).append($("<i>", { class: "fas fa-newspaper me-2" }), "NewsHub");

  // Toggler button
  const $toggler = $("<button>", {
    class: "navbar-toggler",
    type: "button",
    "data-bs-toggle": "collapse",
    "data-bs-target": "#navbarNav",
  }).append($("<span>", { class: "navbar-toggler-icon" }));

  // Navbar collapse
  const $collapse = $("<div>", {
    class: "collapse navbar-collapse",
    id: "navbarNav",
  });

  // Main navigation links
  const mainNavItems = [
    { page: "index.html", text: "בית" },
    { page: "news.html", text: "חדשות" },
    { page: "saved-articles.html", text: "כתבות שמורות" },
    { page: "shared-content.html", text: "תוכן משותף" },
    { page: "advanced-features.html", text: "תכונות מתקדמות" },
  ];

  const $mainNav = $("<ul>", {
    class: "navbar-nav me-auto",
    id: "mainNavLinks",
  });

  mainNavItems.forEach((item) => {
    const $li = $("<li>", { class: "nav-item" });
    const $a = $("<a>", {
      class: "nav-link",
      "data-page": item.page,
      href: item.page,
      text: item.text,
    });
    $li.append($a);
    $mainNav.append($li);
  });

  // User navigation
  const $userNav = $("<ul>", { class: "navbar-nav", id: "navbarUser" });

  // Dark mode toggle button
  const $darkModeToggle = $("<li>", { class: "nav-item" }).append(
    $("<button>", {
      class: "nav-link btn btn-link",
      id: "darkModeToggle",
      title: "החלף מצב תצוגה",
      type: "button",
    }).append($("<i>", { class: "fas fa-moon", id: "darkModeIcon" }))
  );

  // User dropdown
  const $userDropdown = $("<li>", {
    class: "nav-item dropdown",
    id: "userDropdown",
    style: "display: none",
  });

  const $userDropdownToggle = $("<a>", {
    class: "nav-link dropdown-toggle",
    href: "#",
    role: "button",
    "data-bs-toggle": "dropdown",
  }).append(
    $("<i>", { class: "fas fa-user" }),
    " ",
    $("<span>", { id: "username" })
  );

  const $dropdownMenu = $("<ul>", { class: "dropdown-menu" });
  $dropdownMenu.append(
    $("<li>").append(
      $("<a>", {
        class: "dropdown-item",
        href: "user-settings.html",
        text: "הגדרות",
      })
    ),
    $("<li>").append($("<hr>", { class: "dropdown-divider" })),
    $("<li>").append(
      $("<a>", {
        class: "dropdown-item",
        href: "#",
        text: "התנתקות",
      }).on("click", function (e) {
        e.preventDefault();
        if (typeof AuthJWT !== "undefined") {
          AuthJWT.logout();
        }
      })
    )
  );

  $userDropdown.append($userDropdownToggle, $dropdownMenu);

  // Login/Register/Admin buttons
  const $loginBtn = $("<li>", { class: "nav-item", id: "loginBtn" }).append(
    $("<a>", { class: "nav-link", href: "login.html", text: "התחברות" })
  );

  const $registerBtn = $("<li>", {
    class: "nav-item",
    id: "registerBtn",
  }).append(
    $("<a>", { class: "nav-link", href: "register.html", text: "רישום" })
  );

  const $adminBtn = $("<li>", {
    class: "nav-item",
    id: "adminBtn",
    style: "display: none",
  }).append($("<a>", { class: "nav-link", href: "admin.html", text: "ניהול" }));

  // Assemble user navigation
  $userNav.append(
    $darkModeToggle,
    $userDropdown,
    $loginBtn,
    $registerBtn,
    $adminBtn
  );

  // Assemble navbar
  $collapse.append($mainNav, $userNav);
  $container.append($brand, $toggler, $collapse);
  $nav.append($container);

  // Prepend to body
  $("body").prepend($nav);

  //highlight nav link
  const currentPage = window.location.pathname.split("/").pop().split("?")[0];
  $("#mainNavLinks a.nav-link").each(function () {
    const page = $(this).data("page");
    if (page === currentPage || (currentPage === "" && page === "index.html")) {
      $(this).addClass("active");
    } else {
      $(this).removeClass("active");
    }
  });

  //Update UI
  if (typeof AuthJWT !== "undefined") {
    AuthJWT.updateUI();
  } else {
    console.error(
      "AuthJWT is not defined. Make sure auth-jwt.js is loaded before navbar.js"
    );
  }
});
