// News page functionality
let currentNews = [];
let currentPage = 1;
let totalPages = 1;
let isGridView = true;
let userTags = [];
let currentArticle = null;

document.addEventListener("DOMContentLoaded", function () {
  // Check authentication and update UI
  authManager.updateUI();

  // Initialize page
  initializeNewsPage();
  loadUserTags();
  loadNews();

  // Event listeners
  setupEventListeners();
});

function initializeNewsPage() {
  // Set default country filter
  const countryFilter = document.getElementById("countryFilter");
  if (countryFilter) {
    countryFilter.value = "us"; // Default to US news
  }
}

function setupEventListeners() {
  // Search input
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener("input", function () {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentPage = 1;
        loadNews();
      }, 500);
    });
  }

  // Category filter
  const categoryFilter = document.getElementById("categoryFilter");
  if (categoryFilter) {
    categoryFilter.addEventListener("change", function () {
      currentPage = 1;
      loadNews();
    });
  }

  // Country filter
  const countryFilter = document.getElementById("countryFilter");
  if (countryFilter) {
    countryFilter.addEventListener("change", function () {
      currentPage = 1;
      loadNews();
    });
  }

  // View toggle
  document.querySelectorAll('input[name="viewType"]').forEach((radio) => {
    radio.addEventListener("change", function () {
      isGridView = this.id === "gridView";
      displayNews(currentNews);
    });
  });
}

function loadNews() {
  const container = document.getElementById("newsContainer");
  const loadingSpinner = document.getElementById("loadingSpinner");

  if (!container) return;

  // Show loading
  loadingSpinner.style.display = "block";
  container.innerHTML = "";

  // Build API URL
  let apiUrl = NEWS_ENDPOINTS.BASE() + "/TopHeadlines";
  const params = new URLSearchParams();

  // Add country
  const country = document.getElementById("countryFilter")?.value || "us";
  params.append("country", country);

  // Add category
  const category = document.getElementById("categoryFilter")?.value;
  if (category) {
    params.append("category", category);
  }

  // Add search query
  const searchQuery = document.getElementById("searchInput")?.value.trim();
  if (searchQuery) {
    params.append("q", searchQuery);
  }

  // Add pagination
  params.append("page", currentPage);
  params.append("pageSize", 12);

    apiUrl += "?" + params.toString();
  // Make API call
  ajaxCall(
    "GET",
    apiUrl,
    null,
    function (response) {
        loadingSpinner.style.display = "none";
      if (response.status == 'Ok' && response.articles) {
        currentNews = response.articles;
        totalPages = Math.ceil(
          (response.totalResults || response.articles.length) / 12
        );
        displayNews(currentNews);
        updatePagination();
      } else {
        showNoNewsMessage();
      }
    },
    function (error) {
      console.error("Error loading news:", error);
      loadingSpinner.style.display = "none";
      showErrorMessage();
    }
  );
}

function displayNews(articles) {
  const container = document.getElementById("newsContainer");

  if (!articles || articles.length === 0) {
    showNoNewsMessage();
    return;
  }

  if (isGridView) {
    displayGridView(articles);
  } else {
    displayListView(articles);
  }
}

function displayGridView(articles) {
  const container = document.getElementById("newsContainer");

  container.innerHTML = articles
    .map(
      (article) => `
        <div class="col-md-4 col-sm-6 mb-4">
            <div class="news-card">
                <img src="${
            article.urlToImage ||
        "img/NEWS.jpg"
                }" 
                     alt="${article.title || "News Article"}"
                     onerror="this.src='img/NEWS.jpg'">
                <div class="news-card-body">
                    <h6 class="news-card-title">${
                      article.title || "כותרת לא זמינה"
                    }</h6>
                    <p class="news-card-description">${
                      article.description || "תיאור לא זמין"
                    }</p>
                    <div class="news-card-meta">
                        <small>
                            <i class="fas fa-user me-1"></i>${
                              article.source?.name || "מקור לא ידוע"
                            }
                            <i class="fas fa-clock me-1 ms-3"></i>${formatDate(
                              article.publishedAt
                            )}
                        </small>
                    </div>
                </div>
                <div class="news-card-actions">
                    <button class="btn btn-primary btn-sm" data-article="${encodeURIComponent(JSON.stringify(article))}" onclick = "openArticleModal(this.getAttribute('data-article'))">
                        קרא עוד
                    </button>
                    ${
                      authManager.isLoggedIn()
                        ? `
                        <button class="btn btn-save btn-sm ms-2" onclick="saveArticle('${encodeURIComponent(
                          JSON.stringify(article)
                        )}')">
                            <i class="fas fa-bookmark"></i>
                        </button>
                        <button class="btn btn-share btn-sm ms-2" onclick="shareArticle('${encodeURIComponent(
                          JSON.stringify(article)
                        )}')">
                            <i class="fas fa-share"></i>
                        </button>
                    `
                        : ""
                    }
                </div>
            </div>
        </div>
    `
    )
    .join("");
}

function displayListView(articles) {
  const container = document.getElementById("newsContainer");

  container.innerHTML = `
        <div class="col-12">
            ${articles
              .map(
                (article) => `
                <div class="news-list-item mb-3">
                    <div class="row g-0">
                        <div class="col-auto">
                            <img src="${
                              article.urlToImage ||
                              "img/NEWS.jpg"
                            }" 
                                 alt="${
                                   article.title || "News Article"
                                 }" class="rounded"
                                 onerror="this.src='img/NEWS.jpg'">
                        </div>
                        <div class="col">
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-lg-8">
                                        <h6 class="card-title">${
                                          article.title || "כותרת לא זמינה"
                                        }</h6>
                                        <p class="card-text text-muted">${truncateText(
                                          article.description ||
                                            "תיאור לא זמין",
                                          150
                                        )}</p>
                                        <small class="text-muted">
                                            <i class="fas fa-user me-1"></i>${
                                              article.source?.name ||
                                              "מקור לא ידוע"
                                            }
                                            <i class="fas fa-clock me-1 ms-3"></i>${formatDate(
                                              article.publishedAt
                                            )}
                                        </small>
                                    </div>
                                    <div class="col-lg-4 text-end">
                                        <button class="btn btn-primary btn-sm mb-2" onclick="openArticleModal('${encodeURIComponent(
                                          JSON.stringify(article)
                                        )}')">
                                            קרא עוד
                                        </button>
                                        ${
                                          authManager.isLoggedIn()
                                            ? `
                                            <br>
                                            <button class="btn btn-save btn-sm me-2" onclick="saveArticle('${encodeURIComponent(
                                              JSON.stringify(article)
                                            )}')">
                                                <i class="fas fa-bookmark"></i>
                                            </button>
                                            <button class="btn btn-share btn-sm" onclick="shareArticle('${encodeURIComponent(
                                              JSON.stringify(article)
                                            )}')">
                                                <i class="fas fa-share"></i>
                                            </button>
                                        `
                                            : ""
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `
              )
              .join("")}
        </div>
    `;
}

function openArticleModal(encodedArticle) {
  try {
    const article = JSON.parse(decodeURIComponent(encodedArticle));
    currentArticle = article;

    document.getElementById("articleTitle").textContent =
      article.title || "כותרת לא זמינה";

    const content = `
            <div class="article-content">
                ${
                  article.urlToImage
                    ? `
                    <img src="${article.urlToImage}" class="img-fluid rounded mb-3" alt="${article.title}"
                         onerror="this.style.display='none'">
                `
                    : ""
                }
                <div class="article-meta mb-3">
                    <small class="text-muted">
                        <i class="fas fa-user me-1"></i>${
                          article.source?.name || "מקור לא ידוע"
                        }
                        <i class="fas fa-clock me-1 ms-3"></i>${formatDate(
                          article.publishedAt
                        )}
                        ${
                          article.author
                            ? `<i class="fas fa-edit me-1 ms-3"></i>${article.author}`
                            : ""
                        }
                    </small>
                </div>
                <div class="article-text">
                    <p>${article.description || ""}</p>
                    ${
                      article.content
                        ? `<p>${article.content.replace(
                            /\[\+\d+ chars\]/,
                            ""
                          )}</p>`
                        : ""
                    }
                </div>
                ${
                  article.url
                    ? `
                    <div class="article-link mt-3">
                        <a href="${article.url}" target="_blank" class="btn btn-outline-primary">
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
  } catch (error) {
    console.error("Error opening article modal:", error);
    authManager.showAlert("שגיאה בפתיחת הכתבה", "danger");
  }
}

function saveCurrentArticle() {
  if (currentArticle) {
    saveArticle(encodeURIComponent(JSON.stringify(currentArticle)));
  }
}

function shareCurrentArticle() {
  if (currentArticle) {
    shareArticle(encodeURIComponent(JSON.stringify(currentArticle)));
  }
}

function saveArticle(encodedArticle) {
  if (!authManager.isLoggedIn()) {
    authManager.showAlert("נדרש להתחבר כדי לשמור כתבות", "warning");
    return;
  }

  try {
    const article = JSON.parse(decodeURIComponent(encodedArticle));

    const savedArticle = {
      UserId: authManager.currentUser.id,
      Title: article.title,
      Description: article.description,
      Content: article.content,
      Url: article.url,
      ImageUrl: article.urlToImage,
      PublishedAt: article.publishedAt,
      Source: article.source?.name || "Unknown",
    };

    authManager.makeAuthenticatedRequest(
      "POST",
      SAVED_ARTICLES_SERVER_PATH,
      savedArticle,
      function (response) {
        if (response.success) {
          authManager.showAlert("הכתבה נשמרה בהצלחה!", "success");
        } else {
          authManager.showAlert(
            response.message || "שגיאה בשמירת הכתבה",
            "danger"
          );
        }
      },
      function (error) {
          console.log(savedArticle.UserId);
        console.error("Error saving article:", error);
        authManager.showAlert("שגיאה בשמירת הכתבה", "danger");
      }
    );
  } catch (error) {
    console.error("Error parsing article:", error);
    authManager.showAlert("שגיאה בשמירת הכתבה", "danger");
  }
}

function shareArticle(encodedArticle) {
  if (!authManager.isLoggedIn()) {
    authManager.showAlert("נדרש להתחבר כדי לשתף כתבות", "warning");
    return;
  }

  // TODO: Implement share functionality - open share modal
  authManager.showAlert("פונקציונליות השיתוף תהיה זמינה בקרוב", "info");
}

function loadUserTags() {
  if (!authManager.isLoggedIn()) return;

  authManager.makeAuthenticatedRequest(
    "GET",
    TAGS_SERVER_PATH + "/user/" + authManager.currentUser.UserId,
    null,
    function (response) {
      if (response.success && response.tags) {
        userTags = response.tags;
        displayUserTags();
      }
    },
    function (error) {
      console.error("Error loading user tags:", error);
    }
  );
}

function displayUserTags() {
  const container = document.getElementById("userTags");
  if (!container) return;

  if (userTags.length === 0) {
    container.innerHTML = '<p class="text-muted small">אין תחומי עניין</p>';
    return;
  }

  container.innerHTML = userTags
    .map(
      (tag) => `
        <span class="tag" onclick="toggleTagFilter(${tag.TagId}, '${tag.TagName}')">
            ${tag.TagName}
        </span>
    `
    )
    .join("");
}

function toggleTagFilter(tagId, tagName) {
  // TODO: Implement tag filtering
  authManager.showAlert(`סינון לפי "${tagName}" יהיה זמין בקרוב`, "info");
}

function openTagsModal() {
  if (!authManager.isLoggedIn()) {
    authManager.showAlert("נדרש להתחבר כדי לנהל תחומי עניין", "warning");
    return;
  }

  loadAllTags();
  const modal = new bootstrap.Modal(document.getElementById("tagsModal"));
  modal.show();
}

function loadAllTags() {
  authManager.makeAuthenticatedRequest(
    "GET",
    TAGS_SERVER_PATH,
    null,
    function (response) {
      if (response.success && response.tags) {
        displayAllTags(response.tags);
      }
    },
    function (error) {
      console.error("Error loading all tags:", error);
    }
  );
}

function displayAllTags(allTags) {
  const container = document.getElementById("allTags");
  if (!container) return;

  container.innerHTML = allTags
    .map((tag) => {
      const isUserTag = userTags.some((userTag) => userTag.TagId === tag.TagId);
      return `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${
                  tag.TagId
                }" 
                       id="tag-${tag.TagId}" ${isUserTag ? "checked" : ""}>
                <label class="form-check-label" for="tag-${tag.TagId}">
                    ${tag.TagName}
                </label>
            </div>
        `;
    })
    .join("");
}

function addTag() {
  const input = document.getElementById("newTagInput");
  const tagName = input.value.trim();

  if (!tagName) {
    authManager.showAlert("אנא הזן שם תחום עניין", "warning");
    return;
  }

  const newTag = {
    TagName: tagName,
    UserId: authManager.currentUser.UserId,
  };

  authManager.makeAuthenticatedRequest(
    "POST",
    TAGS_SERVER_PATH,
    newTag,
    function (response) {
      if (response.success) {
        input.value = "";
        loadAllTags();
        loadUserTags();
        authManager.showAlert("תחום העניין נוסף בהצלחה!", "success");
      } else {
        authManager.showAlert(
          response.message || "שגיאה בהוספת תחום העניין",
          "danger"
        );
      }
    },
    function (error) {
      console.error("Error adding tag:", error);
      authManager.showAlert("שגיאה בהוספת תחום העניין", "danger");
    }
  );
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
  loadNews();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showNoNewsMessage() {
  const container = document.getElementById("newsContainer");
  container.innerHTML = `
        <div class="col-12 text-center">
            <div class="card">
                <div class="card-body py-5">
                    <i class="fas fa-newspaper fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">לא נמצאו חדשות</h5>
                    <p class="text-muted">נסה לשנות את הפילטרים או החיפוש</p>
                </div>
            </div>
        </div>
    `;
}

function showErrorMessage() {
  const container = document.getElementById("newsContainer");
  container.innerHTML = `
        <div class="col-12 text-center">
            <div class="card">
                <div class="card-body py-5">
                    <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                    <h5 class="text-warning">שגיאה בטעינת החדשות</h5>
                    <p class="text-muted">לא ניתן לטעון את החדשות כרגע</p>
                    <button class="btn btn-primary" onclick="loadNews()">נסה שוב</button>
                </div>
            </div>
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
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return "לפני פחות משעה";
    } else if (diffInHours < 24) {
      return `לפני ${diffInHours} שעות`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 1) {
        return "אתמול";
      } else {
        return `לפני ${diffInDays} ימים`;
      }
    }
  } catch (error) {
    return "תאריך לא זמין";
  }
}
