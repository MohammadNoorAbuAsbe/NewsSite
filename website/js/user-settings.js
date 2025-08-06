// User Settings JavaScript functionality
let currentUser = null;

// Initialize when page loads
$(document).ready(function () {
  // Check if user is logged in
  currentUser = authManager.getCurrentUser();
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  // Initialize page
  authManager.setupNavbar();
  loadUserSettings();
  loadUserInterests();
  loadBlockedUsers();
  setupEventListeners();
});

// Show different settings sections
function showSection(sectionName) {
  // Hide all sections
  $(".settings-section").hide();

  // Remove active class from all nav items
  $(".list-group-item").removeClass("active");

  // Show selected section
  $(`#${sectionName}Section`).show();

  // Add active class to selected nav item
  $(`.list-group-item[onclick="showSection('${sectionName}')"]`).addClass(
    "active"
  );
}

// Setup event listeners
function setupEventListeners() {
  // Profile form submission
  $("#profileForm").on("submit", function (e) {
    e.preventDefault();
    updateProfile();
  });

  // Notifications form submission
  $("#notificationsForm").on("submit", function (e) {
    e.preventDefault();
    updateNotificationSettings();
  });

  // Privacy form submission
  $("#privacyForm").on("submit", function (e) {
    e.preventDefault();
    updatePrivacySettings();
  });

  // Custom tag input enter key
  $("#customTag").on("keypress", function (e) {
    if (e.which === 13) {
      addCustomInterest();
    }
  });
}

// Load user settings from server
function loadUserSettings() {
  // Load user profile using JWT authentication
  authenticatedFetch(`${USER_SETTINGS_SERVER_PATH}`, {
    method: "GET",
  })
    .then((response) => {
      if (!response) return; // Handle case where user was logged out due to invalid token
      return response.json();
    })
    .then((data) => {
      if (data) {
        populateUserProfile(data);
      }
    })
    .catch((error) => {
      console.error("Error loading user settings:", error);
      // If settings don't exist, just populate with current user data
      populateUserProfile({
        EmailNotifications: true,
        BrowserNotifications: true,
        NewsDigest: false,
        PublicProfile: true,
        ShareActivity: false,
        AllowMessages: true,
      });
    });
}

// Populate user profile form
function populateUserProfile(settings) {
  $("#firstName").val(currentUser.FirstName || "");
  $("#lastName").val(currentUser.LastName || "");
  $("#email").val(currentUser.Email || "");

  // Notification settings
  $("#emailNotifications").prop(
    "checked",
    settings.EmailNotifications || false
  );
  $("#browserNotifications").prop(
    "checked",
    settings.BrowserNotifications || false
  );
  $("#newsDigest").prop("checked", settings.NewsDigest || false);

  // Privacy settings
  $("#publicProfile").prop("checked", settings.PublicProfile || false);
  $("#shareActivity").prop("checked", settings.ShareActivity || false);
  $("#allowMessages").prop("checked", settings.AllowMessages || false);
}

// Update user profile
function updateProfile() {
  const firstName = $("#firstName").val().trim();
  const lastName = $("#lastName").val().trim();

  if (!firstName || !lastName) {
    Utils.toast.warning("אנא מלא את כל השדות הנדרשים");
    return;
  }

  // Update user via Users controller
  const userData = {
    Id: currentUser.Id,
    FirstName: firstName,
    LastName: lastName,
    Email: currentUser.Email,
  };

  ajaxCall(
    "PUT",
    `${USERS_SERVER_PATH}/${currentUser.Id}`,
    JSON.stringify(userData),
    function (response) {
      Utils.toast.success("הפרופיל עודכן בהצלחה");

      // Update current user data
      currentUser.FirstName = firstName;
      currentUser.LastName = lastName;
      authManager.setCurrentUser(currentUser);
      authManager.setupNavbar();
    },
    function (error) {
      console.error("Error updating profile:", error);
      Utils.toast.error("שגיאה בעדכון הפרופיל");
    }
  );
}

// Update notification settings
function updateNotificationSettings() {
  const settings = {
    EmailNotifications: $("#emailNotifications").is(":checked"),
    BrowserNotifications: $("#browserNotifications").is(":checked"),
    NewsDigest: $("#newsDigest").is(":checked"),
    PublicProfile: $("#publicProfile").is(":checked"),
    ShareActivity: $("#shareActivity").is(":checked"),
    AllowMessages: $("#allowMessages").is(":checked"),
  };

  // Use JWT authenticated request
  authenticatedFetch(USER_SETTINGS_SERVER_PATH, {
    method: "PUT",
    body: JSON.stringify(settings),
  })
    .then((response) => {
      if (!response) return; // Handle case where user was logged out due to invalid token
      return response.json();
    })
    .then((data) => {
      if (data) {
        Utils.toast.success("הגדרות ההתראות עודכנו בהצלחה");
      }
    })
    .catch((error) => {
      console.error("Error updating notification settings:", error);
      // If settings don't exist, create them
      authenticatedFetch(USER_SETTINGS_SERVER_PATH, {
        method: "POST",
        body: JSON.stringify(settings),
      })
        .then((response) => {
          if (!response) return;
          return response.json();
        })
        .then((data) => {
          if (data) {
            Utils.toast.success("הגדרות ההתראות נשמרו בהצלחה");
          }
        })
        .catch((createError) => {
          console.error("Error creating notification settings:", createError);
          Utils.toast.error("שגיאה בשמירת הגדרות ההתראות");
        });
    });
}

// Update privacy settings
function updatePrivacySettings() {
  const settings = {
    UserId: currentUser.Id,
    EmailNotifications: $("#emailNotifications").is(":checked"),
    BrowserNotifications: $("#browserNotifications").is(":checked"),
    NewsDigest: $("#newsDigest").is(":checked"),
    PublicProfile: $("#publicProfile").is(":checked"),
    ShareActivity: $("#shareActivity").is(":checked"),
    AllowMessages: $("#allowMessages").is(":checked"),
  };

  ajaxCall(
    "PUT",
    `${USER_SETTINGS_SERVER_PATH}/${currentUser.Id}`,
    JSON.stringify(settings),
    function (response) {
      Utils.toast.success("הגדרות הפרטיות עודכנו בהצלחה");
    },
    function (error) {
      console.error("Error updating privacy settings:", error);
      // If settings don't exist, create them
      ajaxCall(
        "POST",
        USER_SETTINGS_SERVER_PATH,
        JSON.stringify(settings),
        function (response) {
          Utils.toast.success("הגדרות הפרטיות נשמרו בהצלחה");
        },
        function (createError) {
          console.error("Error creating privacy settings:", createError);
          Utils.toast.error("שגיאה בשמירת הגדרות הפרטיות");
        }
      );
    }
  );
}

// Load user interests
function loadUserInterests() {
  // Load all available tags
  ajaxCall(
    "GET",
    TAGS_SERVER_PATH,
    null,
    function (tags) {
      displayAvailableTags(tags);
    },
    function (error) {
      console.error("Error loading tags:", error);
    }
  );

  // Load user's interests
  ajaxCall(
    "GET",
    `${TAGS_SERVER_PATH}/user/${currentUser.Id}`,
    null,
    function (userTags) {
      displayUserInterests(userTags);
    },
    function (error) {
      console.error("Error loading user tags:", error);
      displayUserInterests([]);
    }
  );
}

// Display available tags
function displayAvailableTags(tags) {
  const container = $("#availableTags");
  container.empty();

  if (tags && tags.length > 0) {
    // Separate system and custom tags
    const systemTags = tags.filter((tag) => !tag.custom);
    const customTags = tags.filter((tag) => tag.custom);

    if (systemTags.length > 0) {
      container.append('<h6 class="mt-3">תגיות מערכת</h6>');
      systemTags.forEach((tag) => {
        const tagElement = $(`
          <span class="tag system-tag" style="cursor: pointer;" onclick="addInterest('${tag.name}')">
              <i class="fas fa-plus me-1"></i>${tag.name}
          </span>
        `);
        container.append(tagElement);
      });
    }

    if (customTags.length > 0) {
      container.append('<h6 class="mt-3">תגיות מותאמות אישית</h6>');
      customTags.forEach((tag) => {
        const tagElement = $(`
          <span class="tag custom-tag" style="cursor: pointer;" onclick="addInterest('${tag.name}')">
              <i class="fas fa-plus me-1"></i>${tag.name}
          </span>
        `);
        container.append(tagElement);
      });
    }
  } else {
    container.append('<p class="text-muted">אין תגיות זמינות</p>');
  }
}

// Display user interests
function displayUserInterests(userTags) {
  const container = $("#userInterests");
  container.empty();

  if (userTags && userTags.length > 0) {
    userTags.forEach((tag) => {
      const tagElement = $(`
        <span class="tag ${
          tag.custom ? "custom-tag" : "system-tag"
        } tag-removable">
            ${tag.name}
            <i class="fas fa-times tag-remove" onclick="removeInterest('${
              tag.name
            }')"></i>
        </span>
      `);
      container.append(tagElement);
    });
  } else {
    container.append('<p class="text-muted">אין תחומי עניין</p>');
  }
}

// Add interest to user
function addInterest(tagName) {
  const currentUser = authManager.getCurrentUser();
  if (!currentUser) return;

  ajaxCall(
    "POST",
    `${TAGS_SERVER_PATH}/${currentUser.Id}/interests/${tagName}`,
    null,
    function (response) {
      Utils.toast.success(`התחום "${tagName}" נוסף בהצלחה`);
      loadUserInterests(); // Reload to update display
    },
    function (error) {
      console.error("Error adding interest:", error);
      Utils.toast.error("שגיאה בהוספת התחום");
    }
  );
}

// Remove interest from user
function removeInterest(tagName) {
  const currentUser = authManager.getCurrentUser();
  if (!currentUser) return;

  ajaxCall(
    "DELETE",
    `${TAGS_SERVER_PATH}/${currentUser.Id}/interests/${tagName}`,
    null,
    function (response) {
      Utils.toast.success(`התחום "${tagName}" הוסר בהצלחה`);
      loadUserInterests(); // Reload to update display
    },
    function (error) {
      console.error("Error removing interest:", error);
      Utils.toast.error("שגיאה בהסרת התחום");
    }
  );
}

// Add custom tag
function addCustomTag() {
  const tagName = $("#customTag").val().trim();

  if (!tagName) {
    Utils.toast.warning("נא להזין שם תגית");
    return;
  }

  const currentUser = authManager.getCurrentUser();
  if (!currentUser) return;

  ajaxCall(
    "POST",
    `${TAGS_SERVER_PATH}/${currentUser.Id}/interests/${tagName}`,
    null,
    function (response) {
      Utils.toast.success(`התגית "${tagName}" נוצרה ונוספה בהצלחה`);
      $("#customTag").val(""); // Clear input
      loadUserInterests(); // Reload to update display
      loadTags(); // Reload available tags
    },
    function (error) {
      console.error("Error adding custom tag:", error);
      Utils.toast.error("שגיאה ביצירת התגית");
    }
  );
}

// Load blocked users
function loadBlockedUsers() {
  // For now, just display the placeholder
  displayBlockedUsers();
  // TODO: Implement actual blocked users loading when backend support is added
}

// Display blocked users (placeholder)
function displayBlockedUsers() {
  const container = $("#blockedUsers");
  container.html(`
    <div class="text-center py-4">
        <i class="fas fa-user-slash fa-3x text-muted mb-3"></i>
        <p class="text-muted">אין משתמשים חסומים</p>
        <small class="text-muted">תכונה זו תהיה זמינה בקרוב</small>
    </div>
  `);
}

// Utility function to show alerts
function showAlert(message, type) {
  const alertId = "alert-" + Date.now();
  const alertHtml = `
    <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;

  // Add to alerts container or create one
  let alertsContainer = $("#alerts-container");
  if (alertsContainer.length === 0) {
    $("body").prepend(
      '<div id="alerts-container" class="position-fixed" style="top: 20px; right: 20px; z-index: 9999;"></div>'
    );
    alertsContainer = $("#alerts-container");
  }

  alertsContainer.append(alertHtml);

  // Auto remove after 5 seconds
  setTimeout(() => {
    $(`#${alertId}`).fadeOut(() => {
      $(`#${alertId}`).remove();
    });
  }, 5000);
}
