// Sentiment analysis utilities
const SentimentUtils = {
  /**
   * Get sentiment icon and styling based on sentiment label
   * @param {string} label - Sentiment label (POSITIVE, NEGATIVE, NEUTRAL)
   * @param {string} confidence - Confidence level (HIGH, MEDIUM, LOW)
   * @returns {object} Object containing icon, class, and color
   */
  getSentimentDisplay: function (label, confidence = "LOW") {
    const sentimentMap = {
      POSITIVE: {
        icon: "😊",
        iconClass: "fas fa-smile",
        class: "sentiment-positive",
        color: "#28a745",
        bgColor: "#d4edda",
        text: "Positive",
      },
      NEGATIVE: {
        icon: "😞",
        iconClass: "fas fa-frown",
        class: "sentiment-negative",
        color: "#dc3545",
        bgColor: "#f8d7da",
        text: "Negative",
      },
      NEUTRAL: {
        icon: "😐",
        iconClass: "fas fa-meh",
        class: "sentiment-neutral",
        color: "#6c757d",
        bgColor: "#e2e3e5",
        text: "Neutral",
      },
    };

    const sentiment =
      sentimentMap[label?.toUpperCase()] || sentimentMap["NEUTRAL"];

    // Adjust opacity based on confidence
    const confidenceMap = {
      HIGH: "1.0",
      MEDIUM: "0.8",
      LOW: "0.6",
    };

    sentiment.opacity = confidenceMap[confidence] || "0.6";
    sentiment.confidence = confidence;

    return sentiment;
  },

  /**
   * Create a sentiment badge HTML element
   * @param {object} sentiment - Sentiment object from API
   * @param {boolean} showScore - Whether to show confidence score
   * @returns {string} HTML string for sentiment badge
   */
  createSentimentBadge: function (sentiment, showScore = false) {
    if (!sentiment) {
      return "";
    }

    const display = this.getSentimentDisplay(
      sentiment.label,
      sentiment.confidence
    );
    const scoreText =
      showScore && sentiment.score
        ? ` (${(sentiment.score * 100).toFixed(0)}%)`
        : "";

    return `
            <span class="sentiment-badge ${display.class}" 
                  style="background-color: ${display.bgColor}; color: ${display.color}; opacity: ${display.opacity};"
                  title="Sentiment: ${display.text}${scoreText} - Confidence: ${sentiment.confidence}">
                <i class="${display.iconClass}" aria-hidden="true"></i>
                ${display.text}${scoreText}
            </span>
        `;
  },

  /**
   * Create a compact sentiment indicator for list views
   * @param {object} sentiment - Sentiment object from API
   * @returns {string} HTML string for compact sentiment indicator
   */
  createCompactSentimentIndicator: function (sentiment) {
    if (!sentiment) {
      return "";
    }

    const display = this.getSentimentDisplay(
      sentiment.label,
      sentiment.confidence
    );

    return `
            <span class="sentiment-indicator-compact ${display.class}" 
                  style="color: ${display.color}; opacity: ${display.opacity};"
                  title="Sentiment: ${display.text} - Confidence: ${sentiment.confidence}">
                ${display.icon}
            </span>
        `;
  },

  /**
   * Add sentiment analysis toggle to the news page
   */
  addSentimentToggle: function () {
    // Check if toggle already exists in HTML
    if ($("#sentimentToggle").length > 0) {
      $(".sentiment-controls").show();
      this.setupSentimentControls();
      return;
    }

    // If not, create it dynamically (fallback)
    const toggleHtml = `
            <div class="sentiment-controls mb-3">
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="sentimentToggle">
                    <label class="form-check-label" for="sentimentToggle">
                        <i class="fas fa-brain text-primary"></i> Show AI Sentiment Analysis
                    </label>
                </div>
                <small class="text-muted">
                    AI analyzes article sentiment using Hugging Face models
                </small>
            </div>
        `;

    // Find a good place to insert the toggle (after search controls)
    const searchContainer = $(".search-controls, .filter-controls").last();
    if (searchContainer.length) {
      searchContainer.after(toggleHtml);
    } else {
      $(".news-container, #newsContainer").first().before(toggleHtml);
    }

    this.setupSentimentControls();
  },

  /**
   * Setup sentiment control event handlers
   */
  setupSentimentControls: function () {
    // Add event listener
    $("#sentimentToggle")
      .off("change")
      .on("change", function () {
        const isEnabled = $(this).is(":checked");
        localStorage.setItem("sentimentAnalysisEnabled", isEnabled);

        // Show/hide sentiment filters
        if (isEnabled) {
          $(".sentiment-filters").show();
        } else {
          $(".sentiment-filters").hide();
        }

        // Reload current news with/without sentiment
        if (typeof window.reloadCurrentNews === "function") {
          window.reloadCurrentNews();
        }
      });

    // Restore previous state
    const savedState = localStorage.getItem("sentimentAnalysisEnabled");
    if (savedState === "true") {
      $("#sentimentToggle").prop("checked", true);
      $(".sentiment-filters").show();
    }
  },

  /**
   * Check if sentiment analysis is enabled
   * @returns {boolean} True if sentiment analysis is enabled
   */
  isSentimentEnabled: function () {
    return localStorage.getItem("sentimentAnalysisEnabled") === "true";
  },

  /**
   * Add sentiment filter controls
   */
  addSentimentFilters: function () {
    // Check if filters already exist in HTML
    if ($(".sentiment-filters").length > 0) {
      this.setupSentimentFilters();
      return;
    }

    // If not, create them dynamically (fallback)
    const filtersHtml = `
            <div class="sentiment-filters mt-2" style="display: none;">
                <label class="form-label">Filter by Sentiment:</label>
                <div class="btn-group" role="group" aria-label="Sentiment filters">
                    <input type="checkbox" class="btn-check" id="filter-positive" value="POSITIVE">
                    <label class="btn btn-outline-success btn-sm" for="filter-positive">
                        <i class="fas fa-smile"></i> Positive
                    </label>
                    
                    <input type="checkbox" class="btn-check" id="filter-neutral" value="NEUTRAL">
                    <label class="btn btn-outline-secondary btn-sm" for="filter-neutral">
                        <i class="fas fa-meh"></i> Neutral
                    </label>
                    
                    <input type="checkbox" class="btn-check" id="filter-negative" value="NEGATIVE">
                    <label class="btn btn-outline-danger btn-sm" for="filter-negative">
                        <i class="fas fa-frown"></i> Negative
                    </label>
                </div>
            </div>
        `;

    $(".sentiment-controls").after(filtersHtml);
    this.setupSentimentFilters();
  },

  /**
   * Setup sentiment filter event handlers
   */
  setupSentimentFilters: function () {
    // Add filter functionality
    $('.sentiment-filters input[type="checkbox"]')
      .off("change")
      .on("change", function () {
        window.applySentimentFilters();
      });
  },

  /**
   * Apply sentiment filters to visible articles
   */
  applySentimentFilters: function () {
    const selectedSentiments = $(
      '.sentiment-filters input[type="checkbox"]:checked'
    )
      .map(function () {
        return $(this).val();
      })
      .get();

    if (selectedSentiments.length === 0) {
      // Show all articles if no filters selected
      $(".article-card, .news-item").show();
      return;
    }

    $(".article-card, .news-item").each(function () {
      const $article = $(this);
      const sentimentBadge = $article.find(
        ".sentiment-badge, .sentiment-indicator-compact"
      );

      if (sentimentBadge.length === 0) {
        // No sentiment data, hide the article
        $article.hide();
        return;
      }

      const articleSentiment = sentimentBadge.hasClass("sentiment-positive")
        ? "POSITIVE"
        : sentimentBadge.hasClass("sentiment-negative")
        ? "NEGATIVE"
        : "NEUTRAL";

      if (selectedSentiments.includes(articleSentiment)) {
        $article.show();
      } else {
        $article.hide();
      }
    });
  },
};

// Make it available globally
window.SentimentUtils = SentimentUtils;
window.applySentimentFilters = SentimentUtils.applySentimentFilters;
