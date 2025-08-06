// Summary utilities for news summary functionality
class SummaryUtils {
  static isEnabled = false;
  static currentSummary = null;

  static async loadDailySummary() {
    try {
      showSummaryLoading(true);

      // Use custom fetch with longer timeout for summary
      const response = await this.fetchSummaryWithTimeout(
        urls.news.dailySummary
      );

      if (response && response.success) {
        this.currentSummary = response;
        this.displaySummary(response);
        showSummaryLoading(false);
      } else {
        console.warn("Failed to load daily summary:", response);
        this.displaySummaryError("Unable to generate daily summary");
        showSummaryLoading(false);
      }
    } catch (error) {
      console.error("Error loading daily summary:", error);
      this.displaySummaryError(
        "Error loading daily summary - please try again"
      );
      showSummaryLoading(false);
    }
  }

  static async fetchSummaryWithTimeout(url, timeoutMs = 120000) {
    // 2 minutes timeout
    const token = localStorage.getItem("jwtToken");

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error(
          "Request timed out - summary generation is taking longer than expected"
        );
      }
      throw error;
    }
  }

  static displaySummary(summaryData) {
    const summaryContainer = document.getElementById("dailySummaryContent");
    if (!summaryContainer) return;

    const summaryCard = `
            <div class="summary-content mb-3">
                <p class="mb-2 small">${summaryData.summary}</p>
            </div>
            <div class="summary-meta text-muted small">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span>
                        <i class="fas fa-file-alt me-1"></i>
                        ${summaryData.articleCount} articles
                    </span>
                    <span>
                        <i class="fas fa-clock me-1"></i>
                        ${this.formatGeneratedTime(summaryData.generatedAt)}
                    </span>
                </div>
            </div>
            <div class="summary-actions">
                <button class="btn btn-sm btn-outline-primary w-100" onclick="SummaryUtils.refreshSummary()">
                    <i class="fas fa-sync-alt me-1"></i>Refresh Summary
                </button>
            </div>
        `;

    summaryContainer.innerHTML = summaryCard;
  }

  static displaySummaryError(errorMessage) {
    const summaryContainer = document.getElementById("dailySummaryContent");
    if (!summaryContainer) return;

    const errorCard = `
            <div class="alert alert-warning small mb-2" role="alert">
                <i class="fas fa-exclamation-triangle me-1"></i>
                ${errorMessage}
            </div>
            <div class="text-muted small mb-2">
                <i class="fas fa-info-circle me-1"></i>
                AI summary generation can take 1-2 minutes to complete.
            </div>
            <button class="btn btn-sm btn-outline-primary w-100" onclick="SummaryUtils.refreshSummary()">
                <i class="fas fa-sync-alt me-1"></i>Try Again
            </button>
        `;

    summaryContainer.innerHTML = errorCard;
  }

  static async refreshSummary() {
    await this.loadDailySummary();
  }

  static formatGeneratedTime(dateString) {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMinutes = Math.floor((now - date) / (1000 * 60));

      if (diffMinutes < 1) {
        return "Just now";
      } else if (diffMinutes < 60) {
        return `${diffMinutes} min ago`;
      } else {
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) {
          return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
        } else {
          return date.toLocaleDateString();
        }
      }
    } catch (error) {
      return "Recently";
    }
  }
}

function showSummaryLoading(show) {
  const summaryContainer = document.getElementById("dailySummaryContent");
  if (!summaryContainer) return;

  if (show) {
    summaryContainer.innerHTML = `
            <div class="text-center py-3">
                <div class="spinner-border spinner-border-sm text-primary mb-2" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mb-0 text-muted small">Generating AI summary...</p>
                <p class="mb-0 text-muted" style="font-size: 0.75rem;">This may take up to 2 minutes</p>
            </div>
        `;
  }
}

// Initialize summary functionality when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Auto-load summary when page loads
  setTimeout(() => {
    SummaryUtils.loadDailySummary();
  }, 1000); // Load after a short delay to ensure other scripts are loaded
});
