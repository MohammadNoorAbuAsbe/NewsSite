// Register page functionality
document.addEventListener("DOMContentLoaded", function () {
  // Check if user is already logged in
  if (authManager.isLoggedIn()) {
    window.location.href = "index.html";
    return;
  }

  const registerForm = document.getElementById("registerForm");

  registerForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const agreeToTerms = document.getElementById("agreeToTerms").checked;

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

    if (!agreeToTerms) {
      authManager.showAlert("עליך להסכים לתנאי השימוש", "warning");
      return;
    }

    // Disable form during registration
    const submitBtn = registerForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>נרשם...';
    submitBtn.disabled = true;

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
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });

  // Real-time password confirmation validation
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");

  function validatePasswordMatch() {
    if (
      confirmPasswordInput.value &&
      passwordInput.value !== confirmPasswordInput.value
    ) {
      confirmPasswordInput.setCustomValidity("הסיסמאות אינן תואמות");
      confirmPasswordInput.classList.add("is-invalid");
    } else {
      confirmPasswordInput.setCustomValidity("");
      confirmPasswordInput.classList.remove("is-invalid");
    }
  }

  passwordInput.addEventListener("input", validatePasswordMatch);
  confirmPasswordInput.addEventListener("input", validatePasswordMatch);
});

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
