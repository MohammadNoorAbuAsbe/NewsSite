// Login page functionality
$(document).ready(function () {
  // Check if user is already logged in
  if (authManager.isLoggedIn()) {
    if (authManager.isAdmin()) {
      window.location.href = "admin.html";
    } else {
      window.location.href = "index.html";
    }
    return;
  }

  const $loginForm = $("#loginForm");

  $loginForm.on("submit", async function (e) {
    e.preventDefault();

    const email = $("#email").val().trim();
    const password = $("#password").val();

    // Validation
    if (!email || !password) {
      Utils.toast.warning("אנא מלא את כל השדות");
      return;
    }

    // Disable form during login
    const $submitBtn = $loginForm.find('button[type="submit"]');
    const originalText = $submitBtn.html();
    $submitBtn.html('<i class="fas fa-spinner fa-spin me-2"></i>מתחבר...');
    $submitBtn.prop("disabled", true);

    try {
      const success = await authManager.login(email, password);
    } catch (error) {
      console.error("Login error:", error);
      Utils.toast.error("שגיאה בהתחברות");
    } finally {
      // Re-enable form
      $submitBtn.html(originalText);
      $submitBtn.prop("disabled", false);
    }
  });

  // Auto-fill admin credentials on admin login hint click
  $(".admin-login").on("click", function () {
    $("#email").val("admin@newshub.com");
    $("#password").val("admin");
  });
});
