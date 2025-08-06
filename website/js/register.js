// Register page functionality
$(document).ready(function () {
  // Check if user is already logged in
  if (authManager.isLoggedIn()) {
    window.location.href = "index.html";
    return;
  }

  const $registerForm = $("#registerForm");

  $registerForm.on("submit", async function (e) {
    e.preventDefault();

    const firstName = $("#firstName").val().trim();
    const lastName = $("#lastName").val().trim();
    const email = $("#email").val().trim();
    const password = $("#password").val();
    const confirmPassword = $("#confirmPassword").val();

    // Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      authManager.showAlert("אנא מלא את כל השדות הנדרשים", "warning");
      return;
    }

    if (!isValidEmail(email)) {
      authManager.showAlert("אנא הזן כתובת אימייל תקינה", "warning");
      return;
    }

    if (password.length < 6) {
      authManager.showAlert("הסיסמה חייבת להכיל לפחות 6 תווים", "warning");
      return;
    }

    if (password !== confirmPassword) {
      authManager.showAlert("הסיסמאות אינן תואמות", "warning");
      return;
    }

    // Disable form during registration
    const $submitBtn = $registerForm.find('button[type="submit"]');
    const originalText = $submitBtn.html();
    $submitBtn.html('<i class="fas fa-spinner fa-spin me-2"></i>נרשם...');
    $submitBtn.prop("disabled", true);

    try {
      const userData = {
        firstName,
        lastName,
        email,
        password,
      };

      await authManager.register(userData);
    } catch (error) {
      console.error("Registration error:", error);
      authManager.showAlert("שגיאה ברישום", "danger");
    } finally {
      // Re-enable form
      $submitBtn.html(originalText);
      $submitBtn.prop("disabled", false);
    }
  });

  // Real-time password confirmation validation
  const $passwordInput = $("#password");
  const $confirmPasswordInput = $("#confirmPassword");

  function validatePasswordMatch() {
    if (
      $confirmPasswordInput.val() &&
      $passwordInput.val() !== $confirmPasswordInput.val()
    ) {
      $confirmPasswordInput[0].setCustomValidity("הסיסמאות אינן תואמות");
      $confirmPasswordInput.addClass("is-invalid");
    } else {
      $confirmPasswordInput[0].setCustomValidity("");
      $confirmPasswordInput.removeClass("is-invalid");
    }
  }

  $passwordInput.on("input", validatePasswordMatch);
  $confirmPasswordInput.on("input", validatePasswordMatch);
});

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
