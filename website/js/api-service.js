// Centralized API Service to eliminate DRY violations
class ApiService {
  constructor() {
    this.debugMode = true; // Set to false in production
  }

  // Get current user ID with fallback
  getCurrentUserId() {
    const currentUser = authManager.getCurrentUser();
    return currentUser ? currentUser.Id : 1;
  }

  // Check if sentiment analysis is enabled
  isSentimentEnabled() {
    return (
      typeof SentimentUtils !== "undefined" &&
      SentimentUtils.isSentimentEnabled()
    );
  }

  // Get appropriate endpoint based on sentiment state
  getEndpoint(baseEndpoint, sentimentEndpoint) {
    return this.isSentimentEnabled() ? sentimentEndpoint : baseEndpoint;
  }

  // Show loading state
  showLoading(containerSelector, count = 12) {
    if (typeof NewsUtils !== "undefined" && NewsUtils.showLoadingSkeleton) {
      NewsUtils.showLoadingSkeleton(containerSelector, count);
    } else if (typeof Utils !== "undefined" && Utils.showLoadingSpinner) {
      Utils.showLoadingSpinner();
    }
  }

  // Hide loading state
  hideLoading() {
    if (typeof Utils !== "undefined" && Utils.hideLoadingSpinner) {
      Utils.hideLoadingSpinner();
    } else {
      const $loadingSpinner = $("#loadingSpinner");
      if ($loadingSpinner.length) {
        $loadingSpinner.hide();
      }
    }
  }

  // Generic API call wrapper
  async makeApiCall(method, endpoint, data = null, options = {}) {
    const {
      useAuth = true,
      contentType = "application/json",
      showLoading = false,
      loadingContainer = null,
      loadingCount = 12,
    } = options;

    try {
      if (showLoading && loadingContainer) {
        this.showLoading(loadingContainer, loadingCount);
      }

      let response;
      if (useAuth && authManager && authManager.makeAuthenticatedRequest) {
        // Use authenticated request for authManager compatibility
        return new Promise((resolve, reject) => {
          const successCallback = (data) => {
            if (showLoading) this.hideLoading();
            resolve(data);
          };

          const errorCallback = (error) => {
            if (showLoading) this.hideLoading();
            reject(error);
          };

          if (method === "GET") {
            ajaxCall(method, endpoint, null, successCallback, errorCallback);
          } else {
            ajaxCall(
              method,
              endpoint,
              data,
              successCallback,
              errorCallback,
              contentType
            );
          }
        });
      } else {
        // Use modern fetch for non-authenticated requests
        const fetchOptions = {
          method,
          headers: {
            "Content-Type": contentType,
          },
        };

        if (data && method !== "GET") {
          fetchOptions.body =
            typeof data === "string" ? data : JSON.stringify(data);
        }

        response = await fetch(endpoint, fetchOptions);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (showLoading) this.hideLoading();
        return result;
      }
    } catch (error) {
      if (showLoading) this.hideLoading();
      this.log("API call error:", error);
      throw error;
    }
  }

  // News API specific methods
  async loadTopHeadlines(page = 1, pageSize = 12) {
    const userId = this.getCurrentUserId();
    const endpoint = this.getEndpoint(
      urls.news.topHeadlines,
      urls.news.topHeadlinesWithSentiment
    );

    this.log("Loading top headlines:", { page, pageSize, userId, endpoint });

    return this.makeApiCall(
      "GET",
      `${endpoint}?page=${page}&pageSize=${pageSize}&userId=${userId}`,
      null,
      {
        showLoading: true,
        loadingContainer: "#newsContainer",
        loadingCount: pageSize,
      }
    );
  }

  async searchNews(query, page = 1, pageSize = 12) {
    const userId = this.getCurrentUserId();
    const endpoint = this.getEndpoint(
      urls.news.specificNews,
      urls.news.specificNewsWithSentiment
    );

    this.log("Searching news:", { query, page, pageSize, userId });

    return this.makeApiCall(
      "GET",
      `${endpoint}?query=${encodeURIComponent(
        query
      )}&userId=${userId}&page=${page}&pageSize=${pageSize}`,
      null,
      {
        showLoading: true,
        loadingContainer: "#newsContainer",
        loadingCount: pageSize,
      }
    );
  }

  async searchByTags(tags, page = 1, pageSize = 12) {
    const userId = this.getCurrentUserId();
    const endpoint = this.getEndpoint(
      urls.news.searchByTags,
      urls.news.searchByTagsWithSentiment
    );

    this.log("Searching by tags:", { tags, page, pageSize, userId });

    return this.makeApiCall(
      "POST",
      `${endpoint}?userId=${userId}&page=${page}&pageSize=${pageSize}`,
      JSON.stringify(tags),
      {
        showLoading: true,
        loadingContainer: "#newsContainer",
        loadingCount: pageSize,
      }
    );
  }

  async loadTags() {
    this.log("Loading tags");
    return this.makeApiCall("GET", `${TAGS_SERVER_PATH}/tags`, null, {
      useAuth: false,
    });
  }

  // Generic news response handler
  handleNewsResponse(response, page, container = "#newsContainer") {
    this.log("News API Response:", response);

    if (
      response.status === "Ok" &&
      response.articles &&
      response.articles.length > 0
    ) {
      const useSentiment = this.isSentimentEnabled();
      NewsUtils.displayArticles(response.articles, container, useSentiment);

      // Update pagination if updatePagination function exists
      if (typeof updatePagination === "function") {
        updatePagination(response.totalResults, 12, page);
      }

      return true;
    } else {
      this.log("No articles found or invalid response");
      NewsUtils.showNoNewsMessage($(container));
      return false;
    }
  }

  // Generic error handler
  handleApiError(error, retryFunction = null, container = "#newsContainer") {
    console.error("API Error:", error);

    if (retryFunction) {
      NewsUtils.showErrorMessage($(container), retryFunction);
    } else {
      if (typeof Utils !== "undefined" && Utils.toast) {
        Utils.toast.error("שגיאה בטעינת הנתונים");
      }
    }
  }
}

// Create global instance
const apiService = new ApiService();
