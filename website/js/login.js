// Login page functionality
document.addEventListener("DOMContentLoaded", function () {
  // Check if user is already logged in
  if (authManager.isLoggedIn()) {
    if (authManager.isAdmin()) {
      window.location.href = "admin.html";
    } else {
      window.location.href = "index.html";
    }
    return;
  }

  const loginForm = document.getElementById("loginForm");

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const rememberMe = document.getElementById("rememberMe").checked;

    // Validation
    if (!email || !password) {
      authManager.showAlert("אנא מלא את כל השדות", "warning");
      return;
    }

    if (!isValidEmail(email)) {
      authManager.showAlert("אנא הזן כתובת אימייל תקינה", "warning");
      return;
    }

    // Disable form during login
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>מתחבר...';
    submitBtn.disabled = true;

    try {
      const success = await authManager.login(email, password);

      if (success && rememberMe) {
        localStorage.setItem("rememberLogin", "true");
      }
    } catch (error) {
      console.error("Login error:", error);
      authManager.showAlert("שגיאה בהתחברות", "danger");
    } finally {
      // Re-enable form
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });

  // Auto-fill admin credentials on admin login hint click
  document.querySelector(".admin-login").addEventListener("click", function () {
    document.getElementById("email").value = "admin@newshub.com";
    document.getElementById("password").value = "admin";
  });
});

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
