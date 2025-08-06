// Real-time notification system using SignalR
class NotificationManager {
  constructor() {
    this.connection = null;
    this.isConnected = false;
    this.notifications = [];
    this.maxNotifications = 50;
    this.init();
  }

  async init() {
    try {
      // Initialize SignalR connection
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl("/notificationHub", {
          accessTokenFactory: () => {
            return authManager.getAuthToken();
          },
        })
        .withAutomaticReconnect()
        .build();

      // Set up event handlers
      this.setupEventHandlers();

      // Start connection
      await this.startConnection();
    } catch (error) {
      console.error("Failed to initialize notifications:", error);
    }
  }

  setupEventHandlers() {
    // Handle incoming notifications
    this.connection.on("ReceiveNotification", (notification) => {
      this.handleNotification(notification);
    });

    // Handle dashboard updates (for admins)
    this.connection.on("DashboardUpdate", (data) => {
      this.handleDashboardUpdate(data);
    });

    // Connection events
    this.connection.onreconnecting(() => {
      this.isConnected = false;
      this.updateConnectionStatus();
    });

    this.connection.onreconnected(() => {
      this.isConnected = true;
      this.updateConnectionStatus();
      this.joinUserGroups();
    });

    this.connection.onclose(() => {
      this.isConnected = false;
      this.updateConnectionStatus();
    });
  }

  async startConnection() {
    try {
      await this.connection.start();
      this.isConnected = true;
      this.updateConnectionStatus();
      await this.joinUserGroups();
    } catch (error) {
      console.error("Failed to start notification connection:", error);
      this.isConnected = false;
      this.updateConnectionStatus();
    }
  }

  async joinUserGroups() {
    if (!this.isConnected || !authManager.isLoggedIn()) return;

    try {
      // Join interest-based groups for breaking news
      const userSettings = await this.getUserInterests();
      if (userSettings && userSettings.interests) {
        await this.connection.invoke(
          "JoinInterestGroups",
          userSettings.interests
        );
      }
    } catch (error) {
      console.error("Failed to join user groups:", error);
    }
  }

  async getUserInterests() {
    // This would fetch user's interests/tags from the API
    // For now, return empty array
    return { interests: [] };
  }

  handleNotification(notification) {
    // Add to notifications array
    this.notifications.unshift(notification);
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }

    // Show notification based on type
    this.showNotification(notification);

    // Update notification badge
    this.updateNotificationBadge();

    // Save to localStorage for persistence
    this.saveNotifications();
  }

  showNotification(notification) {
    const { Type, Title, Message, Data } = notification;

    // Show browser notification if permission is granted
    if (Notification.permission === "granted") {
      this.showBrowserNotification(Title, Message, Type);
    }

    // Show in-app notification
    this.showInAppNotification(notification);

    // Handle specific notification types
    switch (Type) {
      case "breaking_news":
        this.handleBreakingNews(notification);
        break;
      case "content_interaction":
        this.handleContentInteraction(notification);
        break;
      case "content_report":
        this.handleContentReport(notification);
        break;
      case "security":
        this.handleSecurityNotification(notification);
        break;
    }
  }

  showBrowserNotification(title, message, type) {
    const options = {
      body: message,
      icon: this.getNotificationIcon(type),
      badge: "/img/NEWS.jpg",
      tag: "newshub-notification",
    };

    const notification = new Notification(title, options);

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);
  }

  showInAppNotification(notification) {
    const { Type, Title, Message } = notification;

    // Use new toast system if available
    if (typeof Utils !== "undefined" && Utils.toast) {
      const toastType = this.getToastType(Type);
      const fullMessage = Title ? `${Title}: ${Message}` : Message;
      Utils.toast.show(fullMessage, toastType, 6000);
      return;
    }

    // Fallback to original system
    // Create notification element
    const notificationEl = this.createNotificationElement(notification);

    // Add to notification container
    const $container = $("#notificationContainer");
    if ($container.length) {
      $container.append(notificationEl);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        $(notificationEl).remove();
      }, 5000);
    } else {
      // Fallback to toast if no container
      Utils.toast.info(Message);
    }
  }

  // Map notification types to toast types
  getToastType(notificationType) {
    const typeMap = {
      breaking_news: "warning",
      content_interaction: "info",
      content_report: "warning",
      security: "error",
      success: "success",
      error: "error",
      info: "info",
      warning: "warning",
    };
    return typeMap[notificationType] || "info";
  }

  createNotificationElement(notification) {
    const { Type, Title, Message, Timestamp } = notification;

    const $div = $("<div>", {
      class: `notification-item alert alert-${this.getAlertType(
        Type
      )} alert-dismissible fade show`,
    });

    $div.html(`
      <div class="d-flex align-items-start">
        <i class="${this.getNotificationIcon(Type)} me-2"></i>
        <div class="flex-grow-1">
          <strong>${Title}</strong>
          <p class="mb-1">${Message}</p>
          <small class="text-muted">${this.formatTime(Timestamp)}</small>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `);

    return $div[0];
  }

  handleBreakingNews(notification) {
    // Special handling for breaking news
    const { Data } = notification;
    if (Data && Data.Url) {
      // Could show a special breaking news modal or banner
    }
  }

  handleContentInteraction(notification) {
    // Handle content interaction notifications
    const { Data } = notification;
    if (Data && window.location.pathname === "/shared-content.html") {
      // Refresh shared content if user is viewing that page
      if (typeof loadSharedContent === "function") {
        loadSharedContent();
      }
    }
  }

  handleContentReport(notification) {
    // Handle content report notifications (for admins)
    if (authManager.isAdmin() && window.location.pathname === "/admin.html") {
      // Refresh reports section
      if (typeof loadReports === "function") {
        loadReports();
      }
    }
  }

  handleSecurityNotification(notification) {
    // Special handling for security notifications
    Utils.toast.error(notification.Message);
  }

  handleDashboardUpdate(data) {
    // Handle real-time dashboard updates for admins
    if (authManager.isAdmin() && window.location.pathname === "/admin.html") {
      this.updateAdminDashboard(data);
    }
  }

  updateAdminDashboard(data) {
    // Update dashboard elements with real-time data
    if (data.activeUsers !== undefined) {
      const $activeUsersEl = $("#activeUsers");
      if ($activeUsersEl.length) {
        $activeUsersEl.text(data.activeUsers);
      }
    }

    if (data.pendingReports !== undefined) {
      const $pendingReportsEl = $("#pendingReports");
      if ($pendingReportsEl.length) {
        $pendingReportsEl.text(data.pendingReports);
      }
    }
  }

  updateNotificationBadge() {
    const unreadCount = this.getUnreadCount();
    const $badge = $("#notificationBadge");

    if ($badge.length) {
      if (unreadCount > 0) {
        $badge.text(unreadCount > 99 ? "99+" : unreadCount);
        $badge.show();
      } else {
        $badge.hide();
      }
    }
  }

  updateConnectionStatus() {
    const $statusEl = $("#connectionStatus");
    if ($statusEl.length) {
      $statusEl.attr("class", this.isConnected ? "connected" : "disconnected");
      $statusEl.attr("title", this.isConnected ? "Connected" : "Disconnected");
    }
  }

  getUnreadCount() {
    return this.notifications.filter((n) => !n.read).length;
  }

  markAsRead(notificationId) {
    const notification = this.notifications.find(
      (n) => n.id === notificationId
    );
    if (notification) {
      notification.read = true;
      this.updateNotificationBadge();
      this.saveNotifications();
    }
  }

  markAllAsRead() {
    this.notifications.forEach((n) => (n.read = true));
    this.updateNotificationBadge();
    this.saveNotifications();
  }

  getNotificationIcon(type) {
    const icons = {
      info: "fas fa-info-circle text-info",
      success: "fas fa-check-circle text-success",
      warning: "fas fa-exclamation-triangle text-warning",
      danger: "fas fa-exclamation-circle text-danger",
      breaking_news: "fas fa-bolt text-warning",
      content_interaction: "fas fa-heart text-danger",
      content_report: "fas fa-flag text-warning",
      security: "fas fa-shield-alt text-danger",
      daily_summary: "fas fa-chart-line text-info",
    };

    return icons[type] || "fas fa-bell text-primary";
  }

  getAlertType(type) {
    const alertTypes = {
      info: "info",
      success: "success",
      warning: "warning",
      danger: "danger",
      breaking_news: "warning",
      content_interaction: "success",
      content_report: "warning",
      security: "danger",
      daily_summary: "info",
    };

    return alertTypes[type] || "info";
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  }

  saveNotifications() {
    try {
      localStorage.setItem("notifications", JSON.stringify(this.notifications));
    } catch (error) {
      console.error("Failed to save notifications:", error);
    }
  }

  loadNotifications() {
    try {
      const saved = localStorage.getItem("notifications");
      if (saved) {
        this.notifications = JSON.parse(saved);
        this.updateNotificationBadge();
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  }

  async requestPermission() {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      return permission;
    }
    return "denied";
  }

  async sendTestNotification() {
    if (this.isConnected) {
      try {
        await this.connection.invoke("SendTestNotification");
      } catch (error) {
        console.error("Failed to send test notification:", error);
      }
    }
  }

  getNotifications() {
    return this.notifications;
  }

  clearNotifications() {
    this.notifications = [];
    this.updateNotificationBadge();
    this.saveNotifications();
  }

  disconnect() {
    if (this.connection) {
      this.connection.stop();
    }
  }
}

// Global notification manager instance
const notificationManager = new NotificationManager();

// Initialize notifications when DOM is loaded
$(document).ready(function () {
  // Load saved notifications
  notificationManager.loadNotifications();

  // Request notification permission
  notificationManager.requestPermission();
});

// Initialize when user logs in
$(document).on("userLoggedIn", function () {
  notificationManager.init();
});

// Clean up when user logs out
$(document).on("userLoggedOut", function () {
  notificationManager.disconnect();
  notificationManager.clearNotifications();
});
