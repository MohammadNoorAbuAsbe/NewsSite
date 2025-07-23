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
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener("input", function () {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        filterSharedContent();
      }, 500);
    });
  }
}

function loadSharedContent() {
  const container = document.getElementById("sharedContentContainer");
  const loadingSpinner = document.getElementById("loadingSpinner");

  if (!container) return;

  // Show loading
  loadingSpinner.style.display = "block";
  container.innerHTML = "";

  // Build API URL
  let apiUrl = SHARED_CONTENT_SERVER_PATH;
  const params = new URLSearchParams();
  params.append("page", currentPage);
  params.append("pageSize", 10);
  params.append("userId", authManager.currentUser.UserId); // For filtering blocked users

  apiUrl += "?" + params.toString();

  authManager.makeAuthenticatedRequest(
    "GET",
    apiUrl,
    null,
    function (response) {
      loadingSpinner.style.display = "none";

      if (response.success && response.sharedContent) {
        currentSharedContent = response.sharedContent;
        totalPages = Math.ceil(
          (response.totalCount || response.sharedContent.length) / 10
        );
        displaySharedContent(currentSharedContent);
        updatePagination();
      } else {
        showNoContentMessage();
      }
    },
    function (error) {
      console.error("Error loading shared content:", error);
      loadingSpinner.style.display = "none";
      showErrorMessage();
    }
  );
}

function displaySharedContent(content) {
  const container = document.getElementById("sharedContentContainer");

  if (!content || content.length === 0) {
    showNoContentMessage();
    return;
  }

  container.innerHTML = content
    .map(
      (item) => `
        <div class="shared-content-item">
            <div class="row">
                <div class="col">
                    <div class="d-flex align-items-start">
                        <div class="user-avatar me-3">
                            ${getUserInitials(
                              item.User?.FirstName,
                              item.User?.LastName
                            )}
                        </div>
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 class="mb-1">${item.User?.FirstName} ${
        item.User?.LastName
      }</h6>
                                    <small class="text-muted">
                                        <i class="fas fa-clock me-1"></i>${formatDate(
                                          item.SharedAt
                                        )}
                                    </small>
                                </div>
                                <div class="dropdown">
                                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                                        <i class="fas fa-ellipsis-h"></i>
                                    </button>
                                    <ul class="dropdown-menu">
                                        <li><a class="dropdown-item" href="#" onclick="reportContent(${
                                          item.SharedContentId
                                        })">
                                            <i class="fas fa-flag me-2"></i>דווח כפוגעני
                                        </a></li>
                                        <li><a class="dropdown-item" href="#" onclick="blockUser(${
                                          item.UserId
                                        }, '${item.User?.FirstName} ${
        item.User?.LastName
      }')">
                                            <i class="fas fa-ban me-2"></i>חסום משתמש
                                        </a></li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div class="mt-3">
                                <p class="mb-2">${item.Comment}</p>
                                
                                ${
                                  item.ArticleTitle
                                    ? `
                                    <div class="card mt-3">
                                        <div class="card-body">
                                            <div class="row">
                                                ${
                                                  item.ArticleImageUrl
                                                    ? `
                                                    <div class="col-auto">
                                                        <img src="${item.ArticleImageUrl}" class="rounded" 
                                                             style="width: 100px; height: 80px; object-fit: cover;"
                                                             alt="${item.ArticleTitle}" onerror="this.style.display='none'">
                                                    </div>
                                                `
                                                    : ""
                                                }
                                                <div class="col">
                                                    <h6 class="card-title mb-1">${
                                                      item.ArticleTitle
                                                    }</h6>
                                                    <p class="card-text text-muted small">${truncateText(
                                                      item.ArticleDescription ||
                                                        "",
                                                      100
                                                    )}</p>
                                                    ${
                                                      item.ArticleUrl
                                                        ? `
                                                        <a href="${item.ArticleUrl}" target="_blank" class="btn btn-sm btn-outline-primary">
                                                            <i class="fas fa-external-link-alt me-1"></i>קרא כתבה
                                                        </a>
                                                    `
                                                        : ""
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `
                                    : ""
                                }
                            </div>
                            
                            <div class="mt-3 d-flex justify-content-between align-items-center">
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-outline-primary" onclick="likeContent(${
                                      item.SharedContentId
                                    })">
                                        <i class="fas fa-thumbs-up"></i> <span id="likes-${
                                          item.SharedContentId
                                        }">${item.LikesCount || 0}</span>
                                    </button>
                                    <button class="btn btn-outline-secondary" onclick="toggleComments(${
                                      item.SharedContentId
                                    })">
                                        <i class="fas fa-comments"></i> תגובות
                                    </button>
                                </div>
                                <small class="text-muted">
                                    <i class="fas fa-eye me-1"></i>${
                                      item.ViewsCount || 0
                                    } צפיות
                                </small>
                            </div>
                            
                            <!-- Comments section (initially hidden) -->
                            <div id="comments-${
                              item.SharedContentId
                            }" class="comments-section mt-3" style="display: none;">
                                <div class="comment-box">
                                    <div class="input-group input-group-sm">
                                        <input type="text" class="form-control" placeholder="כתב תגובה..." 
                                               id="comment-input-${
                                                 item.SharedContentId
                                               }">
                                        <button class="btn btn-primary" onclick="addComment(${
                                          item.SharedContentId
                                        })">
                                            <i class="fas fa-paper-plane"></i>
                                        </button>
                                    </div>
                                </div>
                                <div id="comments-list-${
                                  item.SharedContentId
                                }" class="mt-2">
                                    <!-- Comments will be loaded here -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
    )
    .join("");
}

function openShareModal() {
  const modal = new bootstrap.Modal(document.getElementById("shareModal"));
  modal.show();
}

function submitShare() {
  const articleUrl = document.getElementById("articleUrl").value.trim();
  const comment = document.getElementById("shareComment").value.trim();

  if (!articleUrl || !comment) {
    authManager.showAlert("אנא מלא את כל השדות", "warning");
    return;
  }

  if (!isValidUrl(articleUrl)) {
    authManager.showAlert("אנא הזן קישור תקין", "warning");
    return;
  }

  const shareData = {
    UserId: authManager.currentUser.UserId,
    ArticleUrl: articleUrl,
    Comment: comment,
  };

  authManager.makeAuthenticatedRequest(
    "POST",
    SHARED_CONTENT_SERVER_PATH,
    shareData,
    function (response) {
      if (response.success) {
        authManager.showAlert("התוכן שותף בהצלחה!", "success");
        bootstrap.Modal.getInstance(
          document.getElementById("shareModal")
        ).hide();
        document.getElementById("shareForm").reset();
        loadSharedContent();
      } else {
        authManager.showAlert(
          response.message || "שגיאה בשיתוף התוכן",
          "danger"
        );
      }
    },
    function (error) {
      console.error("Error sharing content:", error);
      authManager.showAlert("שגיאה בשיתוף התוכן", "danger");
    }
  );
}

function likeContent(contentId) {
  const likeData = {
    SharedContentId: contentId,
    UserId: authManager.currentUser.UserId,
  };

  authManager.makeAuthenticatedRequest(
    "POST",
    SHARED_CONTENT_SERVER_PATH + "/" + contentId + "/like",
    likeData,
    function (response) {
      if (response.success) {
        // Update likes count
        const likesElement = document.getElementById(`likes-${contentId}`);
        if (likesElement) {
          likesElement.textContent = response.likesCount;
        }
      }
    },
    function (error) {
      console.error("Error liking content:", error);
    }
  );
}

function toggleComments(contentId) {
  const commentsSection = document.getElementById(`comments-${contentId}`);

  if (commentsSection.style.display === "none") {
    commentsSection.style.display = "block";
    loadComments(contentId);
  } else {
    commentsSection.style.display = "none";
  }
}

function loadComments(contentId) {
  authManager.makeAuthenticatedRequest(
    "GET",
    SHARED_CONTENT_SERVER_PATH + "/" + contentId + "/comments",
    null,
    function (response) {
      if (response.success && response.comments) {
        displayComments(contentId, response.comments);
      }
    },
    function (error) {
      console.error("Error loading comments:", error);
    }
  );
}

function displayComments(contentId, comments) {
  const container = document.getElementById(`comments-list-${contentId}`);

  if (comments.length === 0) {
    container.innerHTML = '<p class="text-muted small">אין תגובות עדיין</p>';
    return;
  }

  container.innerHTML = comments
    .map(
      (comment) => `
        <div class="comment">
            <div class="d-flex justify-content-between">
                <strong class="small">${comment.User?.FirstName} ${
        comment.User?.LastName
      }</strong>
                <small class="text-muted">${formatDate(
                  comment.CreatedAt
                )}</small>
            </div>
            <p class="mb-0 small">${comment.CommentText}</p>
        </div>
    `
    )
    .join("");
}

function addComment(contentId) {
  const input = document.getElementById(`comment-input-${contentId}`);
  const commentText = input.value.trim();

  if (!commentText) {
    authManager.showAlert("אנא כתב תגובה", "warning");
    return;
  }

  const commentData = {
    SharedContentId: contentId,
    UserId: authManager.currentUser.UserId,
    CommentText: commentText,
  };

  authManager.makeAuthenticatedRequest(
    "POST",
    SHARED_CONTENT_SERVER_PATH + "/" + contentId + "/comments",
    commentData,
    function (response) {
      if (response.success) {
        input.value = "";
        loadComments(contentId);
      } else {
        authManager.showAlert(
          response.message || "שגיאה בהוספת התגובה",
          "danger"
        );
      }
    },
    function (error) {
      console.error("Error adding comment:", error);
      authManager.showAlert("שגיאה בהוספת התגובה", "danger");
    }
  );
}

function reportContent(contentId) {
  currentContentId = contentId;
  const modal = new bootstrap.Modal(document.getElementById("reportModal"));
  modal.show();
}

function submitReport() {
  const reason = document.getElementById("reportReason").value;
  const description = document.getElementById("reportDescription").value.trim();

  if (!reason) {
    authManager.showAlert("אנא בחר סיבת דיווח", "warning");
    return;
  }

  const reportData = {
    SharedContentId: currentContentId,
    ReportedByUserId: authManager.currentUser.UserId,
    ReportReason: reason,
    ReportDescription: description,
  };

  authManager.makeAuthenticatedRequest(
    "POST",
    SHARED_CONTENT_SERVER_PATH + "/report",
    reportData,
    function (response) {
      if (response.success) {
        authManager.showAlert("הדיווח נשלח בהצלחה", "success");
        bootstrap.Modal.getInstance(
          document.getElementById("reportModal")
        ).hide();
        document.getElementById("reportForm").reset();
      } else {
        authManager.showAlert(
          response.message || "שגיאה בשליחת הדיווח",
          "danger"
        );
      }
    },
    function (error) {
      console.error("Error submitting report:", error);
      authManager.showAlert("שגיאה בשליחת הדיווח", "danger");
    }
  );
}

function openBlockUserModal() {
  const modal = new bootstrap.Modal(document.getElementById("blockUserModal"));
  modal.show();
}

function blockUser(userId, userName) {
  if (!userId) {
    // Called from modal
    userId = document.getElementById("userToBlock").value;
    userName =
      document.getElementById("userToBlock").options[
        document.getElementById("userToBlock").selectedIndex
      ].text;
  }

  if (!userId) {
    authManager.showAlert("אנא בחר משתמש", "warning");
    return;
  }

  if (!confirm(`האם אתה בטוח שברצונך לחסום את ${userName}?`)) {
    return;
  }

  const blockData = {
    BlockedUserId: userId,
    BlockingUserId: authManager.currentUser.UserId,
  };

  authManager.makeAuthenticatedRequest(
    "POST",
    USER_SETTINGS_SERVER_PATH + "/block-user",
    blockData,
    function (response) {
      if (response.success) {
        authManager.showAlert(`המשתמש ${userName} נחסם בהצלחה`, "success");
        loadBlockedUsers();
        loadSharedContent(); // Refresh content

        // Close modal if open
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("blockUserModal")
        );
        if (modal) modal.hide();
      } else {
        authManager.showAlert(
          response.message || "שגיאה בחסימת המשתמש",
          "danger"
        );
      }
    },
    function (error) {
      console.error("Error blocking user:", error);
      authManager.showAlert("שגיאה בחסימת המשתמש", "danger");
    }
  );
}

function unblockUser(userId, userName) {
  if (!confirm(`האם אתה בטוח שברצונך לבטל את החסימה של ${userName}?`)) {
    return;
  }

  authManager.makeAuthenticatedRequest(
    "DELETE",
    USER_SETTINGS_SERVER_PATH + "/block-user/" + userId,
    null,
    function (response) {
      if (response.success) {
        authManager.showAlert(`החסימה של ${userName} בוטלה בהצלחה`, "success");
        loadBlockedUsers();
        loadSharedContent(); // Refresh content
      } else {
        authManager.showAlert(
          response.message || "שגיאה בביטול החסימה",
          "danger"
        );
      }
    },
    function (error) {
      console.error("Error unblocking user:", error);
      authManager.showAlert("שגיאה בביטול החסימה", "danger");
    }
  );
}

function loadBlockedUsers() {
  authManager.makeAuthenticatedRequest(
    "GET",
    USER_SETTINGS_SERVER_PATH +
      "/blocked-users/" +
      authManager.currentUser.UserId,
    null,
    function (response) {
      if (response.success && response.blockedUsers) {
        blockedUsers = response.blockedUsers;
        displayBlockedUsers();
      }
    },
    function (error) {
      console.error("Error loading blocked users:", error);
    }
  );
}

function displayBlockedUsers() {
  const container = document.getElementById("blockedUsers");

  if (blockedUsers.length === 0) {
    container.innerHTML = '<p class="text-muted small">אין משתמשים חסומים</p>';
    return;
  }

  container.innerHTML = blockedUsers
    .map(
      (user) => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <small>${user.FirstName} ${user.LastName}</small>
            <button class="btn btn-sm btn-outline-secondary" onclick="unblockUser(${user.UserId}, '${user.FirstName} ${user.LastName}')">
                בטל חסימה
            </button>
        </div>
    `
    )
    .join("");
}

function loadUsers() {
  authManager.makeAuthenticatedRequest(
    "GET",
    USERS_SERVER_PATH,
    null,
    function (response) {
      if (response.success && response.users) {
        populateUserFilters(response.users);
      }
    },
    function (error) {
      console.error("Error loading users:", error);
    }
  );
}

function populateUserFilters(users) {
  const userFilter = document.getElementById("userFilter");
  const userToBlock = document.getElementById("userToBlock");

  // Filter out current user and blocked users
  const availableUsers = users.filter(
    (user) =>
      user.UserId !== authManager.currentUser.UserId &&
      !blockedUsers.some((blocked) => blocked.UserId === user.UserId)
  );

  if (userFilter) {
    availableUsers.forEach((user) => {
      const option = document.createElement("option");
      option.value = user.UserId;
      option.textContent = `${user.FirstName} ${user.LastName}`;
      userFilter.appendChild(option);
    });
  }

  if (userToBlock) {
    userToBlock.innerHTML = '<option value="">בחר משתמש...</option>';
    availableUsers.forEach((user) => {
      const option = document.createElement("option");
      option.value = user.UserId;
      option.textContent = `${user.FirstName} ${user.LastName}`;
      userToBlock.appendChild(option);
    });
  }
}

function filterSharedContent() {
  const searchTerm =
    document.getElementById("searchInput")?.value.toLowerCase() || "";
  const userFilter = document.getElementById("userFilter")?.value || "";

  let filteredContent = currentSharedContent;

  // Apply search filter
  if (searchTerm) {
    filteredContent = filteredContent.filter(
      (item) =>
        (item.Comment && item.Comment.toLowerCase().includes(searchTerm)) ||
        (item.ArticleTitle &&
          item.ArticleTitle.toLowerCase().includes(searchTerm))
    );
  }

  // Apply user filter
  if (userFilter) {
    filteredContent = filteredContent.filter(
      (item) => item.UserId == userFilter
    );
  }

  displaySharedContent(filteredContent);
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
  loadSharedContent();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showNoContentMessage() {
  const container = document.getElementById("sharedContentContainer");
  container.innerHTML = `
        <div class="text-center py-5">
            <i class="fas fa-share-alt fa-3x text-muted mb-3"></i>
            <h5 class="text-muted">אין תוכן משותף</h5>
            <p class="text-muted">היה הראשון לשתף תוכן מעניין!</p>
            <button class="btn btn-primary" onclick="openShareModal()">שתף תוכן</button>
        </div>
    `;
}

function showErrorMessage() {
  const container = document.getElementById("sharedContentContainer");
  container.innerHTML = `
        <div class="text-center py-5">
            <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
            <h5 class="text-warning">שגיאה בטעינת התוכן</h5>
            <p class="text-muted">לא ניתן לטעון את התוכן כרגע</p>
            <button class="btn btn-primary" onclick="loadSharedContent()">נסה שוב</button>
        </div>
    `;
}

// Utility functions
function getUserInitials(firstName, lastName) {
  const first = firstName ? firstName.charAt(0).toUpperCase() : "";
  const last = lastName ? lastName.charAt(0).toUpperCase() : "";
  return first + last || "U";
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

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
