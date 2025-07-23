// Authentication Management
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  init() {
    // Check for saved login
    const savedUser = localStorage.getItem("currentUser");
    const savedToken = localStorage.getItem("authToken");

      if (savedUser && savedUser != "undefined") {
      this.currentUser = JSON.parse(savedUser);
      this.updateUI();
    }
  }

  async login(email, password) {
    try {
      const loginData = {
        Email: email,
        Password: password,
      };

      const response = await this.makeAuthRequest(
        "POST",
        USER_ENDPOINTS.LOGIN(),
        loginData
      );
        if (response.email) {
        this.currentUser = response;

        // Save to localStorage
        localStorage.setItem("currentUser", JSON.stringify(this.currentUser));

        this.updateUI();
        this.showAlert("התחברת בהצלחה!", "success");

        // Redirect based on user type
        setTimeout(() => {
          if (this.currentUser.IsAdmin) {
            window.location.href = "admin.html";
          } else {
            window.location.href = "index.html";
          }
        }, 1000);

        return true;
      } else {
        this.showAlert(response.message || "שגיאה בהתחברות", "danger");
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      this.showAlert("שגיאה בהתחברות לשרת", "danger");
      return false;
    }
  }

  async register(userData) {
    try {
      const registerData = {
        Name: userData.firstName + " " + userData.lastName,
        Email: userData.email,
        Password: userData.password,
      };

      const response = await this.makeAuthRequest(
        "POST",
        USER_ENDPOINTS.REGISTER(),
        registerData
      );

      if (response.success) {
        this.showAlert("נרשמת בהצלחה! אנא התחבר", "success");
          setTimeout(() => {
              this.login(registerData.Email, registerData.Password);
        }, 1500);
        return true;
      } else {
        this.showAlert(response.message || "שגיאה ברישום", "danger");
        return false;
      }
    } catch (error) {
      console.error("Registration error:", error);
      this.showAlert("שגיאה ברישום לשרת", "danger");
      return false;
    }
  }

  logout() {
    this.currentUser = null;
    this.token = null;
    localStorage.removeItem("currentUser");
    localStorage.removeItem("authToken");
    this.updateUI();
    this.showAlert("התנתקת בהצלחה", "info");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  }

  updateUI() {
    const userDropdown = document.getElementById("userDropdown");
    const loginBtn = document.getElementById("loginBtn");
    const registerBtn = document.getElementById("registerBtn");
    const adminBtn = document.getElementById("adminBtn");
    const navbarUser = document.getElementById("navbarUser");

    if (this.currentUser) {
      // User is logged in
      if (userDropdown) {
        userDropdown.style.display = "block";
        document.getElementById("username").textContent =
          this.currentUser.FirstName;
      }
      if (loginBtn) loginBtn.style.display = "none";
      if (registerBtn) registerBtn.style.display = "none";

      // Show admin button if user is admin
      if (adminBtn && this.currentUser.IsAdmin) {
        adminBtn.style.display = "block";
      }

      // Update navbar for pages without userDropdown
      if (navbarUser && !userDropdown) {
        navbarUser.innerHTML = `
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                            <i class="fas fa-user"></i> ${
                              this.currentUser.name
                            }
                        </a>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="profile.html">פרופיל</a></li>
                            <li><a class="dropdown-item" href="settings.html">הגדרות</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item" href="#" onclick="authManager.logout()">התנתקות</a></li>
                        </ul>
                    </li>
                    ${
                      this.currentUser.IsAdmin
                        ? '<li class="nav-item"><a class="nav-link" href="admin.html">ניהול</a></li>'
                        : ""
                    }
                `;
      }
    } else {
      // User is not logged in
      if (userDropdown) userDropdown.style.display = "none";
      if (loginBtn) loginBtn.style.display = "block";
      if (registerBtn) registerBtn.style.display = "block";
      if (adminBtn) adminBtn.style.display = "none";

      // Update navbar for pages without login/register buttons
      if (navbarUser && !loginBtn) {
        navbarUser.innerHTML = `
                    <li class="nav-item">
                        <a class="nav-link" href="login.html">התחברות</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="register.html">רישום</a>
                    </li>
                `;
      }
    }
  }

  async makeAuthRequest(method, url, data) {
    const headers = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: method,
        headers: headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Auth request error:", error);
      throw error;
    }
  }

  makeAuthenticatedRequest(method, url, data, successCallback, errorCallback) {
    const headers = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    $.ajax({
      type: method,
      url: url,
      data: data ? JSON.stringify(data) : undefined,
      headers: headers,
      contentType: "application/json",
      dataType: "json",
      success: successCallback,
      error: (xhr, status, error) => {
        if (xhr.status === 401) {
          // Token expired or invalid
          this.logout();
        } else if (errorCallback) {
          errorCallback(xhr, status, error);
        }
      },
    });
  }

  showAlert(message, type = "info") {
    const alertContainer = document.getElementById("alertContainer");
    if (!alertContainer) return;

    const alertId = "alert-" + Date.now();
    const alertHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert" id="${alertId}">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

    alertContainer.innerHTML = alertHTML;

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      const alertElement = document.getElementById(alertId);
      if (alertElement) {
        const bsAlert = new bootstrap.Alert(alertElement);
        bsAlert.close();
      }
    }, 5000);
  }

  isLoggedIn() {
    return this.currentUser !== null && this.token !== null;
  }

  isAdmin() {
    return this.isLoggedIn() && this.currentUser.IsAdmin;
  }

  requireAuth() {
    if (!this.isLoggedIn()) {
      this.showAlert("נדרש להתחבר כדי לגשת לדף זה", "warning");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
      return false;
    }
    return true;
  }

  requireAdmin() {
    if (!this.isAdmin()) {
      this.showAlert("נדרשות הרשאות מנהל לגישה לדף זה", "danger");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 2000);
      return false;
    }
    return true;
  }
}

// Global auth manager instance
const authManager = new AuthManager();

// Global logout function
function logout() {
  authManager.logout();
}

// Initialize auth UI when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  authManager.updateUI();
});
