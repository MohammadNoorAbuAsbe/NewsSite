// Advanced Features functionality
let liveChatMessages = [];
let notificationsEnabled = false;

document.addEventListener("DOMContentLoaded", function () {
  // Initialize page
  authManager.updateUI();
  initializeAdvancedFeatures();
  setupEventListeners();
});

function setupEventListeners() {
  // Notifications toggle
  const notificationsToggle = document.getElementById("notificationsToggle");
  if (notificationsToggle) {
    notificationsToggle.addEventListener("change", toggleNotifications);
  }

  // Chat input enter key
  const chatInput = document.getElementById("chatInput");
  if (chatInput) {
    chatInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        sendChatMessage();
      }
    });
  }
}

function initializeAdvancedFeatures() {
  // Check notification permission
  if ("Notification" in window) {
    notificationsEnabled = Notification.permission === "granted";
    document.getElementById("notificationsToggle").checked =
      notificationsEnabled;
  }

  // Initialize user avatar
  updateUserAvatar();

  // Initialize PWA install button
  checkPWAInstallability();
}

// AI Features
function demoAISummarization() {
  document.getElementById("demoContent").style.display = "block";

  const aiDemo = document.getElementById("aiDemoResults");
  aiDemo.innerHTML = `
        <div class="ai-demo-section">
            <h6><i class="fas fa-compress-alt me-2"></i>דמו סיכום בינה מלאכותית</h6>
            <div class="mb-3">
                <label class="form-label">הדבק טקסט לסיכום:</label>
                <textarea class="form-control" id="textToSummarize" rows="4" 
                          placeholder="הדבק כאן טקסט ארוך לסיכום..."></textarea>
            </div>
            <button class="btn btn-primary" onclick="performAISummarization()">
                <i class="fas fa-magic me-2"></i>סכם טקסט
            </button>
            <div id="summaryResult" class="mt-3"></div>
        </div>
    `;

  // Scroll to demo
  document.getElementById("demoContent").scrollIntoView({ behavior: "smooth" });
}

function performAISummarization() {
  const text = document.getElementById("textToSummarize").value.trim();
  const resultDiv = document.getElementById("summaryResult");

  if (!text) {
    authManager.showAlert("אנא הזן טקסט לסיכום", "warning");
    return;
  }

  resultDiv.innerHTML = `
        <div class="d-flex align-items-center">
            <div class="spinner-border spinner-border-sm me-2" role="status"></div>
            <span>מסכם טקסט...</span>
        </div>
    `;

  // Simulate AI processing
  setTimeout(() => {
    const words = text.split(" ");
    const summaryLength = Math.max(Math.floor(words.length * 0.3), 10);
    const summary = words.slice(0, summaryLength).join(" ") + "...";

    resultDiv.innerHTML = `
            <div class="alert alert-success">
                <h6><i class="fas fa-check-circle me-2"></i>סיכום:</h6>
                <p class="mb-0">${summary}</p>
                <small class="text-muted">
                    הטקסט המקורי: ${words.length} מילים | הסיכום: ${summaryLength} מילים
                </small>
            </div>
        `;
  }, 2000);
}

function demoSentimentAnalysis() {
  document.getElementById("demoContent").style.display = "block";

  const aiDemo = document.getElementById("aiDemoResults");
  aiDemo.innerHTML = `
        <div class="ai-demo-section">
            <h6><i class="fas fa-chart-line me-2"></i>דמו ניתוח רגשות</h6>
            <div class="mb-3">
                <label class="form-label">הזן טקסט לניתוח רגשות:</label>
                <textarea class="form-control" id="textToAnalyze" rows="3" 
                          placeholder="הזן כאן טקסט לניתוח הרגש שלו..."></textarea>
            </div>
            <button class="btn btn-primary" onclick="performSentimentAnalysis()">
                <i class="fas fa-brain me-2"></i>נתח רגש
            </button>
            <div id="sentimentResult" class="mt-3"></div>
        </div>
    `;

  // Scroll to demo
  document.getElementById("demoContent").scrollIntoView({ behavior: "smooth" });
}

function performSentimentAnalysis() {
  const text = document.getElementById("textToAnalyze").value.trim();
  const resultDiv = document.getElementById("sentimentResult");

  if (!text) {
    authManager.showAlert("אנא הזן טקסט לניתוח", "warning");
    return;
  }

  resultDiv.innerHTML = `
        <div class="d-flex align-items-center">
            <div class="spinner-border spinner-border-sm me-2" role="status"></div>
            <span>מנתח רגשות...</span>
        </div>
    `;

  // Simulate AI processing
  setTimeout(() => {
    // Simple sentiment analysis simulation
    const positiveWords = [
      "טוב",
      "נהדר",
      "מעולה",
      "אוהב",
      "שמח",
      "יפה",
      "הצלחה",
    ];
    const negativeWords = [
      "רע",
      "נורא",
      "גרוע",
      "שונא",
      "עצוב",
      "בעיה",
      "כישלון",
    ];

    const words = text.toLowerCase().split(" ");
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach((word) => {
      if (positiveWords.some((pw) => word.includes(pw))) positiveCount++;
      if (negativeWords.some((nw) => word.includes(nw))) negativeCount++;
    });

    let sentiment, color, icon;
    if (positiveCount > negativeCount) {
      sentiment = "חיובי";
      color = "success";
      icon = "smile";
    } else if (negativeCount > positiveCount) {
      sentiment = "שלילי";
      color = "danger";
      icon = "frown";
    } else {
      sentiment = "ניטרלי";
      color = "secondary";
      icon = "meh";
    }

    const confidence = Math.random() * 30 + 70; // 70-100%

    resultDiv.innerHTML = `
            <div class="alert alert-${color}">
                <h6><i class="fas fa-${icon} me-2"></i>תוצאת ניתוח הרגשות:</h6>
                <p class="mb-2"><strong>רגש מזוהה:</strong> ${sentiment}</p>
                <p class="mb-2"><strong>רמת ביטחון:</strong> ${confidence.toFixed(
                  1
                )}%</p>
                <div class="progress">
                    <div class="progress-bar bg-${color}" style="width: ${confidence}%"></div>
                </div>
            </div>
        `;
  }, 1500);
}

// Real-time Features
function toggleNotifications() {
  const toggle = document.getElementById("notificationsToggle");

  if (toggle.checked) {
    requestNotificationPermission();
  } else {
    notificationsEnabled = false;
    authManager.showAlert("התראות הושבתו", "info");
  }
}

function requestNotificationPermission() {
  if (!("Notification" in window)) {
    authManager.showAlert("הדפדפן שלך לא תומך בהתראות", "warning");
    document.getElementById("notificationsToggle").checked = false;
    return;
  }

  if (Notification.permission === "granted") {
    notificationsEnabled = true;
    authManager.showAlert("התראות הופעלו בהצלחה!", "success");
    sendTestNotification();
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        notificationsEnabled = true;
        authManager.showAlert("התראות הופעלו בהצלחה!", "success");
        sendTestNotification();
      } else {
        document.getElementById("notificationsToggle").checked = false;
        authManager.showAlert("התראות נדחו", "warning");
      }
    });
  } else {
    document.getElementById("notificationsToggle").checked = false;
    authManager.showAlert("התראות חסומות בדפדפן", "warning");
  }
}

function sendTestNotification() {
  if (notificationsEnabled) {
    new Notification("NewsHub", {
      body: "התראות הופעלו בהצלחה! תקבל עדכונים על חדשות חמות.",
      icon: "/favicon.ico",
    });
  }
}

function openLiveChat() {
  const modal = new bootstrap.Modal(document.getElementById("liveChatModal"));
  modal.show();

  // Load chat messages
  loadChatMessages();
}

function loadChatMessages() {
  // Simulate loading chat messages
  const chatMessages = [
    {
      user: "Alice",
      message: "מה דעתכם על החדשות האחרונות?",
      time: new Date(Date.now() - 300000),
    },
    {
      user: "Bob",
      message: "די מעניין, אבל אני חושב שצריך לבדוק עוד מקורות",
      time: new Date(Date.now() - 240000),
    },
    {
      user: "Carol",
      message: "הסכמתי איתך, תמיד חשוב לקרוא מכמה מקורות",
      time: new Date(Date.now() - 180000),
    },
  ];

  displayChatMessages(chatMessages);
}

function displayChatMessages(messages) {
  const container = document.getElementById("chatMessages");

  container.innerHTML = messages
    .map(
      (msg) => `
        <div class="mb-2">
            <strong class="text-primary">${msg.user}</strong>
            <small class="text-muted">${formatChatTime(msg.time)}</small>
            <div>${msg.message}</div>
        </div>
    `
    )
    .join("");

  // Scroll to bottom
  container.scrollTop = container.scrollHeight;
}

function sendChatMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value.trim();

  if (!message) {
    return;
  }

  if (!authManager.isLoggedIn()) {
    authManager.showAlert("נדרש להתחבר כדי לשלוח הודעות", "warning");
    return;
  }

  // Add message to chat
  const container = document.getElementById("chatMessages");
  const newMessage = document.createElement("div");
  newMessage.className = "mb-2";
  newMessage.innerHTML = `
        <strong class="text-success">${authManager.currentUser.FirstName}</strong>
        <small class="text-muted">עכשיו</small>
        <div>${message}</div>
    `;

  container.appendChild(newMessage);
  container.scrollTop = container.scrollHeight;

  input.value = "";

  // Simulate response
  setTimeout(() => {
    const responses = [
      "מעניין!",
      "מסכים איתך",
      "צריך לחשוב על זה",
      "תודה על השיתוף",
      "איך אתה רואה את זה?",
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];
    const responseMessage = document.createElement("div");
    responseMessage.className = "mb-2";
    responseMessage.innerHTML = `
            <strong class="text-info">Bot</strong>
            <small class="text-muted">עכשיו</small>
            <div>${response}</div>
        `;

    container.appendChild(responseMessage);
    container.scrollTop = container.scrollHeight;
  }, 2000);
}

// Geographic Features
function openNewsMap() {
  const modal = new bootstrap.Modal(document.getElementById("newsMapModal"));
  modal.show();

  // Initialize interactive map
  initializeMap();
}

function initializeMap() {
  const mapContainer = document.getElementById("interactiveMap");

  // Simulate interactive world map
  mapContainer.innerHTML = `
        <div class="row h-100">
            <div class="col-md-8">
                <div class="position-relative h-100">
                    <div class="world-map-simulation bg-primary rounded h-100 d-flex align-items-center justify-content-center">
                        <div class="text-center text-white">
                            <i class="fas fa-globe-americas fa-5x mb-3"></i>
                            <h4>מפת חדשות עולמית</h4>
                            <p>לחץ על איזורים למטה לצפייה בחדשות אזוריות</p>
                        </div>
                    </div>
                    <!-- Map regions (clickable areas) -->
                    <div class="map-regions">
                        <button class="btn btn-light position-absolute" style="top: 20%; left: 30%;" onclick="loadRegionNews('US')">
                            ארה"ב
                        </button>
                        <button class="btn btn-light position-absolute" style="top: 30%; left: 50%;" onclick="loadRegionNews('EU')">
                            אירופה
                        </button>
                        <button class="btn btn-light position-absolute" style="top: 40%; left: 70%;" onclick="loadRegionNews('AS')">
                            אסיה
                        </button>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="h-100 overflow-auto" id="mapNewsList">
                    <h6>בחר אזור במפה לצפייה בחדשות</h6>
                </div>
            </div>
        </div>
    `;
}

function loadRegionNews(region) {
  const container = document.getElementById("mapNewsList");

  container.innerHTML = `
        <div class="d-flex align-items-center mb-3">
            <div class="spinner-border spinner-border-sm me-2" role="status"></div>
            <span>טוען חדשות מ${getRegionName(region)}...</span>
        </div>
    `;

  // Simulate loading regional news
  setTimeout(() => {
    const mockNews = [
      {
        title: `חדשות חמות מ${getRegionName(region)}`,
        summary: "תיאור קצר של החדשה",
      },
      {
        title: `עדכון כלכלי מ${getRegionName(region)}`,
        summary: "מידע כלכלי חשוב",
      },
      {
        title: `חדשות ספורט מ${getRegionName(region)}`,
        summary: "תוצאות ועדכונים ספורטיביים",
      },
    ];

    container.innerHTML = `
            <h6>חדשות מ${getRegionName(region)}</h6>
            ${mockNews
              .map(
                (news) => `
                <div class="card mb-2">
                    <div class="card-body p-2">
                        <h6 class="card-title small">${news.title}</h6>
                        <p class="card-text small text-muted">${news.summary}</p>
                    </div>
                </div>
            `
              )
              .join("")}
        `;
  }, 1000);
}

function getRegionName(region) {
  const regions = {
    US: "ארצות הברית",
    EU: "אירופה",
    AS: "אסיה",
  };
  return regions[region] || region;
}

// Social Features
function updateUserAvatar() {
  if (!authManager.isLoggedIn()) return;

  const avatar = document.getElementById("userAvatar");
  if (!avatar) return;

  // Simulate user level based on activity
  const userLevel = calculateUserLevel();
  const avatarStyle = getAvatarStyle(userLevel);

  avatar.style.background = avatarStyle.background;
  avatar.innerHTML = avatarStyle.icon;
}

function calculateUserLevel() {
  // Simulate user level calculation
  return Math.floor(Math.random() * 5) + 1; // 1-5
}

function getAvatarStyle(level) {
  const styles = {
    1: {
      background: "linear-gradient(135deg, #6c757d, #adb5bd)",
      icon: '<i class="fas fa-user"></i>',
    },
    2: {
      background: "linear-gradient(135deg, #28a745, #20c997)",
      icon: '<i class="fas fa-star"></i>',
    },
    3: {
      background: "linear-gradient(135deg, #007bff, #6610f2)",
      icon: '<i class="fas fa-crown"></i>',
    },
    4: {
      background: "linear-gradient(135deg, #fd7e14, #e83e8c)",
      icon: '<i class="fas fa-gem"></i>',
    },
    5: {
      background: "linear-gradient(135deg, #ffc107, #fd7e14)",
      icon: '<i class="fas fa-trophy"></i>',
    },
  };

  return styles[level] || styles[1];
}

// PWA Features
function checkPWAInstallability() {
  // Check if PWA is installable
  let deferredPrompt;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
}

function installPWA() {
  // Simulate PWA installation
  authManager.showAlert("התקנת האפליקציה תהיה זמינה בקרוב", "info");
}

// Utility Functions
function formatChatTime(date) {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "עכשיו";
  if (minutes < 60) return `לפני ${minutes} דקות`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `לפני ${hours} שעות`;

  return date.toLocaleDateString("he-IL");
}
