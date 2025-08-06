// Authentication Management with JWT Support
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.init();
  }

  init() {
    // Check for saved login
    const savedUser = localStorage.getItem("currentUser");
    const savedAccessToken = localStorage.getItem("jwtToken");
    const savedRefreshToken = localStorage.getItem("refreshToken");

    if (savedUser && savedUser != "undefined") {
      const userData = JSON.parse(savedUser);
      // Normalize property names in case of old data format
      this.currentUser = {
        Id: userData.Id || userData.id,
        Name: userData.Name || userData.name,
        Email: userData.Email || userData.email,
        IsAdmin: userData.IsAdmin || userData.isAdmin || false,
      };
      this.updateUI();
    }

    if (savedAccessToken && savedAccessToken != "undefined") {
      this.accessToken = savedAccessToken;
    }

    if (savedRefreshToken && savedRefreshToken != "undefined") {
      this.refreshToken = savedRefreshToken;
    }

    // Validate token on page load
    if (this.accessToken && this.currentUser) {
      this.validateToken();
    }
  }

  async validateToken() {
    try {
      const response = await fetch(USER_ENDPOINTS.VALIDATE(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Token validation failed");
      }

      const userData = await response.json();
      // Update user data from server
      this.currentUser = {
        Id: userData.id,
        Name: userData.name,
        Email: userData.email,
        IsAdmin: userData.isAdmin,
      };
      localStorage.setItem("currentUser", JSON.stringify(this.currentUser));
    } catch (error) {
      this.logout();
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

      // Check if the response contains the new JWT format
      if (response.user && response.accessToken) {
        // New JWT response format
        this.currentUser = {
          Id: response.user.id,
          Name: response.user.name,
          Email: response.user.email,
          IsAdmin: response.user.isAdmin,
        };

        this.accessToken = response.accessToken;
        this.refreshToken = response.refreshToken;

        // Save to localStorage with new token format
        localStorage.setItem("currentUser", JSON.stringify(this.currentUser));
        localStorage.setItem("jwtToken", this.accessToken);
        localStorage.setItem("refreshToken", this.refreshToken);

        // Remove old token format if it exists
        localStorage.removeItem("authToken");
      } else if (response.email) {
        // Old response format (fallback)
        this.currentUser = {
          Id: response.id,
          Name: response.name,
          Email: response.email,
          IsAdmin: response.isAdmin,
        };

        // Save to localStorage
        localStorage.setItem("currentUser", JSON.stringify(this.currentUser));
      } else {
        this.showAlert(response.message || "שגיאה בהתחברות", "danger");
        return false;
      }

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

  async logout() {
    try {
      // Call the logout endpoint to invalidate the token on the server
      if (this.accessToken) {
        await fetch(USER_ENDPOINTS.LOGOUT(), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        });
      }
    } catch (error) {
      Utils.debug.log(
        "Logout API call failed, but proceeding with local logout"
      );
    }

    // Clear all authentication data
    this.currentUser = null;
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem("currentUser");
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("authToken"); // Remove old token format

    this.updateUI();
    this.showAlert("התנתקת בהצלחה", "info");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  }

  updateUI() {
    const $userDropdown = $("#userDropdown");
    const $loginBtn = $("#loginBtn");
    const $registerBtn = $("#registerBtn");
    const $adminBtn = $("#adminBtn");
    const $navbarUser = $("#navbarUser");

    if (this.currentUser) {
      // User is logged in
      if ($userDropdown.length) {
        $userDropdown.show();
        $("#username").text(this.currentUser.Name);
      }
      if ($loginBtn.length) $loginBtn.hide();
      if ($registerBtn.length) $registerBtn.hide();

      // Show admin button if user is admin
      if ($adminBtn.length && this.currentUser.IsAdmin) {
        $adminBtn.show();
      }

      // Update navbar for pages without userDropdown
      if ($navbarUser.length && !$userDropdown.length) {
        $navbarUser.html(`
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                            <i class="fas fa-user"></i> ${this.currentUser.Name}
                        </a>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="profile.html">פרופיל</a></li>
                            <li><a class="dropdown-item" href="saved-articles.html">מאמרים שמורים</a></li>
                            ${
                              this.currentUser.IsAdmin
                                ? '<li><a class="dropdown-item" href="admin.html">ניהול</a></li>'
                                : ""
                            }
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item" href="#" onclick="authManager.logout()">התנתק</a></li>
                        </ul>
                    </li>
                `);
      }
    } else {
      // User is not logged in
      if ($userDropdown.length) $userDropdown.hide();
      if ($loginBtn.length) $loginBtn.show();
      if ($registerBtn.length) $registerBtn.show();
      if ($adminBtn.length) $adminBtn.hide();

      // Update navbar for pages without login buttons
      if ($navbarUser.length && !$loginBtn.length) {
        $navbarUser.html(`
                    <li class="nav-item">
                        <a class="nav-link" href="login.html">התחבר</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="register.html">הירשם</a>
                    </li>
                `);
      }
    }
  }

  async makeAuthRequest(method, url, data) {
    const headers = {
      "Content-Type": "application/json",
    };

    // Add authorization header if token exists
    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    const options = {
      method: method,
      headers: headers,
    };

    if (data && (method === "POST" || method === "PUT")) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);

      // Handle 401 Unauthorized
      if (response.status === 401 && this.accessToken) {
        this.logout();
        return null;
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Auth request error:", error);
      throw error;
    }
  }

  makeAuthenticatedRequest(method, url, data, successCallback, errorCallback) {
    const headers = {
      "Content-Type": "application/json",
    };

    // Add authorization header if token exists
    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    $.ajax({
      type: method,
      url: url,
      data: JSON.stringify(data),
      headers: headers,
      cache: false,
      contentType: "application/json",
      dataType: "json",
      success: successCallback,
      error: (xhr, status, error) => {
        // Handle 401 Unauthorized
        if (xhr.status === 401) {
          this.logout();
          return;
        }

        if (errorCallback) {
          errorCallback(xhr, status, error);
        }
      },
    });
  }

  showAlert(message, type = "info") {
    // Use toast notifications instead of alerts
    if (typeof Utils !== "undefined" && Utils.toast) {
      switch (type) {
        case "success":
          Utils.toast.success(message);
          break;
        case "danger":
        case "error":
          Utils.toast.error(message);
          break;
        case "warning":
          Utils.toast.warning(message);
          break;
        default:
          Utils.toast.info(message);
          break;
      }
    } else {
      // Fallback to browser alert if toast is not available
      alert(message);
    }
  }

  isLoggedIn() {
    return this.currentUser !== null && this.accessToken !== null;
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

  getCurrentUser() {
    return this.currentUser;
  }

  getAuthToken() {
    return this.accessToken;
  }
}

// Global auth manager instance - both names for compatibility
const authManager = new AuthManager();
const AuthJWT = authManager; // Export as AuthJWT for the new system

// Initialize auth UI when DOM is loaded
$(document).ready(function () {
  authManager.updateUI();
});
