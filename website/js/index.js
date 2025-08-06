// Home page functionality
$(document).ready(function () {
  loadLatestNews();
  updateAuthUI();
});

function updateAuthUI() {
  Utils.auth.updateAuthUI();

  const $heroButtons = $(".hero-buttons");

  if (authManager.isLoggedIn()) {
    // User is logged in - update hero buttons
    if ($heroButtons.length) {
      $heroButtons
        .empty()
        .append(
          $("<a>")
            .attr("href", "news.html")
            .addClass("btn btn-light btn-lg me-3")
            .text("צפה בחדשות"),
          $("<a>")
            .attr("href", "saved-articles.html")
            .addClass("btn btn-outline-light btn-lg")
            .text("הכתבות שלי")
        );
    }
  }
}

function loadLatestNews() {
  const $container = $("#latestNews");
  if (!$container.length) return;

  // Show loading skeleton
  NewsUtils.showLoadingSkeleton("#latestNews", 3);

  const userId = Utils.auth.getCurrentUserId();

  // Load news from API
  ajaxCall(
    "GET",
    `${urls.news.topHeadlines}?page=1&pageSize=3&userId=${userId}`,
    null,
    function (response) {
      if (
        (response.success || response.status === "Ok") &&
        response.articles &&
        response.articles.length > 0
      ) {
        NewsUtils.displayArticles(response.articles.slice(0, 3), "#latestNews");
      } else {
        NewsUtils.showNoNewsMessage($container);
      }
    },
    function (error) {
      Utils.debug.error("Error loading latest news:", error);
      NewsUtils.showErrorMessage($container, loadLatestNews);
    }
  );
}
