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
      Utils.toast.warning("אנא מלא את כל השדות הנדרשים");
      return;
    }

    if (!isValidEmail(email)) {
      Utils.toast.warning("אנא הזן כתובת אימייל תקינה");
      return;
    }

    if (password.length < 6) {
      Utils.toast.warning("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }

    if (password !== confirmPassword) {
      Utils.toast.warning("הסיסמאות אינן תואמות");
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
      Utils.toast.error("שגיאה ברישום");
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
