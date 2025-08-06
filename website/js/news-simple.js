// News page functionality - Simplified version using shared utilities
$(document).ready(function () {
  initializeNewsPage();
});

let currentPage = 1;
let currentQuery = "";
let selectedTags = [];
let allTags = [];

// Global function to reload current news (used by sentiment toggle)
window.reloadCurrentNews = function () {
  if (currentQuery) {
    performSearchWithPage(currentQuery, currentPage);
  } else if (selectedTags.length > 0) {
    searchByTagsWithPage(selectedTags, currentPage);
  } else {
    loadTopHeadlines(currentPage);
  }
};

function initializeNewsPage() {
  // Load initial data
  loadTopHeadlines();
  loadTags();

  // Set up event listeners
  setupEventListeners();

  // Update UI based on auth state
  updateAuthUI();

  // Initialize sentiment analysis controls
  if (typeof SentimentUtils !== "undefined") {
    SentimentUtils.addSentimentToggle();
    SentimentUtils.addSentimentFilters();
  }

  // Initialize recently viewed articles
  if (typeof Utils !== "undefined" && Utils.recentlyViewed) {
    updateRecentlyViewedSidebar();
  }
}

function setupEventListeners() {
  // Search functionality
  $("#searchInput").on("input", debounce(performSearch, 500));
  $("#searchBtn").on("click", performSearch);

  // Filter functionality
  $("#countryFilter").on("change", loadTopHeadlines);

  // Tag selection
  $(document).on("click", ".tag-filter", toggleTag);
  $(document).on("click", "#clearTags", clearAllTags);

  // View mode toggle
  $("#viewModeToggle").on("click", toggleViewMode);

  // Pagination
  $(document).on("click", ".pagination .page-link", handlePagination);
}

function updateAuthUI() {
  Utils.auth.updateAuthUI();
}

function loadTopHeadlines(page = 1) {
  currentPage = page;

  apiService
    .loadTopHeadlines(page, 12)
    .then((response) => {
      if (apiService.handleNewsResponse(response, page)) {
        // Success handled by apiService
      }
    })
    .catch((error) => {
      apiService.handleApiError(error, () => loadTopHeadlines(page));
    });
}

function performSearch() {
  const query = $("#searchInput").val().trim();
  if (!query) {
    loadTopHeadlines();
    return;
  }

  // Clear selected tags when performing a search
  selectedTags = [];
  $(".tag-filter").removeClass("btn-primary").addClass("btn-outline-primary");

  performSearchWithPage(query, 1);
}

function performSearchWithPage(query, page = 1) {
  currentQuery = query;
  currentPage = page;

  apiService
    .searchNews(query, page, 12)
    .then((response) => {
      if (apiService.handleNewsResponse(response, page)) {
        // Success handled by apiService
      }
    })
    .catch((error) => {
      apiService.handleApiError(error, () =>
        performSearchWithPage(query, page)
      );
    });
}

function loadTags() {
  apiService
    .loadTags()
    .then((response) => {
      if (response.length > 0) {
        allTags = response;
        displayTagFilters(allTags);
      }
    })
    .catch((error) => {
      Utils.debug.error("Error loading tags:", error);
    });
}

function displayTagFilters(tags) {
  const $container = $("#systemTags");
  if (!$container.length) return;

  $container.empty();

  tags.forEach((tag) => {
    const $tagButton = $("<button>")
      .addClass("btn btn-outline-primary btn-sm tag-filter me-2 mb-2")
      .text(tag.name)
      .data("tag", tag.name);

    $container.append($tagButton);
  });

  // Add clear button
  const $clearButton = $("<button>")
    .addClass("btn btn-outline-secondary btn-sm me-2 mb-2")
    .attr("id", "clearTags")
    .html('<i class="fas fa-times"></i> נקה הכל');

  $container.append($clearButton);
}

function toggleTag(event) {
  const tagName = $(event.target).data("tag");
  const $button = $(event.target);

  if (selectedTags.includes(tagName)) {
    selectedTags = selectedTags.filter((tag) => tag !== tagName);
    $button.removeClass("btn-primary").addClass("btn-outline-primary");
  } else {
    selectedTags.push(tagName);
    $button.removeClass("btn-outline-primary").addClass("btn-primary");

    // Clear search query when selecting tags
    currentQuery = "";
    $("#searchInput").val("");
  }

  if (selectedTags.length > 0) {
    searchByTags();
  } else {
    loadTopHeadlines();
  }
}

function clearAllTags() {
  selectedTags = [];
  currentQuery = "";
  currentPage = 1;
  $(".tag-filter").removeClass("btn-primary").addClass("btn-outline-primary");
  $("#searchInput").val(""); // Clear search input too
  loadTopHeadlines();
}

function searchByTags() {
  if (selectedTags.length === 0) {
    loadTopHeadlines();
    return;
  }

  searchByTagsWithPage(selectedTags, 1);
}

function searchByTagsWithPage(tags, page = 1) {
  if (tags.length === 0) {
    loadTopHeadlines();
    return;
  }

  currentPage = page;
  selectedTags = tags; // Update the global selectedTags

  apiService
    .searchByTags(tags, page, 12)
    .then((response) => {
      if (apiService.handleNewsResponse(response, page)) {
        // Success handled by apiService
      }
    })
    .catch((error) => {
      apiService.handleApiError(error, () => searchByTagsWithPage(tags, page));
    });
}

function updatePagination(totalResults, pageSize, currentPage) {
  Utils.pagination.create(totalResults, pageSize, currentPage, "pagination");
}

function handlePagination(event) {
  event.preventDefault();
  const page = parseInt($(event.target).data("page"));

  if (currentQuery) {
    // Search with query
    performSearchWithPage(currentQuery, page);
  } else if (selectedTags.length > 0) {
    // Search by tags
    searchByTagsWithPage(selectedTags, page);
  } else {
    // Load top headlines
    loadTopHeadlines(page);
  }
}

function toggleViewMode() {
  Utils.debug.log("View mode toggle clicked");
}

// Utility function for debouncing search input
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Recently Viewed Articles Functions
function updateRecentlyViewedSidebar() {
  if (typeof Utils === "undefined" || !Utils.recentlyViewed) return;

  const container = $("#recentlyViewedSidebar");
  if (!container.length) return;

  const articles = Utils.recentlyViewed.getArticles();
  if (articles.length === 0) {
    container.html(
      '<p class="text-muted text-center small">אין כתבות שנצפו לאחרונה</p>'
    );
    return;
  }

  const articlesHtml = articles
    .map(
      (article) => `
    <div class="recently-viewed-item-sidebar d-flex align-items-center mb-2 p-1 border rounded" 
         style="cursor: pointer;" onclick="window.open('${
           article.url
         }', '_blank')">
      ${
        article.urlToImage
          ? `<img src="${article.urlToImage}" class="recently-viewed-thumb-sidebar me-2" 
              style="width: 40px; height: 30px; object-fit: cover; border-radius: 3px;">`
          : `<div class="recently-viewed-thumb-sidebar me-2 bg-light d-flex align-items-center justify-content-center" 
              style="width: 40px; height: 30px; border-radius: 3px;">
           <i class="fas fa-newspaper text-muted" style="font-size: 12px;"></i>
         </div>`
      }
      <div class="flex-grow-1" style="min-width: 0;">
        <h6 class="mb-0 recently-viewed-title-sidebar small" style="
          font-size: 0.75rem;
          line-height: 1.2;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        ">${article.title}</h6>
        <small class="text-muted" style="font-size: 0.7rem;">${Utils.formatDate(
          article.viewedAt
        )}</small>
      </div>
    </div>
  `
    )
    .join("");

  container.html(articlesHtml);
}

// Global function to clear recently viewed articles
window.clearRecentlyViewed = function () {
  if (typeof Utils !== "undefined" && Utils.recentlyViewed) {
    Utils.recentlyViewed.clearArticles();
    updateRecentlyViewedSidebar();
    if (Utils.toast) {
      Utils.toast.info("רשימת כתבות שנצפו נוקתה");
    }
  }
};

// Override the NewsUtils openArticle to update recently viewed
const originalOpenArticle = NewsUtils.openArticle;
NewsUtils.openArticle = function (article) {
  // Call the original function
  originalOpenArticle.call(this, article);

  // Update the recently viewed sidebar
  setTimeout(() => {
    updateRecentlyViewedSidebar();
  }, 100);
};
