namespace Server.Models
{
    public class SavedArticle
    {
        public SavedArticle(int userId, string title, string description, string url, string urlToImage, string source, DateTime publishedAt, DateTime savedAt, int id = 0)
        {
            Id = id;
            UserId = userId;
            Title = title;
            Description = description;
            Url = url;
            UrlToImage = urlToImage;
            Source = source;
            PublishedAt = publishedAt;
            SavedAt = savedAt;
        }

        public SavedArticle() { }

        public int Id { get; set; }
        public int UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
        public string UrlToImage { get; set; } = string.Empty;
        public string Source { get; set; } = string.Empty;
        public DateTime PublishedAt { get; set; }
        public DateTime SavedAt { get; set; } = DateTime.Now;

        // Static methods for CRUD operations
        public static List<SavedArticle> GetUserSavedArticles(int userId)
        {
            DBservices db = new DBservices();
            return db.GetUserSavedArticles(userId);
        }

        public static List<SavedArticle> SearchSavedArticles(int userId, string searchTerm)
        {
            DBservices db = new DBservices();
            return db.SearchUserSavedArticles(userId, searchTerm);
        }

        public static bool SaveArticle(SavedArticle article)
        {
            DBservices db = new DBservices();
            return db.SaveArticle(article);
        }

        public static bool RemoveSavedArticle(int userId, int articleId)
        {
            DBservices db = new DBservices();
            return db.RemoveSavedArticle(userId, articleId);
        }
    }
}
