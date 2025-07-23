// Configuration Constants
const CONFIG = {
  localhost: {
    usersBaseURL: `https://localhost:${7259}/api/Users`,
    newsBaseURL: `https://localhost:${7259}/api/News`,
    tagsBaseURL: `https://localhost:${7259}/api/Tags`,
    savedArticlesBaseURL: `https://localhost:${7259}/api/SavedArticles`,
    sharedContentBaseURL: `https://localhost:${7259}/api/SharedContent`,
    userSettingsBaseURL: `https://localhost:${7259}/api/UserSettings`,
    adminBaseURL: `https://localhost:${7259}/api/Admin`,
  },
  production: {
    usersBaseURL: "https://proj.ruppin.ac.il/cgroup10/test2/tar1/api/Users",
    newsBaseURL: "https://proj.ruppin.ac.il/cgroup10/test2/tar1/api/News",
    tagsBaseURL: "https://proj.ruppin.ac.il/cgroup10/test2/tar1/api/Tags",
    savedArticlesBaseURL:
      "https://proj.ruppin.ac.il/cgroup10/test2/tar1/api/SavedArticles",
    sharedContentBaseURL:
      "https://proj.ruppin.ac.il/cgroup10/test2/tar1/api/SharedContent",
    userSettingsBaseURL:
      "https://proj.ruppin.ac.il/cgroup10/test2/tar1/api/UserSettings",
    adminBaseURL: "https://proj.ruppin.ac.il/cgroup10/test2/tar1/api/Admin",
  },
};

const isLocalHost = ["localhost", "127.0.0.1"].includes(location.hostname);
const USERS_SERVER_PATH = isLocalHost
  ? CONFIG.localhost.usersBaseURL
  : CONFIG.production.usersBaseURL;
const NEWS_SERVER_PATH = isLocalHost
  ? CONFIG.localhost.newsBaseURL
  : CONFIG.production.newsBaseURL;
const TAGS_SERVER_PATH = isLocalHost
  ? CONFIG.localhost.tagsBaseURL
  : CONFIG.production.tagsBaseURL;
const SAVED_ARTICLES_SERVER_PATH = isLocalHost
  ? CONFIG.localhost.savedArticlesBaseURL
  : CONFIG.production.savedArticlesBaseURL;
const SHARED_CONTENT_SERVER_PATH = isLocalHost
  ? CONFIG.localhost.sharedContentBaseURL
  : CONFIG.production.sharedContentBaseURL;
const USER_SETTINGS_SERVER_PATH = isLocalHost
  ? CONFIG.localhost.userSettingsBaseURL
  : CONFIG.production.userSettingsBaseURL;
const ADMIN_SERVER_PATH = isLocalHost
  ? CONFIG.localhost.adminBaseURL
  : CONFIG.production.adminBaseURL;

// User Endpoints
const USER_ENDPOINTS = {
  BASE: () => `${USERS_SERVER_PATH}`,
  REGISTER: () => `${USER_ENDPOINTS.BASE()}/register`,
  LOGIN: () => `${USER_ENDPOINTS.BASE()}/login`,
};

const NEWS_ENDPOINTS = {
  BASE: () => `${NEWS_SERVER_PATH}`,
  TOP_HEADLINES_US: () => `${NEWS_ENDPOINTS.BASE()}/TopHeadlines?country=US`,
};

// URL Constants
const urls = {
  users: {
    base: USER_ENDPOINTS.BASE(),
    register: USER_ENDPOINTS.REGISTER(),
    login: USER_ENDPOINTS.LOGIN(),
  },
  news: {
    topHeadlinesUS: NEWS_ENDPOINTS.TOP_HEADLINES_US(),
  },
};
