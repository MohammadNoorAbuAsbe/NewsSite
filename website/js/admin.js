// Admin Panel functionality
let currentUsers = [];
let currentReports = [];
let charts = {};

$(document).ready(function () {
  // Check admin authentication
  if (!authManager.requireAdmin()) return;

  // Initialize page
  authManager.updateUI();
  loadDashboard();
  setupEventListeners();
});

function setupEventListeners() {
  // User search
  const $userSearch = $("#userSearch");
  if ($userSearch.length) {
    let searchTimeout;
    $userSearch.on("input", function () {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        filterUsers();
      }, 500);
    });
  }

  // User status filter
  const $userStatusFilter = $("#userStatusFilter");
  if ($userStatusFilter.length) {
    $userStatusFilter.on("change", filterUsers);
  }
}

function showSection(sectionName) {
  // Hide all sections
  $(".admin-section").hide();

  // Show selected section
  $("#" + sectionName).show();

  // Update navigation
  $(".list-group-item").removeClass("active");
  $(event.target).addClass("active");

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
  authenticatedFetch(ADMIN_SERVER_PATH + "/stats/summary", {
    method: "GET",
  })
    .then((response) => {
      if (!response) return; // Handle case where user was logged out due to invalid token
      return response.json();
    })
    .then((data) => {
      if (data && data.success) {
        $("#totalUsers").text(data.totalUsers || 0);
        $("#dailyLogins").text(data.dailyLogins || 0);
        $("#dailyNewsViews").text(data.dailyNewsViews || 0);
        $("#dailySavedArticles").text(data.dailySavedArticles || 0);
      }
    })
    .catch((error) => {
      console.error("Error loading stats summary:", error);
      // Set default values if API fails
      $("#totalUsers").text(0);
      $("#dailyLogins").text(0);
      $("#dailyNewsViews").text(0);
      $("#dailySavedArticles").text(0);
    });
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
      $("#recentActivity").html(`
                <p class="text-muted">לא ניתן לטעון פעילות אחרונה</p>
            `);
    }
  );
}

function displayRecentActivity(activities) {
  const $container = $("#recentActivity");

  if (!activities || activities.length === 0) {
    $container.html('<p class="text-muted">אין פעילות אחרונה</p>');
    return;
  }

  $container.html(
    activities
      .map(
        (activity) => `
        <div class="d-flex justify-content-between align-items-center border-bottom py-2">
            <div>
                <small class="fw-bold">${getActivityDescription(
                  activity
                )}</small>
                <br>
                <small class="text-muted">${
                  activity.userName || "משתמש לא ידוע"
                }</small>
            </div>
            <small class="text-muted">${formatDate(activity.timestamp)}</small>
        </div>
    `
      )
      .join("")
  );
}

function getActivityDescription(activity) {
  switch (activity.activityType) {
    case "login":
      return "משתמש התחבר";
    case "save_article":
      return "כתבה נשמרה";
    case "user_registration":
      return "משתמש חדש נרשם";
    case "news_request":
      return "בקשה לחדשות";
    case "content_shared":
      return "תוכן שותף";
    case "content_reported":
      return "תוכן דווח";
    default:
      return activity.activityType || "פעילות";
  }
}

function loadUsers() {
  authManager.makeAuthenticatedRequest(
    "GET",
    ADMIN_SERVER_PATH + "/users",
    null,
    function (response) {
      // The API returns the users array directly, not wrapped in a success object
      if (Array.isArray(response)) {
        currentUsers = response;
        if (currentUsers.length > 0) {
        }
        displayUsers(currentUsers);
      } else {
        console.error("Expected array response, got:", response);
        showUsersError();
      }
    },
    function (error) {
      console.error("Error loading users:", error);
      showUsersError();
    }
  );
}

function displayUsers(users) {
  const $container = $("#usersContainer");

  if (!users || users.length === 0) {
    $container.html('<p class="text-muted">אין משתמשים</p>');
    return;
  }

  $container.html(`
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>שם</th>
                        <th>אימייל</th>
                        <th>תפקיד</th>
                        <th>סטטוס</th>
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
                                          user.name || user.Name
                                        )}
                                    </div>
                                    ${user.name || user.Name}
                                </div>
                            </td>
                            <td>${user.email || user.Email}</td>
                            <td>
                                <span class="badge ${
                                  user.isAdmin ?? user.IsAdmin
                                    ? "bg-primary"
                                    : "bg-secondary"
                                }">
                                    ${
                                      user.isAdmin ?? user.IsAdmin
                                        ? "מנהל"
                                        : "משתמש"
                                    }
                                </span>
                            </td>
                            <td>
                                <span class="user-status ${
                                  user.isEnabled ?? user.IsEnabled
                                    ? "active"
                                    : "locked"
                                }">
                                    ${
                                      user.isEnabled ?? user.IsEnabled
                                        ? "פעיל"
                                        : "נעול"
                                    }
                                </span>
                            </td>
                            <td>
                                <div class="btn-group btn-group-sm">
                                    <button class="btn ${
                                      user.isEnabled ?? user.IsEnabled
                                        ? "btn-warning"
                                        : "btn-success"
                                    }" 
                                            onclick="toggleUserLock(${
                                              user.id || user.Id
                                            }, '${user.name || user.Name}', ${!(
                          user.isEnabled ?? user.IsEnabled
                        )})">
                                        <i class="fas ${
                                          user.isEnabled ?? user.IsEnabled
                                            ? "fa-lock"
                                            : "fa-unlock"
                                        }"></i>
                                        ${
                                          user.isEnabled ?? user.IsEnabled
                                            ? "נעל"
                                            : "בטל נעילה"
                                        }
                                    </button>
                                </div>
                            </td>
                        </tr>`
                      )
                      .join("")}
                </tbody>
            </table>
        </div>
    `);
}

function toggleUserLock(userId, userName, isCurrentlyLocked) {
  const action = isCurrentlyLocked ? "שחרור" : "נעילת";
  const actionText = isCurrentlyLocked ? "לשחרר" : "לנעול";

  $("#userActionTitle").text(`${action} משתמש`);
  $("#userActionMessage").text(
    `האם אתה בטוח שברצונך ${actionText} את ${userName}?`
  );

  $("#confirmUserAction")
    .off("click")
    .on("click", function () {
      performUserAction(userId, isCurrentlyLocked ? "unlock" : "lock");
      bootstrap.Modal.getInstance($("#userActionModal")[0]).hide();
    });

  const modal = new bootstrap.Modal($("#userActionModal")[0]);
  modal.show();
}

function performUserAction(userId, action) {
  // Use the correct server endpoint: PUT /api/Admin/users/{userId}/status
  const requestData = {
    IsEnabled: action === "unlock", // true for unlock (enable), false for lock (disable)
  };

  authManager.makeAuthenticatedRequest(
    "PUT",
    `${ADMIN_SERVER_PATH}/users/${userId}/status`,
    requestData,
    function (response) {
      if (response.success || response.message) {
        authManager.showAlert(
          response.message ||
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
  const searchTerm = $("#userSearch").val()?.toLowerCase() || "";
  const statusFilter = $("#userStatusFilter").val() || "";

  let filteredUsers = currentUsers;

  // Apply search filter - handle both PascalCase and camelCase
  if (searchTerm) {
    filteredUsers = filteredUsers.filter(
      (user) =>
        ((user.name || user.Name) &&
          (user.name || user.Name).toLowerCase().includes(searchTerm)) ||
        ((user.email || user.Email) &&
          (user.email || user.Email).toLowerCase().includes(searchTerm))
    );
  }

  // Apply status filter - handle both PascalCase and camelCase
  if (statusFilter) {
    if (statusFilter === "active") {
      filteredUsers = filteredUsers.filter(
        (user) => (user.isEnabled ?? user.IsEnabled) === true
      );
    } else if (statusFilter === "locked") {
      filteredUsers = filteredUsers.filter(
        (user) => (user.isEnabled ?? user.IsEnabled) === false
      );
    }
  }

  displayUsers(filteredUsers);
}

function refreshUsers() {
  loadUsers();
  authManager.showAlert("רשימת המשתמשים רועננה", "success");
}

function exportUsers() {
  // Create CSV content with BOM for Hebrew support
  const BOM = "\uFEFF";
  const headers = "Name,Email,Role,Status\n";
  const csvData = currentUsers
    .map((user) => {
      const name = user.name || user.Name || "";
      const email = user.email || user.Email || "";
      const role = user.isAdmin ?? user.IsAdmin ? "Admin" : "User";
      const status = user.isEnabled ?? user.IsEnabled ? "Active" : "Locked";

      return `"${name}","${email}","${role}","${status}"`;
    })
    .join("\n");

  const csvContent = BOM + headers + csvData;

  // Create blob with proper encoding
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  // Create download link
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "users.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);

  authManager.showAlert("רשימת המשתמשים יוצאה בהצלחה", "success");
}

function loadReports() {
  authManager.makeAuthenticatedRequest(
    "GET",
    ADMIN_SERVER_PATH + "/reported-content",
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
  const $container = $("#reportsContainer");

  if (!reports || reports.length === 0) {
    $container.html('<p class="text-muted">אין דיווחים</p>');
    return;
  }

  $container.html(
    reports
      .map(
        (report) => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-8">
                        <h6 class="card-title">תוכן משותף מדווח</h6>
                        
                        ${
                          report.article && report.article.title
                            ? `
                        <div class="mb-3">
                            <h6 class="text-primary">${
                              report.article.title
                            }</h6>
                            ${
                              report.article.description
                                ? `<p class="text-muted small">${report.article.description}</p>`
                                : ""
                            }
                            ${
                              report.article.urlToImage
                                ? `
                            <img src="${report.article.urlToImage}" class="img-thumbnail" style="max-width: 200px; max-height: 120px;" onerror="this.style.display='none'">
                            `
                                : ""
                            }
                            ${
                              report.article.publishedAt
                                ? `<p class="small text-muted">תאריך פרסום: ${formatDate(
                                    report.article.publishedAt
                                  )}</p>`
                                : ""
                            }
                            ${
                              report.article.source &&
                              report.article.source.name
                                ? `<p class="small text-muted">מקור: ${report.article.source.name}</p>`
                                : ""
                            }
                        </div>
                        `
                            : ""
                        }
                        
                        <div class="mb-2">
                            <strong>תגובת המשתמש:</strong> 
                            <p class="border p-2 bg-light">${
                              report.userComment || "אין תגובה"
                            }</p>
                        </div>
                        
                        <p class="card-text"><strong>פורסם על ידי:</strong> ${
                          report.userName || "משתמש לא ידוע"
                        }</p>
                        
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">תאריך שיתוף: ${formatDate(
                              report.sharedAt
                            )}</small>
                            <div class="text-muted small">
                                <span class="me-2">👍 ${
                                  report.likesCount || 0
                                }</span>
                                <span>👎 ${report.dislikesCount || 0}</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 text-end">
                        <div class="btn-group-vertical">
                            ${
                              report.article && report.article.url
                                ? `
                            <a href="${report.article.url}" target="_blank" class="btn btn-sm btn-outline-primary mb-2">
                                צפה בכתבה המקורית
                            </a>
                            `
                                : ""
                            }
                            <button class="btn btn-sm btn-success mb-2" onclick="resolveReport(${
                              report.id
                            }, false)">
                                השאר תוכן
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="resolveReport(${
                              report.id
                            }, true)">
                                הסר תוכן
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
      )
      .join("")
  );
}

function viewReportedContent(reportId) {
  // TODO: Implement view reported content
  authManager.showAlert("צפייה בתוכן המדווח תהיה זמינה בקרוב", "info");
}

function resolveReport(contentId, removeContent) {
  const actionText = removeContent ? "הסרת התוכן" : "השארת התוכן";

  if (!confirm(`האם אתה בטוח ב${actionText}?`)) {
    return;
  }

  authManager.makeAuthenticatedRequest(
    "PUT",
    `${ADMIN_SERVER_PATH}/reported-content/${contentId}/handle`,
    { RemoveContent: removeContent },
    function (response) {
      if (response.success || response.message) {
        authManager.showAlert(
          `הדיווח טופל בהצלחה - ${removeContent ? "התוכן הוסר" : "התוכן נשאר"}`,
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
  loadWeeklyTrends();
  loadUserStatsChart();
}

function loadWeeklyTrends() {
  // Get data for the last 7 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 7);

  const fromDate = startDate.toISOString().split("T")[0];
  const toDate = endDate.toISOString().split("T")[0];

  authManager.makeAuthenticatedRequest(
    "GET",
    ADMIN_SERVER_PATH +
      "/stats/range?fromDate=" +
      fromDate +
      "&toDate=" +
      toDate,
    null,
    function (response) {
      if (Array.isArray(response) && response.length > 0) {
        createWeeklyTrendsChart(response);
      } else {
        console.warn("No data in range, trying today's stats");
        // Fallback: load today's stats and create a single-day chart
        loadTodaysStatsForChart();
      }
    },
    function (error) {
      console.error("Error loading weekly trends:", error);
      // Show empty chart on error
      createWeeklyTrendsChart([]);
    }
  );
}

function loadTodaysStatsForChart() {
  const today = new Date().toISOString().split("T")[0];

  authManager.makeAuthenticatedRequest(
    "GET",
    ADMIN_SERVER_PATH + "/stats/daily?date=" + today,
    null,
    function (response) {
      if (response) {
        // The /stats/daily endpoint returns the AdminStats object directly with PascalCase
        const todayData = [
          {
            Date: today,
            DailyLogins: response.DailyLogins || 0,
            DailyNewsRequests: response.DailyNewsRequests || 0,
            DailySavedArticles: response.DailySavedArticles || 0,
          },
        ];
        createWeeklyTrendsChart(todayData);
      } else {
        // Show empty chart
        createWeeklyTrendsChart([]);
      }
    },
    function (error) {
      console.error("Error loading today's stats:", error);
      createWeeklyTrendsChart([]);
    }
  );
}

function createWeeklyTrendsChart(data) {
  const ctx = $("#dailyStatsChart")[0];
  if (!ctx) return;

  if (charts.dailyStats) {
    charts.dailyStats.destroy();
  }

  // Log the first item to see the exact structure
  if (data && data.length > 0) {
  }

  // Check if data is empty
  if (!data || data.length === 0) {
    // Create an empty chart with a message
    charts.dailyStats = new Chart(ctx, {
      type: "line",
      data: {
        labels: ["אין נתונים"],
        datasets: [
          {
            label: "אין נתונים להצגה",
            data: [0],
            borderColor: "rgba(128, 128, 128, 0.5)",
            backgroundColor: "rgba(128, 128, 128, 0.1)",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: "מגמות שימוש שבועיות - אין נתונים זמינים",
          },
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 1,
            title: {
              display: true,
              text: "כמות",
            },
          },
        },
      },
    });
    return;
  }

  // Process data for the chart with better date handling
  const labels = data.map((d) => {
    try {
      // Handle different date formats
      let date;
      if (d.Date) {
        // Try to parse the date - handle both ISO string and SQL datetime formats
        date = new Date(d.Date);

        // Check if date is valid
        if (isNaN(date.getTime())) {
          // Try parsing as SQL date format (YYYY-MM-DD)
          const dateStr = d.Date.toString().split("T")[0];
          date = new Date(dateStr);
        }
      } else {
        date = new Date();
      }

      // Verify the date is valid
      if (isNaN(date.getTime())) {
        console.warn("Invalid date found:", d.Date);
        return "תאריך לא תקין";
      }

      return date.toLocaleDateString("he-IL", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error parsing date:", d.Date, error);
      return "תאריך לא תקין";
    }
  });

  // Handle both PascalCase and camelCase property names
  const loginsData = data.map((d) => d.DailyLogins || d.dailyLogins || 0);
  const newsRequestsData = data.map(
    (d) => d.DailyNewsRequests || d.dailyNewsRequests || 0
  );
  const savedArticlesData = data.map(
    (d) => d.DailySavedArticles || d.dailySavedArticles || 0
  );

  charts.dailyStats = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "כניסות יומיות",
          data: loginsData,
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.1,
          fill: true,
        },
        {
          label: "בקשות חדשות",
          data: newsRequestsData,
          borderColor: "rgb(54, 162, 235)",
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          tension: 0.1,
          fill: true,
        },
        {
          label: "כתבות נשמרו",
          data: savedArticlesData,
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          tension: 0.1,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "מגמות שימוש שבועיות",
        },
        legend: {
          display: true,
          position: "top",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "כמות",
          },
        },
        x: {
          title: {
            display: true,
            text: "תאריך",
          },
        },
      },
      interaction: {
        intersect: false,
        mode: "index",
      },
    },
  });
}

function loadDailyStatsChart() {
  // This function now calls loadWeeklyTrends instead
  loadWeeklyTrends();
}

function loadUserStatsChart() {
  authManager.makeAuthenticatedRequest(
    "GET",
    ADMIN_SERVER_PATH + "/users",
    null,
    function (response) {
      if (Array.isArray(response)) {
        createUserStatsChart(response);
      }
    },
    function (error) {
      console.error("Error loading user stats:", error);
    }
  );
}

function createUserStatsChart(users) {
  const ctx = $("#userStatsChart")[0];
  if (!ctx) return;

  if (charts.userStats) {
    charts.userStats.destroy();
  }

  // Process user data for statistics - handle both PascalCase and camelCase
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.IsEnabled ?? u.isEnabled).length;
  const adminUsers = users.filter((u) => u.IsAdmin ?? u.isAdmin).length;
  const inactiveUsers = totalUsers - activeUsers;
  const regularActiveUsers = activeUsers - adminUsers;

  charts.userStats = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["משתמשים פעילים", "משתמשים לא פעילים", "מנהלים"],
      datasets: [
        {
          data: [regularActiveUsers, inactiveUsers, adminUsers],
          backgroundColor: [
            "rgba(75, 192, 192, 0.8)",
            "rgba(255, 99, 132, 0.8)",
            "rgba(255, 206, 86, 0.8)",
          ],
          borderColor: [
            "rgba(75, 192, 192, 1)",
            "rgba(255, 99, 132, 1)",
            "rgba(255, 206, 86, 1)",
          ],
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: `סטטיסטיקות משתמשים (סה"כ ${totalUsers})`,
        },
        legend: {
          display: true,
          position: "bottom",
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.parsed;
              const percentage = ((value / totalUsers) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
    },
  });

  // Update the details section
  updateUserStatsDetails(totalUsers, activeUsers, inactiveUsers, adminUsers);
}

function updateUserStatsDetails(total, active, inactive, admins) {
  const $detailsContainer = $("#userStatsDetails");
  if ($detailsContainer.length) {
    $detailsContainer.html(`
      <div class="row text-center">
        <div class="col-3">
          <div class="badge bg-success fs-6 p-2 w-100">
            ${total}<br><small>סה"כ</small>
          </div>
        </div>
        <div class="col-3">
          <div class="badge bg-info fs-6 p-2 w-100">
            ${active}<br><small>פעילים</small>
          </div>
        </div>
        <div class="col-3">
          <div class="badge bg-warning fs-6 p-2 w-100">
            ${admins}<br><small>מנהלים</small>
          </div>
        </div>
        <div class="col-3">
          <div class="badge bg-secondary fs-6 p-2 w-100">
            ${inactive}<br><small>לא פעילים</small>
          </div>
        </div>
      </div>
    `);
  }
}

function showUsersError() {
  const $container = $("#usersContainer");
  $container.html(`
        <div class="text-center py-5">
            <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
            <h5 class="text-warning">שגיאה בטעינת המשתמשים</h5>
            <button class="btn btn-primary" onclick="loadUsers()">נסה שוב</button>
        </div>
    `);
}

function showReportsError() {
  const $container = $("#reportsContainer");
  $container.html(`
        <div class="text-center py-5">
            <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
            <h5 class="text-warning">שגיאה בטעינת הדיווחים</h5>
            <button class="btn btn-primary" onclick="loadReports()">נסה שוב</button>
        </div>
    `);
}

// Utility functions
function getUserInitials(fullName) {
  if (!fullName) return "U";

  const words = fullName.trim().split(" ");
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  } else if (words.length >= 2) {
    return (
      words[0].charAt(0) + words[words.length - 1].charAt(0)
    ).toUpperCase();
  }
  return "U";
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
