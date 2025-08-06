function ajaxCall(method, api, data, successCB, errorCB) {
  // Get JWT token from localStorage
  const token = localStorage.getItem("jwtToken");

  // Set up headers
  const headers = {
    "Content-Type": "application/json",
  };

  // Add Authorization header if token exists
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  $.ajax({
    type: method,
    url: api,
    data: data,
    cache: false,
    headers: headers,
    contentType: "application/json",
    dataType: "json",
    success: successCB,
    error: function (xhr, status, error) {
      // Handle 401 Unauthorized - token expired or invalid
      if (xhr.status === 401) {
        // Clear invalid token
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("currentUser");

        // Redirect to login page
        window.location.href = "login.html";
        return;
      }

      // Call the original error callback
      if (errorCB) {
        errorCB(xhr, status, error);
      }
    },
  });
}

// New function for making authenticated API calls with modern fetch
async function authenticatedFetch(url, options = {}) {
  const token = localStorage.getItem("jwtToken");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized
    if (response.status === 401) {
      localStorage.removeItem("jwtToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("currentUser");
      window.location.href = "login.html";
      return null;
    }

    return response;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}

// Function to check if user is authenticated
function isAuthenticated() {
  const token = localStorage.getItem("jwtToken");
  const user = localStorage.getItem("currentUser");
  return token && user && user !== "undefined";
}

// Function to get current user from localStorage
function getCurrentUser() {
  const userStr = localStorage.getItem("currentUser");
  if (userStr && userStr !== "undefined") {
    return JSON.parse(userStr);
  }
  return null;
}
