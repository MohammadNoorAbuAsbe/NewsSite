// Shared news functionality utilities
// This file contains common functions used by both index.js and news.js

const NewsUtils = {
  // Create article card (moved from index.js)
  createArticleCard: function (articleData, showSentiment = false) {
    const article = articleData.article || articleData;
    const tags = articleData.tags || []; // Get tags from the articleData
    const sentiment = articleData.sentiment || null; // Get sentiment from the articleData

    const $saveButton = authManager.isLoggedIn()
      ? $("<button>")
          .addClass("btn btn-outline-success btn-sm")
          .html('<i class="fas fa-bookmark"></i>')
          .on("click", () => NewsUtils.saveArticle(article))
      : null;

    const $shareButton = authManager.isLoggedIn()
      ? $("<button>")
          .addClass("btn btn-outline-primary btn-sm ms-2")
          .html('<i class="fas fa-share"></i>')
          .on("click", () => NewsUtils.shareArticle(article))
      : null;

    const $readMoreButton = $("<button>")
      .addClass("btn btn-primary btn-sm")
      .text("קרא עוד")
      .on("click", () => NewsUtils.openArticle(article));

    // Create tags display
    const $tagsContainer = NewsUtils.createTagsDisplay(tags);

    // Create sentiment display if enabled and available
    let $sentimentContainer = null;
    if (showSentiment && sentiment && typeof SentimentUtils !== "undefined") {
      $sentimentContainer = $("<div>")
        .addClass("sentiment-container mb-2")
        .html(SentimentUtils.createSentimentBadge(sentiment, false));
    }

    const $cardFooter = $("<div>")
      .addClass("card-footer bg-transparent")
      .append($readMoreButton);

    if ($saveButton) {
      $cardFooter.append($saveButton);
    }

    if ($shareButton) {
      $cardFooter.append($shareButton);
    }

    const $cardBodyContent = [
      $("<h6>")
        .addClass("card-title")
        .text(Utils.truncateText(article.title || "כותרת לא זמינה", 60)),
      $tagsContainer, // Add tags after title
    ];

    // Add sentiment container if it exists
    if ($sentimentContainer) {
      $cardBodyContent.push($sentimentContainer);
    }

    $cardBodyContent.push(
      $("<p>")
        .addClass("card-text text-muted")
        .text(Utils.truncateText(article.description || "תיאור לא זמין", 100)),
      $("<small>")
        .addClass("text-muted")
        .append(
          $("<i>").addClass("fas fa-clock me-1"),
          Utils.formatDate(article.publishedAt)
        )
    );

    return $("<div>")
      .addClass("col-md-4 mb-4")
      .append(
        $("<div>")
          .addClass("card news-card h-100 article-card")
          .append(
            $("<img>")
              .addClass("card-img-top")
              .attr("src", article.urlToImage || "img/NEWS.jpg")
              .attr("alt", article.title || "News Article")
              .on("error", function () {
                $(this).attr("src", "img/NEWS.jpg");
              }),
            $("<div>")
              .addClass("card-body")
              .append(...$cardBodyContent),
            $cardFooter
          )
      );
  },

  // Open article in new tab (moved from index.js)
  openArticle: function (article) {
    try {
      if (article.url) {
        // Add to recently viewed before opening
        if (typeof Utils !== "undefined" && Utils.recentlyViewed) {
          Utils.recentlyViewed.addArticle(article);
        }

        // Show toast notification
        if (typeof Utils !== "undefined" && Utils.toast) {
          Utils.toast.info("פותח כתבה...", 2000);
        }

        window.open(article.url, "_blank");
      } else {
        if (typeof Utils !== "undefined" && Utils.toast) {
          Utils.toast.warning("קישור לכתבה לא זמין");
        } else {
          authManager.showAlert("קישור לכתבה לא זמין", "warning");
        }
      }
    } catch (error) {
      console.error("Error opening article:", error);
      if (typeof Utils !== "undefined" && Utils.toast) {
        Utils.toast.error("שגיאה בפתיחת הכתבה");
      } else {
        authManager.showAlert("שגיאה בפתיחת הכתבה", "danger");
      }
    }
  },

  // Save article
  saveArticle: function (article) {
    if (!authManager.isLoggedIn()) {
      if (typeof Utils !== "undefined" && Utils.toast) {
        Utils.toast.warning("נדרש להתחבר כדי לשמור כתבות");
      } else {
        authManager.showAlert("נדרש להתחבר כדי לשמור כתבות", "warning");
      }
      return;
    }

    try {
      const saveRequest = {
        userId: authManager.currentUser.Id,
        article: {
          source: {
            id: article.source?.id || null,
            name: article.source?.name || "Unknown",
          },
          author: article.author || null,
          title: article.title,
          description: article.description,
          url: article.url,
          urlToImage: article.urlToImage,
          publishedAt: article.publishedAt,
          content: article.content,
        },
      };

      authManager.makeAuthenticatedRequest(
        "POST",
        urls.savedArticles.saveArticle,
        saveRequest,
        function (response) {
          if (response.status === "Ok") {
            if (typeof Utils !== "undefined" && Utils.toast) {
              Utils.toast.success("הכתבה נשמרה בהצלחה!");
            } else {
              authManager.showAlert("הכתבה נשמרה בהצלחה!", "success");
            }
          } else {
            if (typeof Utils !== "undefined" && Utils.toast) {
              Utils.toast.error("שגיאה בשמירת הכתבה");
            } else {
              authManager.showAlert(
                response.message || "שגיאה בשמירת הכתבה",
                "danger"
              );
            }
          }
        },
        function (error) {
          console.error("Error saving article:", error);
          if (typeof Utils !== "undefined" && Utils.toast) {
            Utils.toast.error("המאמר כבר נשמר");
          } else {
            authManager.showAlert("שגיאה בשמירת הכתבה", "danger");
          }
        }
      );
    } catch (error) {
      console.error("Error parsing article:", error);
      authManager.showAlert("שגיאה בשמירת הכתבה", "danger");
    }
  },

  // Display articles in a container
  displayArticles: function (
    articles,
    containerSelector,
    showSentiment = false
  ) {
    const $container = $(containerSelector);

    if (!articles || articles.length === 0) {
      NewsUtils.showNoNewsMessage($container);
      return;
    }

    $container.empty();
    articles.forEach((article) => {
      const $articleCard = NewsUtils.createArticleCard(article, showSentiment);
      $container.append($articleCard);
    });
  },

  // Show loading skeleton
  showLoadingSkeleton: function (containerSelector, count = 3) {
    const $container = $(containerSelector);
    $container.empty();

    for (let i = 0; i < count; i++) {
      const $skeletonCard = NewsUtils.createSkeletonCard();
      $container.append($skeletonCard);
    }
  },

  // Create skeleton card
  createSkeletonCard: function () {
    return $("<div>")
      .addClass("col-md-4 mb-4")
      .append(
        $("<div>")
          .addClass("card")
          .append(
            $("<div>").addClass("skeleton").css({ height: "200px" }),
            $("<div>")
              .addClass("card-body")
              .append(
                $("<div>")
                  .addClass("skeleton mb-2")
                  .css({ height: "20px", width: "80%" }),
                $("<div>").addClass("skeleton mb-2").css({ height: "16px" }),
                $("<div>")
                  .addClass("skeleton")
                  .css({ height: "16px", width: "60%" })
              )
          )
      );
  },

  // Show no news message
  showNoNewsMessage: function ($container) {
    const $messageCard = $("<div>")
      .addClass("col-12 text-center")
      .append(
        $("<div>")
          .addClass("card")
          .append(
            $("<div>")
              .addClass("card-body")
              .append(
                $("<i>").addClass("fas fa-newspaper fa-3x text-muted mb-3"),
                $("<h5>").addClass("text-muted").text("אין חדשות זמינות כרגע"),
                $("<p>").addClass("text-muted").text("נסה שוב מאוחר יותר")
              )
          )
      );

    $container.empty().append($messageCard);
  },

  // Show error message with retry button
  showErrorMessage: function ($container, retryCallback) {
    const $retryButton = $("<button>")
      .addClass("btn btn-primary")
      .text("נסה שוב")
      .on("click", retryCallback);

    const $errorCard = $("<div>")
      .addClass("col-12 text-center")
      .append(
        $("<div>")
          .addClass("card")
          .append(
            $("<div>")
              .addClass("card-body")
              .append(
                $("<i>").addClass(
                  "fas fa-exclamation-triangle fa-3x text-warning mb-3"
                ),
                $("<h5>").addClass("text-warning").text("שגיאה בטעינת החדשות"),
                $("<p>")
                  .addClass("text-muted")
                  .text("לא ניתן לטעון את החדשות כרגע"),
                $retryButton
              )
          )
      );

    $container.empty().append($errorCard);
  },

  // Create tags display for article card
  createTagsDisplay: function (tags) {
    if (!tags || tags.length === 0) {
      return $("<div>"); // Return empty div if no tags
    }

    const $tagsContainer = $("<div>").addClass("article-tags");

    tags.forEach((tag) => {
      const $tagSpan = $("<span>")
        .addClass(`tag ${tag.custom ? "custom-tag" : "system-tag"}`)
        .text(tag.name);

      $tagsContainer.append($tagSpan);
    });

    return $tagsContainer;
  },

  // Share article functionality
  shareArticle: function (article) {
    if (!authManager.isLoggedIn()) {
      authManager.showAlert("נדרש להתחבר כדי לשתף כתבות", "warning");
      return;
    }

    try {
      // Store the article to share
      window.articleToShare = article;

      // Populate the share modal with article details
      $("#shareArticleTitle").text(article.title || "כותרת לא זמינה");
      $("#shareArticleDescription").text(
        article.description || "תיאור לא זמין"
      );

      // Clear the comment field
      $("#shareComment").val("");

      // Show the share modal
      const shareModal = new bootstrap.Modal($("#shareModal")[0]);
      shareModal.show();
    } catch (error) {
      console.error("Error preparing share modal:", error);
      authManager.showAlert("אירעה שגיאה בהכנת השיתוף", "error");
    }
  },

  // Confirm share functionality (called from modal)
  confirmShare: function () {
    if (!window.articleToShare) {
      authManager.showAlert("שגיאה: לא נמצאה כתבה לשיתוף", "error");
      return;
    }

    const currentUser = authManager.getCurrentUser();
    if (!currentUser) {
      authManager.showAlert("נדרש להתחבר כדי לשתף כתבות", "warning");
      return;
    }

    const comment = $("#shareComment").val().trim();
    const article = window.articleToShare;

    const sharedContent = {
      userId: currentUser.Id,
      article: {
        source: {
          id: article.source?.id || "",
          name: article.source?.name || "",
        },
        author: article.author || "",
        title: article.title || "",
        description: article.description || "",
        url: article.url || "",
        urlToImage: article.urlToImage || "",
        publishedAt: article.publishedAt || new Date().toISOString(),
        content: article.content || "",
      },
      userComment: comment,
    };

    Utils.debug.log("Sharing content:", sharedContent);

    ajaxCall(
      "POST",
      urls.sharedContent.shareContent,
      JSON.stringify(sharedContent),
      function (response) {
        Utils.debug.log("Share success:", response);
        authManager.showAlert("הכתבה שותפה בהצלחה!", "success");

        // Close the modal using jQuery
        $("#shareModal").modal("hide");

        // Clear the stored article
        window.articleToShare = null;
      },
      function (xhr) {
        console.error("Share error:", xhr);
        let message = "אירעה שגיאה בשיתוף הכתבה";
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.message) {
            message = response.message;
          }
        } catch (e) {
          console.error("Error parsing error response:", e);
        }
        authManager.showAlert(message, "error");
      }
    );
  },
};
