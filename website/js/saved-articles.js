// Saved Articles functionality
let currentSavedArticles = [];
let paginationManager;

$(document).ready(function () {
  // Check authentication
  if (!AuthJWT.requireAuth()) return;

  // Initialize pagination
  paginationManager = new PaginationManager("pagination", (page) => {
    loadSavedArticles(page);
  });

  // Initialize page
  AuthJWT.updateUI();
  loadSavedArticles();
  setupEventListeners();
});

function setupEventListeners() {
  // Search input
  const $searchInput = $("#searchInput");
  if ($searchInput.length) {
    let searchTimeout;
    $searchInput.on("input", function () {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        filterSavedArticles();
      }, 500);
    });
  }
}

function loadSavedArticles(page = null) {
  const $container = $("#articlesContainer");

  if (!$container.length) return;

  // Use page parameter or current page from pagination manager
  const currentPage = page || paginationManager.currentPage;

  // Show loading
  Utils.showLoadingSpinner();
  $container.html("");

  // Build API URL
  let apiUrl = SAVED_ARTICLES_SERVER_PATH + "/user";
  const params = new URLSearchParams();
  params.append("page", currentPage);
  params.append("pageSize", 10);

  apiUrl += "?" + params.toString();

  // Use the modern fetch approach with JWT authentication
  authenticatedFetch(apiUrl, {
    method: "GET",
  })
    .then((response) => {
      if (!response) return; // Handle case where user was logged out due to invalid token
      return response.json();
    })
    .then((data) => {
      Utils.hideLoadingSpinner();

      if (!data) return;

      // Handle both response formats: direct array or wrapped response
      let articles = [];
      let totalPages = 1;
      let totalCount = 0;

      if (Array.isArray(data)) {
        articles = data;
        totalCount = data.length;
      } else if (data.articles) {
        articles = data.articles;
        totalCount = data.totalCount || articles.length;
      } else {
        articles = [];
      }

      totalPages = Math.ceil(totalCount / 10);

      if (articles && articles.length > 0) {
        currentSavedArticles = articles;
        displaySavedArticles(currentSavedArticles);
        paginationManager.update(
          totalPages,
          currentPage,
          totalCount,
          currentSavedArticles.length
        );
        loadSourcesFilter();
        // Load statistics after articles are loaded
        loadStatistics();
      } else {
        currentSavedArticles = []; // Set to empty array
        showNoArticlesMessage();
        // Update pagination to show no pages
        paginationManager.update(1, 1);
        // Still try to load statistics even if no articles
        loadStatistics();
      }
    })
    .catch((error) => {
      Utils.debug.error("Error loading saved articles:", error);
      Utils.hideLoadingSpinner();
      Utils.toast.error("שגיאה בטעינת המאמרים השמורים");
      showNoArticlesMessage();
      paginationManager.clear();
    });
}

function displaySavedArticles(articles) {
  const $container = $("#articlesContainer");

  if (!articles || articles.length === 0) {
    showNoArticlesMessage();
    return;
  }

  const articlesHTML = articles
    .map((article) => {
      // Handle the actual API response structure: lowercase property names first
      const actualArticle = article.article || article.Article || article;
      const articleId = article.id || article.Id;
      const savedAt = article.savedAt || article.SavedAt;

      return `
        <div class="saved-article">
            <div class="saved-article-header">
                <div class="row align-items-center">
                    <div class="col">
                        <h5 class="mb-1">${
                          actualArticle.title || "כותרת לא זמינה"
                        }</h5>
                        <small class="text-muted">
                            <i class="fas fa-calendar me-1"></i>נשמר ב-${
                              typeof Utils !== "undefined" && Utils.formatDate
                                ? Utils.formatDate(savedAt, "absolute")
                                : new Date(savedAt).toLocaleDateString("he-IL")
                            }
                            <i class="fas fa-newspaper me-1 ms-3"></i>${
                              actualArticle.source?.name ||
                              actualArticle.source ||
                              "מקור לא ידוע"
                            }
                        </small>
                    </div>
                    <div class="col-auto">
                        <div class="btn-group">
                            ${
                              actualArticle.url
                                ? `<a href="${actualArticle.url}" target="_blank" class="btn btn-sm btn-outline-primary">
                                    <i class="fas fa-external-link-alt"></i> קרא כתבה
                                </a>`
                                : `<button class="btn btn-sm btn-outline-primary" disabled title="קישור לא זמין">
                                    <i class="fas fa-external-link-alt"></i> קרא כתבה
                                </button>`
                            }
                            <button class="btn btn-sm btn-outline-success" onclick="shareArticle('${articleId}')">
                                <i class="fas fa-share"></i> שתף
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteSavedArticle('${articleId}')">
                                <i class="fas fa-trash"></i> מחק
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="saved-article-body">
                <p class="text-muted">${
                  typeof Utils !== "undefined" && Utils.truncateText
                    ? Utils.truncateText(
                        actualArticle.description || "תיאור לא זמין",
                        200
                      )
                    : (actualArticle.description || "תיאור לא זמין").substring(
                        0,
                        200
                      ) +
                      ((actualArticle.description || "").length > 200
                        ? "..."
                        : "")
                }</p>
                ${
                  actualArticle.urlToImage
                    ? `
                    <img src="${actualArticle.urlToImage}" class="img-fluid rounded mt-2" style="max-height: 200px;" 
                         alt="${actualArticle.title}" onerror="this.style.display='none'">
                `
                    : ""
                }
            </div>
        </div>
    `;
    })
    .join("");

  $container.html(articlesHTML);
}

// Function removed - articles now open directly via URL

// Function removed - sharing now handled directly via shareArticle function

// Function removed - delete now handled directly via deleteSavedArticle function

function shareArticle(articleId) {
  if (!AuthJWT.isLoggedIn()) {
    Utils.toast.warning("נדרש להתחבר כדי לשתף כתבות");
    return;
  }

  // Find the article in the currentSavedArticles array
  const article = currentSavedArticles.find((a) => (a.id || a.Id) == articleId);
  if (!article) {
    Utils.toast.error("לא נמצאה הכתבה לשיתוף");
    return;
  }

  // Convert saved article to the format expected by sharing
  const articleToShare = {
    title: article.article?.title || article.Article?.title || article.title,
    description:
      article.article?.description ||
      article.Article?.description ||
      article.description,
    url: article.article?.url || article.Article?.url || article.url,
    urlToImage:
      article.article?.urlToImage ||
      article.Article?.urlToImage ||
      article.urlToImage,
    publishedAt:
      article.article?.publishedAt ||
      article.Article?.publishedAt ||
      article.publishedAt,
    source: {
      name:
        article.article?.source?.name ||
        article.Article?.source?.name ||
        article.source ||
        "מקור לא ידוע",
    },
  };

  // Use the same sharing function as in news.js
  const encodedArticle = encodeURIComponent(JSON.stringify(articleToShare));

  // Call the sharing modal function (we'll need to ensure it's available or copy the logic)
  showShareModal(articleToShare);
}

function showShareModal(article) {
  // Store the article to share
  window.articleToShare = article;

  // Populate the share modal with article details
  document.getElementById("shareArticleTitle").textContent =
    article.title || "ללא כותרת";
  document.getElementById("shareArticleDescription").textContent =
    article.description || "ללא תיאור";

  // Clear the comment field
  document.getElementById("shareComment").value = "";

  // Show the share modal
  const shareModal = new bootstrap.Modal(document.getElementById("shareModal"));
  shareModal.show();
}

function confirmShare() {
  if (!window.articleToShare) {
    Utils.toast.error("שגיאה: לא נמצאה כתבה לשיתוף");
    return;
  }

  const currentUser = AuthJWT.getCurrentUser();
  if (!currentUser) {
    Utils.toast.warning("נדרש להתחבר כדי לשתף כתבות");
    return;
  }

  const comment = document.getElementById("shareComment").value.trim();
  const article = window.articleToShare;

  const sharedContent = {
    Article: {
      title: article.title || "",
      description: article.description || "",
      url: article.url || "",
      urlToImage: article.urlToImage || "",
      publishedAt: article.publishedAt || "",
      source: article.source || {},
    },
    UserComment: comment,
  };

  authenticatedFetch(SHARED_CONTENT_SERVER_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sharedContent),
  })
    .then((response) => {
      if (!response) return;
      return response.json();
    })
    .then((data) => {
      if (data) {
        Utils.toast.success("הכתבה שותפה בהצלחה!");

        // Close the modal
        const shareModal = bootstrap.Modal.getInstance(
          document.getElementById("shareModal")
        );
        shareModal.hide();

        // Clear the stored article
        window.articleToShare = null;
      }
    })
    .catch((error) => {
      console.error("Share error:", error);
      Utils.toast.error("אירעה שגיאה בשיתוף הכתבה");
    });
}

function deleteSavedArticle(articleId) {
  if (!confirm("האם אתה בטוח שברצונך למחוק את הכתבה השמורה?")) {
    return;
  }

  authenticatedFetch(
    SAVED_ARTICLES_SERVER_PATH + "/article?articleId=" + articleId,
    {
      method: "DELETE",
    }
  )
    .then((response) => {
      if (!response) return;
      return response.json();
    })
    .then((data) => {
      if (data && data.message) {
        Utils.toast.success("הכתבה נמחקה בהצלחה");
        loadSavedArticles();
        loadStatistics();
      } else {
        Utils.toast.error(data?.message || "שגיאה במחיקת הכתבה");
      }
    })
    .catch((error) => {
      console.error("Error deleting article:", error);
      Utils.toast.error("שגיאה במחיקת הכתבה");
    });
}

function deleteAllArticles() {
  const confirmation = prompt(
    'כתב "מחק הכל" כדי לאשר מחיקת כל הכתבות השמורות:'
  );
  if (confirmation !== "מחק הכל") {
    return;
  }

  if (currentSavedArticles.length === 0) {
    Utils.toast.info("אין כתבות למחיקה");
    return;
  }

  // Try to use the delete all endpoint first
  authenticatedFetch(SAVED_ARTICLES_SERVER_PATH + "/user/all", {
    method: "DELETE",
  })
    .then((response) => {
      if (!response) return;
      return response.json();
    })
    .then((data) => {
      if (data && data.success) {
        Utils.toast.success(
          data.message || "כל הכתבות נמחקו בהצלחה",
          "success"
        );
        loadSavedArticles();
        loadStatistics();
      } else {
        Utils.toast.error(data?.message || "שגיאה במחיקת הכתבות", "danger");
      }
    })
    .catch((error) => {
      console.error("Error deleting all articles:", error);
      // Fallback to individual deletion
      deleteAllArticlesIndividually();
    });
}

function deleteAllArticlesIndividually() {
  // Fallback method: delete articles one by one
  let deletedCount = 0;
  let errors = 0;
  const totalArticles = currentSavedArticles.length;

  // Show progress
  Utils.toast.info(`מוחק ${totalArticles} כתבות...`);

  currentSavedArticles.forEach((article, index) => {
    const articleId = article.id || article.Id;

    authenticatedFetch(
      SAVED_ARTICLES_SERVER_PATH + "/article?articleId=" + articleId,
      {
        method: "DELETE",
      }
    )
      .then((response) => {
        if (!response) return;
        return response.json();
      })
      .then((data) => {
        deletedCount++;

        // Check if this is the last article
        if (deletedCount + errors === totalArticles) {
          if (errors === 0) {
            Utils.toast.success("כל הכתבות נמחקו בהצלחה");
          } else {
            Utils.toast.warning(
              `נמחקו ${deletedCount} כתבות, ${errors} שגיאות`
            );
          }
          loadSavedArticles();
          loadStatistics();
        }
      })
      .catch((error) => {
        errors++;
        console.error("Error deleting article:", error);

        // Check if this is the last article
        if (deletedCount + errors === totalArticles) {
          if (deletedCount > 0) {
            Utils.toast.warning(
              `נמחקו ${deletedCount} כתבות, ${errors} שגיאות`
            );
          } else {
            Utils.toast.error("שגיאה במחיקת הכתבות");
          }
          loadSavedArticles();
          loadStatistics();
        }
      });
  });
}

function filterSavedArticles() {
  const searchTerm = document.getElementById("searchInput")?.value.trim() || "";
  const dateFilter = document.getElementById("dateFilter")?.value || "";
  const sourceFilter = document.getElementById("sourceFilter")?.value || "";

  // If there's a search term, use server-side search
  if (searchTerm) {
    searchSavedArticles(searchTerm);
    return;
  }

  // Otherwise, apply client-side filters to existing data
  let filteredArticles = currentSavedArticles;

  // Apply date filter
  if (dateFilter) {
    const now = new Date();
    let cutoffDate;

    switch (dateFilter) {
      case "today":
        cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        cutoffDate = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          now.getDate()
        );
        break;
      case "year":
        cutoffDate = new Date(
          now.getFullYear() - 1,
          now.getMonth(),
          now.getDate()
        );
        break;
    }

    if (cutoffDate) {
      filteredArticles = filteredArticles.filter((article) => {
        const savedAt = new Date(article.savedAt || article.SavedAt);
        return savedAt >= cutoffDate;
      });
    }
  }

  // Apply source filter
  if (sourceFilter) {
    filteredArticles = filteredArticles.filter((article) => {
      const actualArticle = article.article || article.Article || article;
      const source = actualArticle.source?.name || actualArticle.source;
      return source === sourceFilter;
    });
  }

  displaySavedArticles(filteredArticles);
}

function searchSavedArticles(searchTerm) {
  const container = document.getElementById("articlesContainer");
  const loadingSpinner = document.getElementById("loadingSpinner");

  if (!container || !searchTerm) return;

  // Show loading
  loadingSpinner.style.display = "block";
  container.innerHTML = "";

  // Use server-side search endpoint
  const searchUrl =
    SAVED_ARTICLES_SERVER_PATH +
    "/user/search?searchTerm=" +
    encodeURIComponent(searchTerm);

  authenticatedFetch(searchUrl, {
    method: "GET",
  })
    .then((response) => {
      if (!response) return;
      return response.json();
    })
    .then((data) => {
      loadingSpinner.style.display = "none";

      // Handle both response formats: direct array or wrapped response
      let searchResults = [];
      if (Array.isArray(data)) {
        searchResults = data;
      } else if (data && data.success && data.articles) {
        searchResults = data.articles;
      } else if (data && data.articles) {
        searchResults = data.articles;
      }

      if (searchResults && searchResults.length > 0) {
        displaySavedArticles(searchResults);

        // Update stats
        const resultsCount = searchResults.length;
        Utils.toast.info(`נמצאו ${resultsCount} תוצאות עבור "${searchTerm}"`);
      } else {
        showNoArticlesMessage();
        Utils.toast.warning("לא נמצאו תוצאות עבור החיפוש");
      }
    })
    .catch((error) => {
      loadingSpinner.style.display = "none";
      console.error("Error searching articles:", error);
      Utils.toast.error("שגיאה בחיפוש כתבות");

      // Fallback to client-side search
      fallbackClientSearch(searchTerm);
    });
}

function fallbackClientSearch(searchTerm) {
  const filteredArticles = currentSavedArticles.filter((article) => {
    const actualArticle = article.article || article.Article || article;
    return (
      (actualArticle.title &&
        actualArticle.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (actualArticle.description &&
        actualArticle.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()))
    );
  });
  displaySavedArticles(filteredArticles);
}

function clearFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("dateFilter").value = "";
  document.getElementById("sourceFilter").value = "";
  displaySavedArticles(currentSavedArticles);
}

function loadSourcesFilter() {
  const sourceFilter = document.getElementById("sourceFilter");
  if (!sourceFilter) return;

  // Get unique sources from the correct property structure
  const sources = [
    ...new Set(
      currentSavedArticles
        .map((article) => {
          const actualArticle = article.article || article.Article || article;
          return actualArticle.source?.name || actualArticle.source;
        })
        .filter(Boolean)
    ),
  ];

  // Clear existing options except the first one
  sourceFilter.innerHTML = '<option value="">כל המקורות</option>';

  // Add source options
  sources.forEach((source) => {
    const option = document.createElement("option");
    option.value = source;
    option.textContent = source;
    sourceFilter.appendChild(option);
  });
}

function loadStatistics() {
  // Try to use the statistics endpoint first
  authenticatedFetch(SAVED_ARTICLES_SERVER_PATH + "/user/stats", {
    method: "GET",
  })
    .then((response) => {
      if (!response) return;
      return response.json();
    })
    .then((data) => {
      if (data) {
        document.getElementById("totalArticles").textContent =
          data.totalArticles || 0;
        document.getElementById("weeklyArticles").textContent =
          data.weeklyArticles || 0;
      }
    })
    .catch((error) => {
      console.error("Error loading statistics from server:", error);
      // Fallback to client-side calculation
      calculateStatisticsClientSide();
    });
}

function calculateStatisticsClientSide() {
  // Calculate from current data as fallback
  const totalArticles = currentSavedArticles.length;

  // Calculate weekly articles
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const weeklyArticles = currentSavedArticles.filter((article) => {
    const savedAt = new Date(article.savedAt || article.SavedAt);
    return savedAt >= oneWeekAgo;
  }).length;

  document.getElementById("totalArticles").textContent = totalArticles;
  document.getElementById("weeklyArticles").textContent = weeklyArticles;
}

function exportArticles() {
  if (!currentSavedArticles || currentSavedArticles.length === 0) {
    Utils.toast.warning("אין כתבות לייצוא");
    return;
  }

  // Create CSV content with BOM for proper encoding
  const BOM = "\uFEFF";
  const headers = "Title,Description,Source,Date Saved,URL\n";
  const csvData = currentSavedArticles
    .map((article) => {
      const actualArticle = article.article || article.Article || article;
      const savedAt = article.savedAt || article.SavedAt;
      // Format date in English to avoid encoding issues in CSV
      const formattedDate = new Date(savedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const title = actualArticle.title || "";
      const description = actualArticle.description || "";
      const source = actualArticle.source?.name || actualArticle.source || "";
      const url = actualArticle.url || "";

      return `"${title}","${description}","${source}","${formattedDate}","${url}"`;
    })
    .join("\n");

  const csvContent = BOM + headers + csvData;

  // Create blob with proper encoding
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  // Create download link
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "saved_articles.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);

  Utils.toast.success("הכתבות יוצאו בהצלחה");
}

function showNoArticlesMessage() {
  const container = document.getElementById("articlesContainer");
  container.innerHTML = `
        <div class="text-center py-5">
            <i class="fas fa-bookmark fa-3x text-muted mb-3"></i>
            <h5 class="text-muted">אין כתבות שמורות</h5>
            <p class="text-muted">התחל לשמור כתבות מעניינות מדף החדשות</p>
            <a href="news.html" class="btn btn-primary">עבור לחדשות</a>
        </div>
    `;
}

function showErrorMessage() {
  const container = document.getElementById("articlesContainer");
  container.innerHTML = `
        <div class="text-center py-5">
            <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
            <h5 class="text-warning">שגיאה בטעינת הכתבות</h5>
            <p class="text-muted">לא ניתן לטעון את הכתבות כרגע</p>
            <button class="btn btn-primary" onclick="loadSavedArticles()">נסה שוב</button>
        </div>
    `;
}
