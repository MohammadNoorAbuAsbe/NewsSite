// Helper functions for notification UI
function showAllNotifications() {
  const notifications = notificationManager.getNotifications();
  const modalHTML = `
    <div class="modal fade" id="notificationsModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">כל ההתראות</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="text-muted">${notifications.length} התראות</span>
              <div>
                <button class="btn btn-sm btn-outline-secondary me-2" onclick="notificationManager.markAllAsRead(); updateNotificationsModal();">
                  סמן הכל כנקרא
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="notificationManager.clearNotifications(); updateNotificationsModal();">
                  נקה הכל
                </button>
              </div>
            </div>
            <div id="allNotificationsList">
              ${renderNotificationsList(notifications)}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal
  const $existingModal = $("#notificationsModal");
  if ($existingModal.length) {
    $existingModal.remove();
  }

  // Add modal to body
  $("body").append(modalHTML);

  // Show modal
  const modal = new bootstrap.Modal($("#notificationsModal")[0]);
  modal.show();
}

function renderNotificationsList(notifications) {
  if (notifications.length === 0) {
    return '<div class="text-center text-muted p-4">אין התראות</div>';
  }

  return notifications
    .map(
      (notification) => `
    <div class="notification-item border-bottom py-3 ${
      notification.read ? "opacity-75" : ""
    }">
      <div class="d-flex align-items-start">
        <i class="${notificationManager.getNotificationIcon(
          notification.Type
        )} me-3 mt-1"></i>
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between align-items-start">
            <strong class="d-block">${notification.Title}</strong>
            <small class="text-muted">${notificationManager.formatTime(
              notification.Timestamp
            )}</small>
          </div>
          <p class="mb-1 text-muted">${notification.Message}</p>
          ${notification.Data ? renderNotificationData(notification.Data) : ""}
          ${
            !notification.read
              ? `
            <button class="btn btn-sm btn-outline-primary mt-2" onclick="notificationManager.markAsRead('${notification.id}'); updateNotificationsModal();">
              סמן כנקרא
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

function renderNotificationData(data) {
  if (data.Url) {
    return `<a href="${data.Url}" class="btn btn-sm btn-outline-primary mt-2">צפה במאמר</a>`;
  }
  return "";
}

function updateNotificationsModal() {
  const $listEl = $("#allNotificationsList");
  if ($listEl.length) {
    const notifications = notificationManager.getNotifications();
    $listEl.html(renderNotificationsList(notifications));
  }
}

function updateNotificationDropdown() {
  const $notificationList = $("#notificationList");
  if (!$notificationList.length) return;

  const notifications = notificationManager.getNotifications().slice(0, 5); // Show last 5

  if (notifications.length === 0) {
    $notificationList.html(
      '<div class="text-center text-muted p-3">אין התראות חדשות</div>'
    );
  } else {
    $notificationList.html(
      notifications
        .map(
          (notification) => `
      <div class="dropdown-item-text border-bottom py-2 ${
        notification.read ? "opacity-75" : ""
      }">
        <div class="d-flex align-items-start">
          <i class="${notificationManager.getNotificationIcon(
            notification.Type
          )} me-2"></i>
          <div class="flex-grow-1">
            <div class="fw-bold small">${notification.Title}</div>
            <div class="text-muted small">${notification.Message.substring(
              0,
              50
            )}${notification.Message.length > 50 ? "..." : ""}</div>
            <div class="text-muted" style="font-size: 0.75rem;">${notificationManager.formatTime(
              notification.Timestamp
            )}</div>
          </div>
        </div>
      </div>
    `
        )
        .join("")
    );
  }
}

// Override the notification manager's update badge function to also update dropdown
const originalUpdateBadge = notificationManager.updateNotificationBadge;
notificationManager.updateNotificationBadge = function () {
  originalUpdateBadge.call(this);
  updateNotificationDropdown();
};

// Test notification function (for development)
async function sendTestNotification() {
  if (authManager.isLoggedIn()) {
    await notificationManager.sendTestNotification();
  } else {
    Utils.toast.warning("נדרש להתחבר כדי לקבל התראות");
  }
}
