
const currentUserId = "user1"; // Simulated logged-in user

function ajaxCall(method, api, data, successCB, errorCB) {
    setTimeout(() => {
        const allNews = [
            { id: "1", title: "Tech Revolution 2025", photoUrl: "https://via.placeholder.com/120x80?text=Tech", description: "AI is reshaping the global economy.", tags: ["Technology", "Business"] },
            { id: "2", title: "Healthy Living Tips", photoUrl: "https://via.placeholder.com/120x80?text=Health", description: "5 daily habits for wellness.", tags: ["Health"] },
            { id: "3", title: "Championship Recap", photoUrl: "https://via.placeholder.com/120x80?text=Sports", description: "Epic finale in football.", tags: ["Sports"] },
            { id: "4", title: "Science of the Stars", photoUrl: "https://via.placeholder.com/120x80?text=Science", description: "New telescope discovers galaxies.", tags: ["Science", "Technology"] }
        ];

        if (!window.mockSavedNewsByUser) window.mockSavedNewsByUser = {};
        if (!window.mockSavedNewsByUser[currentUserId]) window.mockSavedNewsByUser[currentUserId] = new Set();

        if (api === "/api/tags") {
            return successCB(["Technology", "Health", "Sports", "Business", "Science"]);
        }

        if (api === "/api/news") {
            let filtered = allNews;
            if (data && data.tags && data.tags.length > 0) {
                filtered = allNews.filter(n => n.tags.some(tag => data.tags.includes(tag)));
            }
            return successCB(filtered);
        }

        if (method === "POST" && api === "/api/user/saved-news") {
            const userSet = window.mockSavedNewsByUser[currentUserId];
            if (userSet.has(data.newsId)) {
                return errorCB("News already saved.");
            }
            userSet.add(data.newsId);
            return successCB({ status: "saved" });
        }

        if (method === "DELETE" && api.startsWith("/api/user/saved-news/")) {
            const id = api.split("/").pop();
            window.mockSavedNewsByUser[currentUserId].delete(id);
            return successCB({ status: "unsaved" });
        }

        if (api === "/api/user/saved-news") {
            const userSavedIds = window.mockSavedNewsByUser[currentUserId];
            const saved = allNews.filter(n => userSavedIds.has(n.id));
            return successCB(saved);
        }

        return errorCB("Unknown API");
    }, 300);
}

const selectedTags = new Set();

function renderTags(tags) {
    const dropdown = document.getElementById("interestsDropdown");
    if (!dropdown) return; // no dropdown on saved page

    dropdown.innerHTML = "";
    tags.forEach(tag => {
        const a = document.createElement("a");
        a.className = "dropdown-item";
        a.href = "#";
        a.textContent = tag;
        a.dataset.selected = "false";

        a.addEventListener("click", function (e) {
            e.preventDefault();
            const isSelected = a.dataset.selected === "true";

            if (isSelected) {
                a.classList.remove("active");
                a.dataset.selected = "false";
                selectedTags.delete(tag);
            } else {
                a.classList.add("active");
                a.dataset.selected = "true";
                selectedTags.add(tag);
            }
            loadNewsByTags(Array.from(selectedTags));
        });

        dropdown.appendChild(a);
    });
}

function renderNews(newsList, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";

    if (newsList.length === 0) {
        container.innerHTML = "<p>No news found.</p>";
        return;
    }

    const savedNewsIds = window.mockSavedNewsByUser[currentUserId];

    newsList.forEach(news => {
        const isSaved = savedNewsIds.has(news.id);
        const div = document.createElement("div");
        div.className = "news-card mb-3 p-3 border rounded d-flex";

        div.innerHTML = `
            <img src="${news.photoUrl}" alt="News Image" style="width:120px; height:80px; object-fit:cover; border-radius:5px; margin-right:15px;">
            <div style="flex:1">
                <h5>${news.title}</h5>
                <p>${news.description}</p>
                <small class="text-muted">Tags: ${news.tags.join(", ")}</small>
                ${containerId === "newsArea" ? `<br>
                <button class="btn btn-sm btn-${isSaved ? "danger" : "primary"} save-btn mt-2" data-id="${news.id}">
                    ${isSaved ? "Unsave" : "Save"}
                </button>` : ""}
            </div>
        `;

        container.appendChild(div);
    });

    if (containerId === "newsArea") {
        container.querySelectorAll(".save-btn").forEach(button => {
            button.addEventListener("click", () => {
                const id = button.dataset.id;
                if (window.mockSavedNewsByUser[currentUserId].has(id)) {
                    unsaveNews(id);
                } else {
                    saveNews(id);
                }
            });
        });
    }
}

function saveNews(newsId) {
    if (window.mockSavedNewsByUser[currentUserId].has(newsId)) {
        alert("This news is already saved.");
        return;
    }
    ajaxCall("POST", "/api/user/saved-news", { newsId }, () => {
        window.mockSavedNewsByUser[currentUserId].add(newsId);
        reloadCurrentPageData();
    }, err => alert("Failed to save news: " + err));
}

function unsaveNews(newsId) {
    ajaxCall("DELETE", `/api/user/saved-news/${newsId}`, null, () => {
        window.mockSavedNewsByUser[currentUserId].delete(newsId);
        reloadCurrentPageData();
    }, err => alert("Failed to unsave news: " + err));
}

function loadNewsByTags(tags) {
    ajaxCall("GET", "/api/news", { tags }, news => {
        renderNews(news, "newsArea");
    }, err => console.error("Failed to load news:", err));
}

function loadSavedNews() {
    ajaxCall("GET", "/api/user/saved-news", null, news => {
        renderNews(news, "savedNewsArea");
    }, err => console.error("Failed to load saved news:", err));
}

function loadTags() {
    ajaxCall("GET", "/api/tags", null, renderTags, err => console.error("Failed to load tags:", err));
}



document.addEventListener("DOMContentLoaded", () => {
        loadTags();
        loadNewsByTags([]);
    
});