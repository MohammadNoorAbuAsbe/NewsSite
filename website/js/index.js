// Home page functionality
document.addEventListener("DOMContentLoaded", function () {
  loadLatestNews();
  updateAuthUI();
});

function updateAuthUI() {
  const heroButtons = document.querySelector(".hero-buttons");

  if (authManager.isLoggedIn()) {
    // User is logged in - update hero buttons
    if (heroButtons) {
      heroButtons.innerHTML = `
                <a href="news.html" class="btn btn-light btn-lg me-3">צפה בחדשות</a>
                <a href="saved-articles.html" class="btn btn-outline-light btn-lg">הכתבות שלי</a>
            `;
    }
  }
}

function loadLatestNews() {
  const container = document.getElementById("latestNews");
  if (!container) return;

  // Show loading skeleton
  container.innerHTML = `
        <div class="col-md-4 mb-4">
            <div class="card">
                <div class="skeleton" style="height: 200px;"></div>
                <div class="card-body">
                    <div class="skeleton mb-2" style="height: 20px; width: 80%;"></div>
                    <div class="skeleton mb-2" style="height: 16px;"></div>
                    <div class="skeleton" style="height: 16px; width: 60%;"></div>
                </div>
            </div>
        </div>
        <div class="col-md-4 mb-4">
            <div class="card">
                <div class="skeleton" style="height: 200px;"></div>
                <div class="card-body">
                    <div class="skeleton mb-2" style="height: 20px; width: 80%;"></div>
                    <div class="skeleton mb-2" style="height: 16px;"></div>
                    <div class="skeleton" style="height: 16px; width: 60%;"></div>
                </div>
            </div>
        </div>
        <div class="col-md-4 mb-4">
            <div class="card">
                <div class="skeleton" style="height: 200px;"></div>
                <div class="card-body">
                    <div class="skeleton mb-2" style="height: 20px; width: 80%;"></div>
                    <div class="skeleton mb-2" style="height: 16px;"></div>
                    <div class="skeleton" style="height: 16px; width: 60%;"></div>
                </div>
            </div>
        </div>
    `;

  // Load news from API
  ajaxCall(
    "GET",
    NEWS_ENDPOINTS.TOP_HEADLINES_US() + "&pageSize=3",
    null,
    function (response) {
      if (
        response.success &&
        response.articles &&
        response.articles.length > 0
      ) {
        displayLatestNews(response.articles.slice(0, 3));
      } else {
        showNoNewsMessage();
      }
    },
    function (error) {
      console.error("Error loading latest news:", error);
      showErrorMessage();
    }
  );
}

function displayLatestNews(articles) {
  const container = document.getElementById("latestNews");

  container.innerHTML = articles
    .map(
      (article) => `
        <div class="col-md-4 mb-4">
            <div class="card news-card h-100">
                <img src="${
                  article.urlToImage ||
                  "img/NEWS.jpg"
                }" 
                     class="card-img-top" alt="${
                       article.title || "News Article"
                     }"
                     onerror="this.src='img/NEWS.jpg'">
                <div class="card-body">
                    <h6 class="card-title">${truncateText(
                      article.title || "כותרת לא זמינה",
                      60
                    )}</h6>
                    <p class="card-text text-muted">${truncateText(
                      article.description || "תיאור לא זמין",
                      100
                    )}</p>
                    <small class="text-muted">
                        <i class="fas fa-clock me-1"></i>
                        ${formatDate(article.publishedAt)}
                    </small>
                </div>
                <div class="card-footer bg-transparent">
                    <button class="btn btn-primary btn-sm" onclick="openArticle('${encodeURIComponent(
                      JSON.stringify(article)
                    )}')">
                        קרא עוד
                    </button>
                    ${
                      authManager.isLoggedIn()
                        ? `
                        <button class="btn btn-outline-success btn-sm" onclick="saveArticle('${encodeURIComponent(
                          JSON.stringify(article)
                        )}')">
                            <i class="fas fa-bookmark"></i>
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

function showNoNewsMessage() {
  const container = document.getElementById("latestNews");
  container.innerHTML = `
        <div class="col-12 text-center">
            <div class="card">
                <div class="card-body">
                    <i class="fas fa-newspaper fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">אין חדשות זמינות כרגע</h5>
                    <p class="text-muted">נסה שוב מאוחר יותר</p>
                </div>
            </div>
        </div>
    `;
}

function showErrorMessage() {
  const container = document.getElementById("latestNews");
  container.innerHTML = `
        <div class="col-12 text-center">
            <div class="card">
                <div class="card-body">
                    <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                    <h5 class="text-warning">שגיאה בטעינת החדשות</h5>
                    <p class="text-muted">לא ניתן לטעון את החדשות כרגע</p>
                    <button class="btn btn-primary" onclick="loadLatestNews()">נסה שוב</button>
                </div>
            </div>
        </div>
    `;
}

function openArticle(encodedArticle) {
  try {
    const article = JSON.parse(decodeURIComponent(encodedArticle));

    // Open article in new window/tab
    if (article.url) {
      window.open(article.url, "_blank");
    } else {
      authManager.showAlert("קישור לכתבה לא זמין", "warning");
    }
  } catch (error) {
    console.error("Error opening article:", error);
    authManager.showAlert("שגיאה בפתיחת הכתבה", "danger");
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
      UserId: authManager.currentUser.UserId,
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
        console.error("Error saving article:", error);
        authManager.showAlert("שגיאה בשמירת הכתבה", "danger");
      }
    );
  } catch (error) {
    console.error("Error parsing article:", error);
    authManager.showAlert("שגיאה בשמירת הכתבה", "danger");
  }
}

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
