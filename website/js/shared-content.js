// Shared Content functionality
let currentSharedContent = [];
let currentPage = 1;
let totalPages = 1;
let blockedUsers = [];
let currentContentId = null;

document.addEventListener("DOMContentLoaded", function () {
  // Check authentication
  if (!authManager.requireAuth()) return;

  // Initialize page
  authManager.updateUI();
  loadSharedContent();
  loadBlockedUsers();
  loadUsers();
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
        filterSharedContent();
      }, 500);
    });
  }
}

function loadSharedContent() {
  const $container = $("#sharedContentContainer");
  const $loadingSpinner = $("#loadingSpinner");

  if (!$container.length) return;

  // Show loading
  Utils.showLoadingSpinner();
  $container.empty();

  // Build API URL - Use the correct endpoint from config
  let apiUrl = `${urls.sharedContent.getSharedContent}?userId=${authManager.currentUser.Id}`;

  authManager.makeAuthenticatedRequest(
    "GET",
    apiUrl,
    null,
    function (response) {
      Utils.hideLoadingSpinner();

      // The SharedContent API returns the array directly, not wrapped in a response object
      if (Array.isArray(response)) {
        currentSharedContent = response;
        totalPages = Math.ceil(response.length / 10);
        displaySharedContent(currentSharedContent);
        updatePagination();
      } else if (response && response.length !== undefined) {
        currentSharedContent = response;
        totalPages = Math.ceil(response.length / 10);
        displaySharedContent(currentSharedContent);
        updatePagination();
      } else {
        showNoContentMessage();
      }
    },
    function (error) {
      Utils.debug.error("Error loading shared content:", error);
      Utils.hideLoadingSpinner();
      showErrorMessage();
    }
  );
}

function displaySharedContent(content) {
  const $container = $("#sharedContentContainer");

  if (!content || content.length === 0) {
    showNoContentMessage();
    return;
  }

  $container.empty();

  content.forEach((item) => {
    const $contentItem = createSharedContentItem(item);
    $container.append($contentItem);
  });
}

function createSharedContentItem(item) {
  const $item = $("<div>").addClass("shared-content-item");
  const $row = $("<div>").addClass("row");
  const $col = $("<div>").addClass("col");
  const $mainFlex = $("<div>").addClass("d-flex align-items-start");

  // User avatar
  const $avatar = $("<div>")
    .addClass("user-avatar me-3")
    .text(Utils.getUserInitials(item.userName));

  // Content container
  const $contentContainer = $("<div>").addClass("flex-grow-1");

  // Header with user info and dropdown
  const $header = createContentHeader(item);
  $contentContainer.append($header);

  // Main content
  const $content = createMainContent(item);
  $contentContainer.append($content);

  // Action buttons
  const $actions = createActionButtons(item);
  $contentContainer.append($actions);

  // Comments section
  const $comments = createCommentsSection(item);
  $contentContainer.append($comments);

  $mainFlex.append($avatar, $contentContainer);
  $col.append($mainFlex);
  $row.append($col);
  $item.append($row);

  return $item;
}

function createContentHeader(item) {
  const $header = $("<div>").addClass(
    "d-flex justify-content-between align-items-start"
  );

  const $userInfo = $("<div>");
  const $userName = $("<h6>").addClass("mb-1").text(item.userName);
  const $time = $("<small>")
    .addClass("text-muted")
    .append($("<i>").addClass("fas fa-clock me-1"))
    .append(Utils.formatDate(item.sharedAt));

  $userInfo.append($userName, $time);

  const $dropdown = createDropdownMenu(item);

  $header.append($userInfo, $dropdown);
  return $header;
}

function createDropdownMenu(item) {
  const $dropdown = $("<div>").addClass("dropdown");
  const $button = $("<button>")
    .addClass("btn btn-sm btn-outline-secondary dropdown-toggle")
    .attr("data-bs-toggle", "dropdown")
    .append($("<i>").addClass("fas fa-ellipsis-h"));

  const $menu = $("<ul>").addClass("dropdown-menu");

  const $reportItem = $("<li>");
  const $reportLink = $("<a>")
    .addClass("dropdown-item")
    .attr("href", "#")
    .click((e) => {
      e.preventDefault();
      reportContent(item.id);
    })
    .append($("<i>").addClass("fas fa-flag me-2"))
    .append("דווח כפוגעני");

  const $blockItem = $("<li>");
  const $blockLink = $("<a>")
    .addClass("dropdown-item")
    .attr("href", "#")
    .click((e) => {
      e.preventDefault();
      blockUser(item.userId, item.userName);
    })
    .append($("<i>").addClass("fas fa-ban me-2"))
    .append("חסום משתמש");

  $reportItem.append($reportLink);
  $blockItem.append($blockLink);
  $menu.append($reportItem, $blockItem);
  $dropdown.append($button, $menu);

  return $dropdown;
}

function createMainContent(item) {
  const $content = $("<div>").addClass("mt-3");
  const $comment = $("<p>").addClass("mb-2").text(item.userComment);
  $content.append($comment);

  if (item.article && item.article.title) {
    const $articleCard = NewsUtils.createArticleCard({ article: item.article });
    if ($articleCard) {
      const $cardContent = $articleCard.find(".card").first();
      $content.append($cardContent);
    }
  }

  return $content;
}

function createActionButtons(item) {
  const $actions = $("<div>").addClass(
    "mt-3 d-flex justify-content-between align-items-center"
  );

  const $buttonGroup = $("<div>").addClass("btn-group btn-group-sm");

  // Determine button styles based on user's current reaction
  const likeButtonClass = item.userHasLiked
    ? "btn btn-primary"
    : "btn btn-outline-primary";
  const dislikeButtonClass = item.userHasDisliked
    ? "btn btn-danger"
    : "btn btn-outline-danger";

  const $likeButton = $("<button>")
    .addClass(likeButtonClass)
    .attr("data-content-id", item.id)
    .attr("data-user-liked", item.userHasLiked || false)
    .click(() => toggleLike(item.id))
    .append($("<i>").addClass("fas fa-thumbs-up"))
    .append(" ")
    .append(
      $("<span>")
        .attr("id", `likes-${item.id}`)
        .text(item.likesCount || 0)
    );

  const $dislikeButton = $("<button>")
    .addClass(dislikeButtonClass)
    .attr("data-content-id", item.id)
    .attr("data-user-disliked", item.userHasDisliked || false)
    .click(() => toggleDislike(item.id))
    .append($("<i>").addClass("fas fa-thumbs-down"))
    .append(" ")
    .append(
      $("<span>")
        .attr("id", `dislikes-${item.id}`)
        .text(item.dislikesCount || 0)
    );

  const $commentsButton = $("<button>")
    .addClass("btn btn-outline-secondary")
    .click(() => toggleComments(item.id))
    .append($("<i>").addClass("fas fa-comments"))
    .append(" תגובות");

  $buttonGroup.append($likeButton, $dislikeButton, $commentsButton);

  const $views = $("<small>")
    .addClass("text-muted")
    .append($("<i>").addClass("fas fa-eye me-1"))
    .append(`${item.viewsCount || 0} צפיות`);

  $actions.append($buttonGroup, $views);
  return $actions;
}

function createCommentsSection(item) {
  const $commentsSection = $("<div>")
    .addClass("comments-section mt-3")
    .attr("id", `comments-${item.id}`)
    .hide();

  const $commentBox = $("<div>").addClass("comment-box");
  const $inputGroup = $("<div>").addClass("input-group input-group-sm");

  const $input = $("<input>")
    .addClass("form-control")
    .attr({
      type: "text",
      placeholder: "כתב תגובה...",
      id: `comment-input-${item.id}`,
    });

  const $button = $("<button>")
    .addClass("btn btn-primary")
    .click(() => addComment(item.id))
    .append($("<i>").addClass("fas fa-paper-plane"));

  $inputGroup.append($input, $button);
  $commentBox.append($inputGroup);

  const $commentsList = $("<div>")
    .addClass("mt-2")
    .attr("id", `comments-list-${item.id}`);

  $commentsSection.append($commentBox, $commentsList);
  return $commentsSection;
}

function openShareModal() {
  const modal = new bootstrap.Modal(document.getElementById("shareModal"));
  modal.show();
}

function submitShare() {
  const articleUrl = $("#articleUrl").val().trim();
  const comment = $("#shareComment").val().trim();

  if (!articleUrl || !comment) {
    Utils.toast.warning("אנא מלא את כל השדות");
    return;
  }

  if (!Utils.isValidUrl(articleUrl)) {
    Utils.toast.warning("אנא הזן קישור תקין");
    return;
  }

  const shareData = {
    UserId: authManager.currentUser.Id,
    ArticleUrl: articleUrl,
    Comment: comment,
  };

  authManager.makeAuthenticatedRequest(
    "POST",
    urls.sharedContent.shareContent,
    shareData,
    function (response) {
      if (response.message || response.success) {
        Utils.toast.success("התוכן שותף בהצלחה!");
        bootstrap.Modal.getInstance($("#shareModal")[0]).hide();
        $("#shareForm")[0].reset();
        loadSharedContent();
      } else {
        Utils.toast.error(response.message || "שגיאה בשיתוף התוכן");
      }
    },
    function (error) {
      Utils.toast.error("שגיאה בשיתוף התוכן");
    }
  );
}

function toggleLike(contentId) {
  const $likeButton = $(`button[data-content-id="${contentId}"]`).filter(
    function () {
      return $(this).find(".fa-thumbs-up").length > 0;
    }
  );

  const userHasLiked = $likeButton.attr("data-user-liked") === "true";

  if (userHasLiked) {
    // User has already liked, so unlike
    unlikeContent(contentId);
  } else {
    // User hasn't liked, so like
    likeContent(contentId);
  }
}

function toggleDislike(contentId) {
  const $dislikeButton = $(`button[data-content-id="${contentId}"]`).filter(
    function () {
      return $(this).find(".fa-thumbs-down").length > 0;
    }
  );

  const userHasDisliked = $dislikeButton.attr("data-user-disliked") === "true";

  if (userHasDisliked) {
    // User has already disliked, so undislike
    undislikeContent(contentId);
  } else {
    // User hasn't disliked, so dislike
    dislikeContent(contentId);
  }
}

function likeContent(contentId) {
  const likeData = {
    userId: authManager.currentUser.Id,
    contentId: contentId,
  };

  authManager.makeAuthenticatedRequest(
    "POST",
    urls.sharedContent.likeContent,
    likeData,
    function (response) {
      if (response.message || response.success) {
        Utils.toast.success(response.message || "תוכן חויב בהצלחה");
        // Refresh the content to get updated likes count
        loadSharedContent();
      } else {
        Utils.toast.error("שגיאה בחיבת התוכן");
      }
    },
    function (error) {
      console.error("Error liking content:", error);
      Utils.toast.error("שגיאה בחיבת התוכן");
    }
  );
}

function unlikeContent(contentId) {
  const unlikeData = {
    userId: authManager.currentUser.Id,
    contentId: contentId,
  };

  authManager.makeAuthenticatedRequest(
    "POST",
    urls.sharedContent.unlikeContent,
    unlikeData,
    function (response) {
      if (response.message || response.success) {
        Utils.toast.success(response.message || "ביטול חיבת התוכן בוצע בהצלחה");
        // Refresh the content to get updated likes count
        loadSharedContent();
      } else {
        Utils.toast.error("שגיאה בביטול חיבת התוכן");
      }
    },
    function (error) {
      console.error("Error unliking content:", error);
      Utils.toast.error("שגיאה בביטול חיבת התוכן");
    }
  );
}

function dislikeContent(contentId) {
  const dislikeData = {
    userId: authManager.currentUser.Id,
    contentId: contentId,
  };

  authManager.makeAuthenticatedRequest(
    "POST",
    urls.sharedContent.dislikeContent,
    dislikeData,
    function (response) {
      if (response.message || response.success) {
        Utils.toast.success(response.message || "התוכן לא חויב בהצלחה");
        // Refresh the content to get updated dislikes count
        loadSharedContent();
      } else {
        Utils.toast.error("שגיאה בחוסר חיבת התוכן");
      }
    },
    function (error) {
      console.error("Error disliking content:", error);
      Utils.toast.error("שגיאה בחוסר חיבת התוכן");
    }
  );
}

function undislikeContent(contentId) {
  const undislikeData = {
    userId: authManager.currentUser.Id,
    contentId: contentId,
  };

  authManager.makeAuthenticatedRequest(
    "POST",
    urls.sharedContent.undislikeContent,
    undislikeData,
    function (response) {
      if (response.message || response.success) {
        Utils.toast.success(response.message || "ביטול חוסר חיבת התוכן בוצע בהצלחה");
        // Refresh the content to get updated dislikes count
        loadSharedContent();
      } else {
        Utils.toast.error("שגיאה בביטול חוסר חיבת התוכן");
      }
    },
    function (error) {
      console.error("Error undisliking content:", error);
      Utils.toast.error("שגיאה בביטול חוסר חיבת התוכן");
    }
  );
}

function toggleComments(contentId) {
  const $commentsSection = $(`#comments-${contentId}`);

  if ($commentsSection.is(":hidden")) {
    $commentsSection.show();
    loadComments(contentId);
  } else {
    $commentsSection.hide();
  }
}

function loadComments(contentId) {
  authManager.makeAuthenticatedRequest(
    "GET",
    `${urls.sharedContent.base}/${contentId}/comments`,
    null,
    function (response) {
      // Assume comments are returned as an array directly
      if (Array.isArray(response)) {
        displayComments(contentId, response);
      } else if (response && response.length !== undefined) {
        displayComments(contentId, response);
      } else {
        displayComments(contentId, []);
      }
    },
    function (error) {
      console.error("Error loading comments:", error);
      displayComments(contentId, []);
    }
  );
}

function displayComments(contentId, comments) {
  const $container = $(`#comments-list-${contentId}`);

  if (comments.length === 0) {
    $container.html('<p class="text-muted small">אין תגובות עדיין</p>');
    return;
  }

  $container.empty();

  comments.forEach((comment) => {
    const $comment = $("<div>").addClass("comment");

    const $header = $("<div>").addClass("d-flex justify-content-between");
    const $userName = $("<strong>")
      .addClass("small")
      .text(`${comment.User?.FirstName} ${comment.User?.LastName}`);
    const $date = $("<small>")
      .addClass("text-muted")
      .text(Utils.formatDate(comment.CreatedAt));

    $header.append($userName, $date);

    const $text = $("<p>").addClass("mb-0 small").text(comment.CommentText);

    $comment.append($header, $text);
    $container.append($comment);
  });
}

function addComment(contentId) {
  const $input = $(`#comment-input-${contentId}`);
  const commentText = $input.val().trim();

  if (!commentText) {
    Utils.toast.warning("אנא כתב תגובה");
    return;
  }

  const commentData = {
    SharedContentId: contentId,
    UserId: authManager.currentUser.Id,
    CommentText: commentText,
  };

  authManager.makeAuthenticatedRequest(
    "POST",
    `${urls.sharedContent.base}/${contentId}/comments`,
    commentData,
    function (response) {
      if (response.success || response.message) {
        $input.val("");
        loadComments(contentId);
      } else {
        Utils.toast.error(response.message || "שגיאה בהוספת התגובה");
      }
    },
    function (error) {
      console.error("Error adding comment:", error);
      Utils.toast.error("שגיאה בהוספת התגובה");
    }
  );
}

function reportContent(contentId) {
  currentContentId = contentId;
  const modal = new bootstrap.Modal(document.getElementById("reportModal"));
  modal.show();
}

function submitReport() {
  // Show loading state
  const $submitBtn = $('button[onclick="submitReport()"]');
  const originalText = $submitBtn.html();
  $submitBtn
    .prop("disabled", true)
    .html('<i class="fas fa-spinner fa-spin me-1"></i>שולח...');

  const reportData = {
    ContentId: currentContentId,
    ReporterId: authManager.currentUser.Id,
  };

  authManager.makeAuthenticatedRequest(
    "POST",
    urls.sharedContent.reportContent,
    reportData,
    function (response) {
      if (response.message || response.success) {
        // Close modal first
        bootstrap.Modal.getInstance($("#reportModal")[0]).hide();

        // Show success message
        Utils.toast.success("הדיווח נשלח בהצלחה! תודה על ההתראה.");

        // Mark content as reported visually
        markContentAsReported(currentContentId);
      } else {
        Utils.toast.error(response.message || "שגיאה בשליחת הדיווח");
      }
      // Reset button
      $submitBtn.prop("disabled", false).html(originalText);
    },
    function (error) {
      console.error("Error submitting report:", error);
      Utils.toast.error("שגיאה בשליחת הדיווח. אנא נסה שוב.");
      // Reset button
      $submitBtn.prop("disabled", false).html(originalText);
    }
  );
}

function markContentAsReported(contentId) {
  // Find the content item and add visual feedback
  $(`.card`).each(function () {
    const $card = $(this);
    const $reportBtn = $card.find(
      `button[onclick*="reportContent(${contentId})"]`
    );

    if ($reportBtn.length) {
      // Update the report button to show it's been reported
      $reportBtn
        .removeClass("btn-outline-warning")
        .addClass("btn-success")
        .prop("disabled", true)
        .html('<i class="fas fa-check me-1"></i>דווח');

      // Add a small badge to the card
      if (!$card.find(".reported-badge").length) {
        $card.find(".card-header, .card-body").first().prepend(`
          <span class="badge bg-warning text-dark reported-badge mb-2">
            <i class="fas fa-flag me-1"></i>דווח על ידך
          </span>
        `);
      }
    }
  });
}

function openBlockUserModal() {
  const modal = new bootstrap.Modal(document.getElementById("blockUserModal"));
  modal.show();
}

function blockUser(userId, userName) {
  if (!userId) {
    // Called from modal
    userId = $("#userToBlock").val();
    userName = $("#userToBlock option:selected").text();
  }

  if (!userId) {
    Utils.toast.warning("אנא בחר משתמש");
    return;
  }

  if (!confirm(`האם אתה בטוח שברצונך לחסום את ${userName}?`)) {
    return;
  }

  const blockData = {
    userId: authManager.currentUser.Id,
    userToBlockId: userId,
  };

  authManager.makeAuthenticatedRequest(
    "POST",
    urls.userSettings.blockUser,
    blockData,
    function (response) {
      if (response.message || response.success) {
        Utils.toast.success(`המשתמש ${userName} נחסם בהצלחה`);
        loadBlockedUsers();
        loadSharedContent(); // Refresh content

        // Close modal if open
        const modal = bootstrap.Modal.getInstance($("#blockUserModal")[0]);
        if (modal) modal.hide();
      } else {
        Utils.toast.error(response.message || "שגיאה בחסימת המשתמש");
      }
    },
    function (error) {
      console.error("Error blocking user:", error);
      Utils.toast.error("שגיאה בחסימת המשתמש");
    }
  );
}

function unblockUser(userId, userName) {
  if (!confirm(`האם אתה בטוח שברצונך לבטל את החסימה של ${userName}?`)) {
    return;
  }

  authManager.makeAuthenticatedRequest(
    "POST",
    urls.userSettings.unblockUser,
    {
      userId: authManager.currentUser.Id,
      userToUnblockId: userId,
    },
    function (response) {
      if (response.message || response.success) {
        Utils.toast.success(`החסימה של ${userName} בוטלה בהצלחה`);
        loadBlockedUsers();
        loadSharedContent(); // Refresh content
      } else {
        Utils.toast.error(response.message || "שגיאה בביטול החסימה");
      }
    },
    function (error) {
      console.error("Error unblocking user:", error);
      Utils.toast.error("שגיאה בביטול החסימה");
    }
  );
}

function loadBlockedUsers() {
  authManager.makeAuthenticatedRequest(
    "GET",
    `${urls.userSettings.getUserSettings}?userId=${authManager.currentUser.Id}`,
    null,
    function (response) {
      if (response && response.blockedUsers) {
        // Response contains the user settings with blockedUsers array (full user objects)
        blockedUsers = response.blockedUsers;
        displayBlockedUsers();
      } else {
        blockedUsers = [];
        displayBlockedUsers();
      }
    },
    function (error) {
      console.error("Error loading blocked users:", error);
      blockedUsers = [];
      displayBlockedUsers();
    }
  );
}

function displayBlockedUsers() {
  const $container = $("#blockedUsers");

  if (blockedUsers.length === 0) {
    $container.html('<p class="text-muted small">אין משתמשים חסומים</p>');
    return;
  }

  $container.empty();

  blockedUsers.forEach((user) => {
    const $userItem = $("<div>").addClass(
      "d-flex justify-content-between align-items-center mb-2"
    );

    const $userName = $("<small>").text(user.name);

    const $unblockBtn = $("<button>")
      .addClass("btn btn-sm btn-outline-secondary")
      .text("בטל חסימה")
      .click(() => unblockUser(user.id, user.name));

    $userItem.append($userName, $unblockBtn);
    $container.append($userItem);
  });
}

function loadUsers() {
  authManager.makeAuthenticatedRequest(
    "GET",
    urls.users.base,
    null,
    function (response) {
      // The Users API returns an array of users directly, not wrapped in a response object
      if (Array.isArray(response)) {
        populateUserFilters(response);
      } else if (response && response.length !== undefined) {
        populateUserFilters(response);
      }
    },
    function (error) {
      console.error("Error loading users:", error);
    }
  );
}

function populateUserFilters(users) {
  const $userFilter = $("#userFilter");
  const $userToBlock = $("#userToBlock");

  // Filter out current user and blocked users
  const availableUsers = users.filter(
    (user) =>
      user.UserId !== authManager.currentUser.UserId &&
      !blockedUsers.some((blocked) => blocked.id === user.UserId)
  );

  if ($userFilter.length) {
    availableUsers.forEach((user) => {
      const $option = $("<option>")
        .val(user.UserId)
        .text(`${user.FirstName} ${user.LastName}`);
      $userFilter.append($option);
    });
  }

  if ($userToBlock.length) {
    $userToBlock.empty().append('<option value="">בחר משתמש...</option>');
    availableUsers.forEach((user) => {
      const $option = $("<option>")
        .val(user.UserId)
        .text(`${user.FirstName} ${user.LastName}`);
      $userToBlock.append($option);
    });
  }
}

function filterSharedContent() {
  const searchTerm = $("#searchInput").val()?.toLowerCase() || "";
  const userFilter = $("#userFilter").val() || "";

  let filteredContent = currentSharedContent;

  // Apply search filter
  if (searchTerm) {
    filteredContent = filteredContent.filter(
      (item) =>
        (item.userComment &&
          item.userComment.toLowerCase().includes(searchTerm)) ||
        (item.article?.title &&
          item.article.title.toLowerCase().includes(searchTerm)) ||
        (item.article?.description &&
          item.article.description.toLowerCase().includes(searchTerm))
    );
  }

  // Apply user filter
  if (userFilter) {
    filteredContent = filteredContent.filter(
      (item) => item.userId == userFilter
    );
  }

  displaySharedContent(filteredContent);
}

function updatePagination() {
  const $pagination = $("#pagination");
  if (!$pagination.length || totalPages <= 1) {
    $pagination.empty();
    return;
  }

  $pagination.empty();

  // Previous button
  const $prevItem = $("<li>").addClass(
    `page-item ${currentPage === 1 ? "disabled" : ""}`
  );
  const $prevLink = $("<a>")
    .addClass("page-link")
    .attr("href", "#")
    .text("הקודם")
    .click((e) => {
      e.preventDefault();
      changePage(currentPage - 1);
    });
  $prevItem.append($prevLink);
  $pagination.append($prevItem);

  // Page numbers
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  for (let i = startPage; i <= endPage; i++) {
    const $pageItem = $("<li>").addClass(
      `page-item ${i === currentPage ? "active" : ""}`
    );
    const $pageLink = $("<a>")
      .addClass("page-link")
      .attr("href", "#")
      .text(i)
      .click((e) => {
        e.preventDefault();
        changePage(i);
      });
    $pageItem.append($pageLink);
    $pagination.append($pageItem);
  }

  // Next button
  const $nextItem = $("<li>").addClass(
    `page-item ${currentPage === totalPages ? "disabled" : ""}`
  );
  const $nextLink = $("<a>")
    .addClass("page-link")
    .attr("href", "#")
    .text("הבא")
    .click((e) => {
      e.preventDefault();
      changePage(currentPage + 1);
    });
  $nextItem.append($nextLink);
  $pagination.append($nextItem);
}

function changePage(page) {
  if (page < 1 || page > totalPages || page === currentPage) return;

  currentPage = page;
  loadSharedContent();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showNoContentMessage() {
  const $container = $("#sharedContentContainer");

  const $message = $("<div>").addClass("text-center py-5");

  const $icon = $("<i>").addClass("fas fa-share-alt fa-3x text-muted mb-3");
  const $title = $("<h5>").addClass("text-muted").text("אין תוכן משותף");
  const $text = $("<p>")
    .addClass("text-muted")
    .text("היה הראשון לשתף תוכן מעניין!");
  const $button = $("<button>")
    .addClass("btn btn-primary")
    .text("שתף תוכן")
    .click(openShareModal);

  $message.append($icon, $title, $text, $button);
  $container.html($message);
}

function showErrorMessage() {
  const $container = $("#sharedContentContainer");

  const $message = $("<div>").addClass("text-center py-5");

  const $icon = $("<i>").addClass(
    "fas fa-exclamation-triangle fa-3x text-warning mb-3"
  );
  const $title = $("<h5>").addClass("text-warning").text("שגיאה בטעינת התוכן");
  const $text = $("<p>")
    .addClass("text-muted")
    .text("לא ניתן לטעון את התוכן כרגע");
  const $button = $("<button>")
    .addClass("btn btn-primary")
    .text("נסה שוב")
    .click(loadSharedContent);

  $message.append($icon, $title, $text, $button);
  $container.html($message);
}
