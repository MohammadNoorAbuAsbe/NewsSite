// Saved Articles functionality
let currentSavedArticles = [];
let currentPage = 1;
let totalPages = 1;
let currentArticle = null;

document.addEventListener("DOMContentLoaded", function () {
  // Check authentication
  if (!authManager.requireAuth()) return;

  // Initialize page
  authManager.updateUI();
  loadSavedArticles();
  loadStatistics();
  setupEventListeners();
});

function setupEventListeners() {
  // Search input
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener("input", function () {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        filterSavedArticles();
      }, 500);
    });
  }
}

function loadSavedArticles() {
  const container = document.getElementById("articlesContainer");
  const loadingSpinner = document.getElementById("loadingSpinner");

  if (!container) return;

  // Show loading
  loadingSpinner.style.display = "block";
  container.innerHTML = "";

  // Build API URL
  let apiUrl =
    SAVED_ARTICLES_SERVER_PATH + "/user/" + authManager.currentUser.UserId;
  const params = new URLSearchParams();
  params.append("page", currentPage);
  params.append("pageSize", 10);

  apiUrl += "?" + params.toString();

  authManager.makeAuthenticatedRequest(
    "GET",
    apiUrl,
    null,
    function (response) {
      loadingSpinner.style.display = "none";

      if (response.success && response.articles) {
        currentSavedArticles = response.articles;
        totalPages = Math.ceil(
          (response.totalCount || response.articles.length) / 10
        );
        displaySavedArticles(currentSavedArticles);
        updatePagination();
        loadSourcesFilter();
      } else {
        showNoArticlesMessage();
      }
    },
    function (error) {
      console.error("Error loading saved articles:", error);
      loadingSpinner.style.display = "none";
      showErrorMessage();
    }
  );
}

function displaySavedArticles(articles) {
  const container = document.getElementById("articlesContainer");

  if (!articles || articles.length === 0) {
    showNoArticlesMessage();
    return;
  }

  container.innerHTML = articles
    .map(
      (article) => `
        <div class="saved-article">
            <div class="saved-article-header">
                <div class="row align-items-center">
                    <div class="col">
                        <h5 class="mb-1">${
                          article.Title || "כותרת לא זמינה"
                        }</h5>
                        <small class="text-muted">
                            <i class="fas fa-calendar me-1"></i>נשמר ב-${formatDate(
                              article.SavedAt
                            )}
                            <i class="fas fa-newspaper me-1 ms-3"></i>${
                              article.Source || "מקור לא ידוע"
                            }
                        </small>
                    </div>
                    <div class="col-auto">
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-primary" onclick="openSavedArticle('${
                              article.SavedArticleId
                            }')">
                                <i class="fas fa-eye"></i> צפה
                            </button>
                            <button class="btn btn-sm btn-outline-success" onclick="shareArticle('${
                              article.SavedArticleId
                            }')">
                                <i class="fas fa-share"></i> שתף
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteSavedArticle('${
                              article.SavedArticleId
                            }')">
                                <i class="fas fa-trash"></i> מחק
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="saved-article-body">
                <p class="text-muted">${truncateText(
                  article.Description || "תיאור לא זמין",
                  200
                )}</p>
                ${
                  article.ImageUrl
                    ? `
                    <img src="${article.ImageUrl}" class="img-fluid rounded mt-2" style="max-height: 200px;" 
                         alt="${article.Title}" onerror="this.style.display='none'">
                `
                    : ""
                }
            </div>
        </div>
    `
    )
    .join("");
}

function openSavedArticle(articleId) {
  const article = currentSavedArticles.find(
    (a) => a.SavedArticleId == articleId
  );
  if (!article) return;

  currentArticle = article;

  document.getElementById("articleTitle").textContent =
    article.Title || "כותרת לא זמינה";

  const content = `
        <div class="article-content">
            ${
              article.ImageUrl
                ? `
                <img src="${article.ImageUrl}" class="img-fluid rounded mb-3" alt="${article.Title}"
                     onerror="this.style.display='none'">
            `
                : ""
            }
            <div class="article-meta mb-3">
                <small class="text-muted">
                    <i class="fas fa-newspaper me-1"></i>${
                      article.Source || "מקור לא ידוע"
                    }
                    <i class="fas fa-calendar me-1 ms-3"></i>נשמר ב-${formatDate(
                      article.SavedAt
                    )}
                    ${
                      article.PublishedAt
                        ? `<i class="fas fa-clock me-1 ms-3"></i>פורסם ב-${formatDate(
                            article.PublishedAt
                          )}`
                        : ""
                    }
                </small>
            </div>
            <div class="article-text">
                <p>${article.Description || ""}</p>
                ${article.Content ? `<p>${article.Content}</p>` : ""}
            </div>
            ${
              article.Url
                ? `
                <div class="article-link mt-3">
                    <a href="${article.Url}" target="_blank" class="btn btn-outline-primary">
                        <i class="fas fa-external-link-alt me-2"></i>קרא את הכתבה המלאה
                    </a>
                </div>
            `
                : ""
            }
        </div>
    `;

  document.getElementById("articleContent").innerHTML = content;

  const modal = new bootstrap.Modal(document.getElementById("articleModal"));
  modal.show();
}

function shareCurrentArticle() {
  if (!currentArticle) return;

  // TODO: Implement share functionality
  authManager.showAlert("פונקציונליות השיתוף תהיה זמינה בקרוב", "info");
}

function deleteCurrentArticle() {
  if (!currentArticle) return;

  document.getElementById("confirmDeleteBtn").onclick = function () {
    deleteSavedArticle(currentArticle.SavedArticleId);
    bootstrap.Modal.getInstance(document.getElementById("deleteModal")).hide();
    bootstrap.Modal.getInstance(document.getElementById("articleModal")).hide();
  };

  const modal = new bootstrap.Modal(document.getElementById("deleteModal"));
  modal.show();
}

function shareArticle(articleId) {
  // TODO: Implement share functionality
  authManager.showAlert("פונקציונליות השיתוף תהיה זמינה בקרוב", "info");
}

function deleteSavedArticle(articleId) {
  if (!confirm("האם אתה בטוח שברצונך למחוק את הכתבה השמורה?")) {
    return;
  }

  authManager.makeAuthenticatedRequest(
    "DELETE",
    SAVED_ARTICLES_SERVER_PATH + "/" + articleId,
    null,
    function (response) {
      if (response.success) {
        authManager.showAlert("הכתבה נמחקה בהצלחה", "success");
        loadSavedArticles();
        loadStatistics();
      } else {
        authManager.showAlert(
          response.message || "שגיאה במחיקת הכתבה",
          "danger"
        );
      }
    },
    function (error) {
      console.error("Error deleting article:", error);
      authManager.showAlert("שגיאה במחיקת הכתבה", "danger");
    }
  );
}

function deleteAllArticles() {
  const confirmation = prompt(
    'כתב "מחק הכל" כדי לאשר מחיקת כל הכתבות השמורות:'
  );
  if (confirmation !== "מחק הכל") {
    return;
  }

  authManager.makeAuthenticatedRequest(
    "DELETE",
    SAVED_ARTICLES_SERVER_PATH +
      "/user/" +
      authManager.currentUser.UserId +
      "/all",
    null,
    function (response) {
      if (response.success) {
        authManager.showAlert("כל הכתבות נמחקו בהצלחה", "success");
        loadSavedArticles();
        loadStatistics();
      } else {
        authManager.showAlert(
          response.message || "שגיאה במחיקת הכתבות",
          "danger"
        );
      }
    },
    function (error) {
      console.error("Error deleting all articles:", error);
      authManager.showAlert("שגיאה במחיקת הכתבות", "danger");
    }
  );
}

function filterSavedArticles() {
  const searchTerm =
    document.getElementById("searchInput")?.value.toLowerCase() || "";
  const dateFilter = document.getElementById("dateFilter")?.value || "";
  const sourceFilter = document.getElementById("sourceFilter")?.value || "";

  let filteredArticles = currentSavedArticles;

  // Apply search filter
  if (searchTerm) {
    filteredArticles = filteredArticles.filter(
      (article) =>
        (article.Title && article.Title.toLowerCase().includes(searchTerm)) ||
        (article.Description &&
          article.Description.toLowerCase().includes(searchTerm))
    );
  }

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
      filteredArticles = filteredArticles.filter(
        (article) => new Date(article.SavedAt) >= cutoffDate
      );
    }
  }

  // Apply source filter
  if (sourceFilter) {
    filteredArticles = filteredArticles.filter(
      (article) => article.Source === sourceFilter
    );
  }

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

  // Get unique sources
  const sources = [
    ...new Set(
      currentSavedArticles.map((article) => article.Source).filter(Boolean)
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
  authManager.makeAuthenticatedRequest(
    "GET",
    SAVED_ARTICLES_SERVER_PATH +
      "/user/" +
      authManager.currentUser.UserId +
      "/stats",
    null,
    function (response) {
      if (response.success) {
        document.getElementById("totalArticles").textContent =
          response.totalArticles || 0;
        document.getElementById("weeklyArticles").textContent =
          response.weeklyArticles || 0;
      }
    },
    function (error) {
      console.error("Error loading statistics:", error);
    }
  );
}

function exportArticles() {
  // Create CSV content
  const csvContent =
    "data:text/csv;charset=utf-8," +
    "כותרת,תיאור,מקור,תאריך שמירה,קישור\n" +
    currentSavedArticles
      .map((article) => {
        return `"${article.Title || ""}","${article.Description || ""}","${
          article.Source || ""
        }","${formatDate(article.SavedAt)}","${article.Url || ""}"`;
      })
      .join("\n");

  // Create download link
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "saved_articles.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  authManager.showAlert("הכתבות יוצאו בהצלחה", "success");
}

function updatePagination() {
  const pagination = document.getElementById("pagination");
  if (!pagination || totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }

  let paginationHTML = "";

  // Previous button
  paginationHTML += `
        <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="changePage(${
              currentPage - 1
            })">הקודם</a>
        </li>
    `;

  // Page numbers
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  for (let i = startPage; i <= endPage; i++) {
    paginationHTML += `
            <li class="page-item ${i === currentPage ? "active" : ""}">
                <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
            </li>
        `;
  }

  // Next button
  paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="changePage(${
              currentPage + 1
            })">הבא</a>
        </li>
    `;

  pagination.innerHTML = paginationHTML;
}

function changePage(page) {
  if (page < 1 || page > totalPages || page === currentPage) return;

  currentPage = page;
  loadSavedArticles();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });
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

// Utility functions
function truncateText(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

function formatDate(dateString) {
  if (!dateString) return "תאריך לא זמין";

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("he-IL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "תאריך לא זמין";
  }
}
