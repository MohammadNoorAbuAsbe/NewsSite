// Configuration Constants
const CONFIG = {
  localhost: {
    usersBaseURL: `https://localhost:${7259}/api/Users`,
    newsBaseURL: `https://localhost:${7259}/api/News`,
  },
  production: {
    usersBaseURL: "https://proj.ruppin.ac.il/cgroup10/test2/tar1/api/Users",
    newsBaseURL: `https://localhost:${7259}/api/News`,
  },
};

const isLocalHost = ["localhost", "127.0.0.1"].includes(location.hostname);
const USERS_SERVER_PATH = isLocalHost
  ? CONFIG.localhost.usersBaseURL
  : CONFIG.production.usersBaseURL;
const NEWS_SERVER_PATH = isLocalHost
  ? CONFIG.localhost.newsBaseURL
  : CONFIG.production.newsBaseURL;

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
