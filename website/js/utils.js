// Shared Utility Functions for NewsSite
const Utils = {
  // Dark Mode Management
  darkMode: {
    init: function () {
      // Check for saved theme preference or detect system preference
      let savedTheme = localStorage.getItem("theme");

      // If no saved theme, detect system preference
      if (!savedTheme) {
        if (
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches
        ) {
          savedTheme = "dark";
        } else {
          savedTheme = "light";
        }
        // Save the detected preference
        localStorage.setItem("theme", savedTheme);
      }

      this.setTheme(savedTheme);
      this.setupToggleButton();
    },

    setTheme: function (theme) {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
      this.updateToggleButton(theme);

      // Trigger theme change event for other components
      $(document).trigger("themeChanged", theme);
    },

    toggle: function () {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      this.setTheme(newTheme);
    },

    setupToggleButton: function () {
      // Set up click handler for toggle button when it's created by navbar
      $(document).on("click", "#darkModeToggle", () => {
        this.toggle();
      });

      // Initial button update
      const currentTheme =
        document.documentElement.getAttribute("data-theme") || "light";
      this.updateToggleButton(currentTheme);
    },

    updateToggleButton: function (theme) {
      const icon = $("#darkModeIcon");
      if (icon.length) {
        icon.removeClass("fa-moon fa-sun");
        icon.addClass(theme === "dark" ? "fa-sun" : "fa-moon");

        // Update tooltip
        const button = $("#darkModeToggle");
        button.attr("title", theme === "dark" ? "מצב בהיר" : "מצב כהה");
      }
    },
  },

  // Recently Viewed Articles
  recentlyViewed: {
    maxItems: 10,
    storageKey: "recentlyViewedArticles",

    addArticle: function (article) {
      let recent = this.getArticles();

      // Remove if already exists (to move to top)
      recent = recent.filter((item) => item.url !== article.url);

      // Add to beginning
      recent.unshift({
        title: article.title,
        url: article.url,
        urlToImage: article.urlToImage,
        publishedAt: article.publishedAt,
        source: article.source,
        viewedAt: new Date().toISOString(),
      });

      // Keep only max items
      recent = recent.slice(0, this.maxItems);

      localStorage.setItem(this.storageKey, JSON.stringify(recent));
      this.updateRecentlyViewedDisplay();
    },

    getArticles: function () {
      try {
        return JSON.parse(localStorage.getItem(this.storageKey)) || [];
      } catch (e) {
        return [];
      }
    },

    clearArticles: function () {
      localStorage.removeItem(this.storageKey);
      this.updateRecentlyViewedDisplay();
    },

    updateRecentlyViewedDisplay: function () {
      const container = $("#recentlyViewedContainer");
      if (!container.length) return;

      const articles = this.getArticles();
      if (articles.length === 0) {
        container.html(
          '<p class="text-muted text-center">אין כתבות שנצפו לאחרונה</p>'
        );
        return;
      }

      const articlesHtml = articles
        .map(
          (article) => `
        <div class="recently-viewed-item d-flex align-items-center mb-2 p-2 border rounded">
          ${
            article.urlToImage
              ? `<img src="${article.urlToImage}" class="recently-viewed-thumb me-2" style="width: 60px; height: 40px; object-fit: cover; border-radius: 4px;">`
              : ""
          }
          <div class="flex-grow-1">
            <h6 class="mb-1 recently-viewed-title">${article.title}</h6>
            <small class="text-muted">${Utils.formatDate(
              article.viewedAt
            )}</small>
          </div>
          <button class="btn btn-sm btn-outline-primary" onclick="window.open('${
            article.url
          }', '_blank')">
            <i class="fas fa-external-link-alt"></i>
          </button>
        </div>
      `
        )
        .join("");

      container.html(articlesHtml);
    },
  },

  // Enhanced Toast Notification System
  toast: {
    show: function (message, type = "info", duration = 4000, options = {}) {
      const toastId = "toast-" + Date.now();
      const iconMap = {
        success: "fa-check-circle",
        error: "fa-exclamation-circle",
        warning: "fa-exclamation-triangle",
        info: "fa-info-circle",
      };

      const toast = $(`
        <div class="toast align-items-center text-white bg-${
          type === "error" ? "danger" : type
        } border-0" 
             role="alert" id="${toastId}" style="position: relative;">
          <div class="d-flex">
            <div class="toast-body d-flex align-items-center">
              <i class="fas ${iconMap[type] || iconMap.info} me-2"></i>
              ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                    data-bs-dismiss="toast"></button>
          </div>
        </div>
      `);

      // Create toast container if it doesn't exist
      let toastContainer = $("#toastContainer");
      if (!toastContainer.length) {
        toastContainer = $(`
          <div id="toastContainer" class="toast-container position-fixed top-0 end-0 p-3" 
               style="z-index: 1055;"></div>
        `);
        $("body").append(toastContainer);
      }

      toastContainer.append(toast);

      // Initialize Bootstrap toast
      const bsToast = new bootstrap.Toast(toast[0], {
        delay: duration,
        autohide: true,
      });

      bsToast.show();

      // Auto remove from DOM after hiding
      toast[0].addEventListener("hidden.bs.toast", () => {
        toast.remove();
      });

      return toastId;
    },

    success: function (message, duration = 4000) {
      return this.show(message, "success", duration);
    },

    error: function (message, duration = 6000) {
      return this.show(message, "error", duration);
    },

    warning: function (message, duration = 5000) {
      return this.show(message, "warning", duration);
    },

    info: function (message, duration = 4000) {
      return this.show(message, "info", duration);
    },
  },

  /**
   * Formats a date string with various format options
   * @param {string} dateString - The date string to format
   * @param {string} format - Format type: 'relative', 'absolute', 'short'
   * @returns {string} Formatted date string
   */
  formatDate: function (dateString, format = "relative") {
    if (!dateString) return "תאריך לא זמין";

    try {
      const date = new Date(dateString);
      const now = new Date();

      switch (format) {
        case "relative":
          const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

          if (diffInHours < 1) {
            return "לפני פחות משעה";
          } else if (diffInHours < 24) {
            return `לפני ${diffInHours} שעות`;
          } else if (diffInHours < 48) {
            return "אתמול";
          } else {
            const diffInDays = Math.floor(diffInHours / 24);
            return `לפני ${diffInDays} ימים`;
          }

        case "absolute":
          return date.toLocaleDateString("he-IL", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

        case "short":
          return date.toLocaleDateString("he-IL", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

        case "chat":
          const diffInMinutes = Math.floor((now - date) / (1000 * 60));
          if (diffInMinutes < 1) return "עכשיו";
          if (diffInMinutes < 60) return `לפני ${diffInMinutes}ד`;
          if (diffInHours < 24) return `לפני ${diffInHours}ש`;
          return date.toLocaleDateString("he-IL", {
            month: "short",
            day: "numeric",
          });

        default:
          return date.toLocaleDateString("he-IL");
      }
    } catch (error) {
      console.error("Error formatting date:", error);
      return "תאריך לא זמין";
    }
  },

  /**
   * Truncates text to specified length with ellipsis
   * @param {string} text - The text to truncate
   * @param {number} maxLength - Maximum length before truncation
   * @returns {string} Truncated text with ellipsis if needed
   */
  truncateText: function (text, maxLength) {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  },

  /**
   * Gets user initials from first and last name
   * @param {string} firstName - First name
   * @param {string} lastName - Last name
   * @returns {string} User initials
   */
  getUserInitials: function (userName) {
    if (!userName) return "?";
    const first = userName.charAt(0).toUpperCase();
    return first || "?";
  },

  /**
   * Validates if a string is a valid URL
   * @param {string} string - String to validate
   * @returns {boolean} True if valid URL
   */
  isValidUrl: function (string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  },

  /**
   * Shows a loading spinner
   * @param {string} spinnerId - ID of the spinner element
   */
  showLoadingSpinner: function (spinnerId = "loadingSpinner") {
    const $spinner = $("#" + spinnerId);
    if ($spinner.length) $spinner.show();
  },

  /**
   * Hides a loading spinner
   * @param {string} spinnerId - ID of the spinner element
   */
  hideLoadingSpinner: function (spinnerId = "loadingSpinner") {
    const $spinner = $("#" + spinnerId);
    if ($spinner.length) $spinner.hide();
  },

  // Authentication utilities
  auth: {
    /**
     * Get current user ID with fallback
     * @returns {number} User ID or default value
     */
    getCurrentUserId: function () {
      const currentUser = authManager.getCurrentUser();
      return currentUser ? currentUser.Id : 1;
    },

    /**
     * Update authentication UI elements
     */
    updateAuthUI: function () {
      if (authManager.isLoggedIn()) {
        $(".auth-required").show();
        $(".auth-hidden").hide();
      } else {
        $(".auth-required").hide();
        $(".auth-hidden").show();
      }
    },

    /**
     * Check if user is admin
     * @returns {boolean} True if user is admin
     */
    isAdmin: function () {
      const currentUser = authManager.getCurrentUser();
      return currentUser && currentUser.IsAdmin;
    },
  },

  // Debug utilities
  debug: {
    enabled: true, // Set to false in production

    /**
     * Conditional logging
     * @param {string} message - Log message
     * @param {*} data - Optional data to log
     */
    log: function (message, data = null) {
      if (this.enabled) {
        if (data) {
          console.log(message, data);
        } else {
          console.log(message);
        }
      }
    },

    /**
     * Conditional error logging
     * @param {string} message - Error message
     * @param {*} error - Error object
     */
    error: function (message, error = null) {
      if (this.enabled) {
        if (error) {
          console.error(message, error);
        } else {
          console.error(message);
        }
      }
    },
  },

  // Common pagination utilities
  pagination: {
    /**
     * Create pagination HTML
     * @param {number} totalResults - Total number of results
     * @param {number} pageSize - Items per page
     * @param {number} currentPage - Current page number
     * @param {string} containerId - Container element ID
     */
    create: function (
      totalResults,
      pageSize,
      currentPage,
      containerId = "pagination"
    ) {
      const totalPages = Math.ceil(totalResults / pageSize);
      const $container = $(`#${containerId}`);

      if (totalPages <= 1) {
        $container.empty();
        return;
      }

      const $pagination = $("<nav>").append(
        $("<ul>").addClass("pagination justify-content-center")
      );

      const $ul = $pagination.find("ul");

      // Previous button
      if (currentPage > 1) {
        $ul.append(
          $("<li>")
            .addClass("page-item")
            .append(
              $("<a>")
                .addClass("page-link")
                .attr("href", "#")
                .data("page", currentPage - 1)
                .text("קודם")
            )
        );
      }

      // Page numbers
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, currentPage + 2);

      for (let i = startPage; i <= endPage; i++) {
        const $li = $("<li>").addClass("page-item");
        if (i === currentPage) {
          $li.addClass("active");
        }

        $li.append(
          $("<a>")
            .addClass("page-link")
            .attr("href", "#")
            .data("page", i)
            .text(i)
        );

        $ul.append($li);
      }

      // Next button
      if (currentPage < totalPages) {
        $ul.append(
          $("<li>")
            .addClass("page-item")
            .append(
              $("<a>")
                .addClass("page-link")
                .attr("href", "#")
                .data("page", currentPage + 1)
                .text("הבא")
            )
        );
      }

      $container.empty().append($pagination);
    },
  },

  // Sentiment analysis utilities
  sentiment: {
    /**
     * Check if sentiment analysis is enabled
     * @returns {boolean} True if sentiment is enabled
     */
    isEnabled: function () {
      return (
        typeof SentimentUtils !== "undefined" &&
        SentimentUtils.isSentimentEnabled()
      );
    },

    /**
     * Get appropriate endpoint based on sentiment state
     * @param {string} baseEndpoint - Base endpoint URL
     * @param {string} sentimentEndpoint - Sentiment-enabled endpoint URL
     * @returns {string} Appropriate endpoint
     */
    getEndpoint: function (baseEndpoint, sentimentEndpoint) {
      return this.isEnabled() ? sentimentEndpoint : baseEndpoint;
    },
  },
};

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = Utils;
}
