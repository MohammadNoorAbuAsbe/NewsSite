// Stub version of ajaxCall to simulate server response
function ajaxCall(method, api, data, successCB, errorCB) {
    console.log(`Stub AJAX Call -> Method: ${method}, API: ${api}`);

    // Simulate a delay like a real server request
    setTimeout(function () {
        // Simulated list of tags from the server
        const mockTags = ["Technology", "Health", "Sports", "Business", "Science"];

        // Call the success callback with mock data
        successCB(mockTags);
    }, 500); // 0.5 second delay
}


// Load tags on page load
$(document).ready(function () {
    loadTags();
});

// Function to render tags into the dropdown
function renderTags(tags) {
    const dropdown = document.getElementById("interestsDropdown");
    dropdown.innerHTML = ""; // Clear existing content

    tags.forEach(tag => {
        const a = document.createElement("a");
        a.className = "dropdown-item";
        a.href = "#";
        a.textContent = tag;
        dropdown.appendChild(a);
    });
}

// Function to handle errors
function handleError(err) {
    console.error("Failed to load tags:", err);
}

// Call the API using ajaxCall
function loadTags() {
    ajaxCall(
        "GET",
        "/api/tags", // Replace this with your actual endpoint
        null,
        renderTags,
        handleError
    );

   
}

