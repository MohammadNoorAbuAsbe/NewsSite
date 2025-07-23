// Admin Panel functionality
let currentUsers = [];
let currentReports = [];
let charts = {};

document.addEventListener("DOMContentLoaded", function () {
  // Check admin authentication
  if (!authManager.requireAdmin()) return;

  // Initialize page
  authManager.updateUI();
  loadDashboard();
  setupEventListeners();
});

function setupEventListeners() {
  // User search
  const userSearch = document.getElementById("userSearch");
  if (userSearch) {
    let searchTimeout;
    userSearch.addEventListener("input", function () {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        filterUsers();
      }, 500);
    });
  }

  // User status filter
  const userStatusFilter = document.getElementById("userStatusFilter");
  if (userStatusFilter) {
    userStatusFilter.addEventListener("change", filterUsers);
  }
}

function showSection(sectionName) {
  // Hide all sections
  document.querySelectorAll(".admin-section").forEach((section) => {
    section.style.display = "none";
  });

  // Show selected section
  document.getElementById(sectionName).style.display = "block";

  // Update navigation
  document.querySelectorAll(".list-group-item").forEach((item) => {
    item.classList.remove("active");
  });
  event.target.classList.add("active");

  // Load section-specific data
  switch (sectionName) {
    case "dashboard":
      loadDashboard();
      break;
    case "users":
      loadUsers();
      break;
    case "reports":
      loadReports();
      break;
    case "statistics":
      loadStatistics();
      break;
  }
}

function loadDashboard() {
  loadStatsSummary();
  loadRecentActivity();
}

function loadStatsSummary() {
  authManager.makeAuthenticatedRequest(
    "GET",
    ADMIN_SERVER_PATH + "/stats/summary",
    null,
    function (response) {
      if (response.success) {
        document.getElementById("totalUsers").textContent =
          response.totalUsers || 0;
        document.getElementById("dailyLogins").textContent =
          response.dailyLogins || 0;
        document.getElementById("dailyNewsViews").textContent =
          response.dailyNewsViews || 0;
        document.getElementById("dailySavedArticles").textContent =
          response.dailySavedArticles || 0;
      }
    },
    function (error) {
      console.error("Error loading stats summary:", error);
    }
  );
}

function loadRecentActivity() {
  authManager.makeAuthenticatedRequest(
    "GET",
    ADMIN_SERVER_PATH + "/activity/recent",
    null,
    function (response) {
      if (response.success && response.activities) {
        displayRecentActivity(response.activities);
      }
    },
    function (error) {
      console.error("Error loading recent activity:", error);
      document.getElementById("recentActivity").innerHTML = `
                <p class="text-muted">לא ניתן לטעון פעילות אחרונה</p>
            `;
    }
  );
}

function displayRecentActivity(activities) {
  const container = document.getElementById("recentActivity");

  if (!activities || activities.length === 0) {
    container.innerHTML = '<p class="text-muted">אין פעילות אחרונה</p>';
    return;
  }

  container.innerHTML = activities
    .map(
      (activity) => `
        <div class="d-flex justify-content-between align-items-center border-bottom py-2">
            <div>
                <small class="fw-bold">${getActivityDescription(
                  activity
                )}</small>
                <br>
                <small class="text-muted">${
                  activity.UserName || "משתמש לא ידוע"
                }</small>
            </div>
            <small class="text-muted">${formatDate(activity.Timestamp)}</small>
        </div>
    `
    )
    .join("");
}

function getActivityDescription(activity) {
  switch (activity.ActivityType) {
    case "user_registration":
      return "משתמש חדש נרשם";
    case "user_login":
      return "משתמש התחבר";
    case "article_saved":
      return "כתבה נשמרה";
    case "content_shared":
      return "תוכן שותף";
    case "content_reported":
      return "תוכן דווח";
    default:
      return activity.ActivityType || "פעילות";
  }
}

function loadUsers() {
  authManager.makeAuthenticatedRequest(
    "GET",
    ADMIN_SERVER_PATH + "/users",
    null,
    function (response) {
      if (response.success && response.users) {
        currentUsers = response.users;
        displayUsers(currentUsers);
      }
    },
    function (error) {
      console.error("Error loading users:", error);
      showUsersError();
    }
  );
}

function displayUsers(users) {
  const container = document.getElementById("usersContainer");

  if (!users || users.length === 0) {
    container.innerHTML = '<p class="text-muted">אין משתמשים</p>';
    return;
  }

  container.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>שם</th>
                        <th>אימייל</th>
                        <th>תאריך רישום</th>
                        <th>סטטוס</th>
                        <th>פעילות אחרונה</th>
                        <th>פעולות</th>
                    </tr>
                </thead>
                <tbody>
                    ${users
                      .map(
                        (user) => `
                        <tr>
                            <td>
                                <div class="d-flex align-items-center">
                                    <div class="user-avatar me-2" style="width: 32px; height: 32px; font-size: 0.8rem;">
                                        ${getUserInitials(
                                          user.FirstName,
                                          user.LastName
                                        )}
                                    </div>
                                    ${user.FirstName} ${user.LastName}
                                </div>
                            </td>
                            <td>${user.Email}</td>
                            <td>${formatDate(user.CreatedAt)}</td>
                            <td>
                                <span class="user-status ${
                                  user.IsLocked ? "locked" : "active"
                                }">
                                    ${user.IsLocked ? "נעול" : "פעיל"}
                                </span>
                            </td>
                            <td>${formatDate(user.LastLoginAt)}</td>
                            <td>
                                <div class="btn-group btn-group-sm">
                                    <button class="btn ${
                                      user.IsLocked
                                        ? "btn-success"
                                        : "btn-warning"
                                    }" 
                                            onclick="toggleUserLock(${
                                              user.UserId
                                            }, '${user.FirstName} ${
                          user.LastName
                        }', ${user.IsLocked})">
                                        <i class="fas ${
                                          user.IsLocked
                                            ? "fa-unlock"
                                            : "fa-lock"
                                        }"></i>
                                        ${user.IsLocked ? "שחרר" : "נעל"}
                                    </button>
                                    <button class="btn btn-info" onclick="viewUserDetails(${
                                      user.UserId
                                    })">
                                        <i class="fas fa-eye"></i> פרטים
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>
        </div>
    `;
}

function toggleUserLock(userId, userName, isCurrentlyLocked) {
  const action = isCurrentlyLocked ? "שחרור" : "נעילת";
  const actionText = isCurrentlyLocked ? "לשחרר" : "לנעול";

  document.getElementById("userActionTitle").textContent = `${action} משתמש`;
  document.getElementById(
    "userActionMessage"
  ).textContent = `האם אתה בטוח שברצונך ${actionText} את ${userName}?`;

  document.getElementById("confirmUserAction").onclick = function () {
    performUserAction(userId, isCurrentlyLocked ? "unlock" : "lock");
    bootstrap.Modal.getInstance(
      document.getElementById("userActionModal")
    ).hide();
  };

  const modal = new bootstrap.Modal(document.getElementById("userActionModal"));
  modal.show();
}

function performUserAction(userId, action) {
  const endpoint = action === "lock" ? "lock" : "unlock";

  authManager.makeAuthenticatedRequest(
    "PUT",
    `${ADMIN_SERVER_PATH}/users/${userId}/${endpoint}`,
    null,
    function (response) {
      if (response.success) {
        authManager.showAlert(
          `המשתמש ${action === "lock" ? "ננעל" : "שוחרר"} בהצלחה`,
          "success"
        );
        loadUsers(); // Refresh users list
      } else {
        authManager.showAlert(
          response.message || "שגיאה בביצוע הפעולה",
          "danger"
        );
      }
    },
    function (error) {
      console.error("Error performing user action:", error);
      authManager.showAlert("שגיאה בביצוע הפעולה", "danger");
    }
  );
}

function viewUserDetails(userId) {
  authManager.makeAuthenticatedRequest(
    "GET",
    `${ADMIN_SERVER_PATH}/users/${userId}/details`,
    null,
    function (response) {
      if (response.success && response.user) {
        displayUserDetails(response.user);
      }
    },
    function (error) {
      console.error("Error loading user details:", error);
      authManager.showAlert("שגיאה בטעינת פרטי המשתמש", "danger");
    }
  );
}

function displayUserDetails(user) {
  // Create a modal or update existing content to show user details
  authManager.showAlert(
    `פרטי משתמש: ${user.FirstName} ${user.LastName}`,
    "info"
  );
  // TODO: Implement detailed user view
}

function filterUsers() {
  const searchTerm =
    document.getElementById("userSearch")?.value.toLowerCase() || "";
  const statusFilter = document.getElementById("userStatusFilter")?.value || "";

  let filteredUsers = currentUsers;

  // Apply search filter
  if (searchTerm) {
    filteredUsers = filteredUsers.filter(
      (user) =>
        (user.FirstName && user.FirstName.toLowerCase().includes(searchTerm)) ||
        (user.LastName && user.LastName.toLowerCase().includes(searchTerm)) ||
        (user.Email && user.Email.toLowerCase().includes(searchTerm))
    );
  }

  // Apply status filter
  if (statusFilter) {
    if (statusFilter === "active") {
      filteredUsers = filteredUsers.filter((user) => !user.IsLocked);
    } else if (statusFilter === "locked") {
      filteredUsers = filteredUsers.filter((user) => user.IsLocked);
    }
  }

  displayUsers(filteredUsers);
}

function refreshUsers() {
  loadUsers();
  authManager.showAlert("רשימת המשתמשים רועננה", "success");
}

function exportUsers() {
  // Create CSV content
  const csvContent =
    "data:text/csv;charset=utf-8," +
    "שם פרטי,שם משפחה,אימייל,תאריך רישום,סטטוס\n" +
    currentUsers
      .map((user) => {
        return `"${user.FirstName}","${user.LastName}","${
          user.Email
        }","${formatDate(user.CreatedAt)}","${
          user.IsLocked ? "נעול" : "פעיל"
        }"`;
      })
      .join("\n");

  // Create download link
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "users.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  authManager.showAlert("רשימת המשתמשים יוצאה בהצלחה", "success");
}

function loadReports() {
  authManager.makeAuthenticatedRequest(
    "GET",
    ADMIN_SERVER_PATH + "/reports",
    null,
    function (response) {
      if (response.success && response.reports) {
        currentReports = response.reports;
        displayReports(currentReports);
      }
    },
    function (error) {
      console.error("Error loading reports:", error);
      showReportsError();
    }
  );
}

function displayReports(reports) {
  const container = document.getElementById("reportsContainer");

  if (!reports || reports.length === 0) {
    container.innerHTML = '<p class="text-muted">אין דיווחים</p>';
    return;
  }

  container.innerHTML = reports
    .map(
      (report) => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-8">
                        <h6 class="card-title">דיווח על תוכן פוגעני</h6>
                        <p class="card-text"><strong>סיבה:</strong> ${getReportReasonText(
                          report.ReportReason
                        )}</p>
                        ${
                          report.ReportDescription
                            ? `<p class="card-text"><strong>תיאור:</strong> ${report.ReportDescription}</p>`
                            : ""
                        }
                        <p class="card-text">
                            <small class="text-muted">
                                דווח על ידי: ${report.ReporterName} | 
                                תאריך: ${formatDate(report.ReportedAt)}
                            </small>
                        </p>
                    </div>
                    <div class="col-md-4 text-end">
                        <div class="btn-group-vertical">
                            <button class="btn btn-sm btn-primary" onclick="viewReportedContent(${
                              report.ReportId
                            })">
                                צפה בתוכן
                            </button>
                            <button class="btn btn-sm btn-success" onclick="resolveReport(${
                              report.ReportId
                            }, 'approved')">
                                אשר דיווח
                            </button>
                            <button class="btn btn-sm btn-secondary" onclick="resolveReport(${
                              report.ReportId
                            }, 'rejected')">
                                דחה דיווח
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
    )
    .join("");
}

function getReportReasonText(reason) {
  const reasons = {
    spam: "ספאם",
    harassment: "הטרדה",
    hate_speech: "דברי שטנה",
    fake_news: "חדשות מזויפות",
    inappropriate: "תוכן לא הולם",
    other: "אחר",
  };
  return reasons[reason] || reason;
}

function viewReportedContent(reportId) {
  // TODO: Implement view reported content
  authManager.showAlert("צפייה בתוכן המדווח תהיה זמינה בקרוב", "info");
}

function resolveReport(reportId, action) {
  const actionText = action === "approved" ? "אישור" : "דחיה";

  if (!confirm(`האם אתה בטוח ב${actionText} הדיווח?`)) {
    return;
  }

  authManager.makeAuthenticatedRequest(
    "PUT",
    `${ADMIN_SERVER_PATH}/reports/${reportId}/resolve`,
    { action },
    function (response) {
      if (response.success) {
        authManager.showAlert(
          `הדיווח ${action === "approved" ? "אושר" : "נדחה"} בהצלחה`,
          "success"
        );
        loadReports(); // Refresh reports
      } else {
        authManager.showAlert(
          response.message || "שגיאה בטיפול בדיווח",
          "danger"
        );
      }
    },
    function (error) {
      console.error("Error resolving report:", error);
      authManager.showAlert("שגיאה בטיפול בדיווח", "danger");
    }
  );
}

function loadStatistics() {
  loadDailyStatsChart();
  loadUserStatsChart();
}

function loadDailyStatsChart() {
  authManager.makeAuthenticatedRequest(
    "GET",
    ADMIN_SERVER_PATH + "/stats/daily",
    null,
    function (response) {
      if (response.success && response.stats) {
        createDailyStatsChart(response.stats);
      }
    },
    function (error) {
      console.error("Error loading daily stats:", error);
    }
  );
}

function loadUserStatsChart() {
  authManager.makeAuthenticatedRequest(
    "GET",
    ADMIN_SERVER_PATH + "/stats/users",
    null,
    function (response) {
      if (response.success && response.stats) {
        createUserStatsChart(response.stats);
      }
    },
    function (error) {
      console.error("Error loading user stats:", error);
    }
  );
}

function createDailyStatsChart(data) {
  const ctx = document.getElementById("dailyStatsChart");
  if (!ctx) return;

  if (charts.dailyStats) {
    charts.dailyStats.destroy();
  }

  charts.dailyStats = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.labels || [],
      datasets: [
        {
          label: "כניסות יומיות",
          data: data.logins || [],
          borderColor: "rgb(75, 192, 192)",
          tension: 0.1,
        },
        {
          label: "כתבות נשמרו",
          data: data.savedArticles || [],
          borderColor: "rgb(255, 99, 132)",
          tension: 0.1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "סטטיסטיקות יומיות",
        },
      },
    },
  });
}

function createUserStatsChart(data) {
  const ctx = document.getElementById("userStatsChart");
  if (!ctx) return;

  if (charts.userStats) {
    charts.userStats.destroy();
  }

  charts.userStats = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["משתמשים פעילים", "משתמשים נעולים"],
      datasets: [
        {
          data: [data.activeUsers || 0, data.lockedUsers || 0],
          backgroundColor: ["rgb(75, 192, 192)", "rgb(255, 99, 132)"],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "התפלגות משתמשים",
        },
      },
    },
  });
}

function showUsersError() {
  const container = document.getElementById("usersContainer");
  container.innerHTML = `
        <div class="text-center py-5">
            <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
            <h5 class="text-warning">שגיאה בטעינת המשתמשים</h5>
            <button class="btn btn-primary" onclick="loadUsers()">נסה שוב</button>
        </div>
    `;
}

function showReportsError() {
  const container = document.getElementById("reportsContainer");
  container.innerHTML = `
        <div class="text-center py-5">
            <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
            <h5 class="text-warning">שגיאה בטעינת הדיווחים</h5>
            <button class="btn btn-primary" onclick="loadReports()">נסה שוב</button>
        </div>
    `;
}

// Utility functions
function getUserInitials(firstName, lastName) {
  const first = firstName ? firstName.charAt(0).toUpperCase() : "";
  const last = lastName ? lastName.charAt(0).toUpperCase() : "";
  return first + last || "U";
}

function formatDate(dateString) {
  if (!dateString) return "תאריך לא זמין";

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("he-IL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "תאריך לא זמין";
  }
}
