using NewsAPI.Models;

namespace Server.Models
{
    public class SavedArticle
    {
        public int Id { get; set; }
        public Article Article { get; set; } = new Article();
        public DateTime SavedAt { get; set; } = DateTime.Now;

        public SavedArticle() { }

        public SavedArticle(int id, Article article, DateTime savedAt)
        {
            Id = id;
            Article = article;
            SavedAt = savedAt;
        }


        // Static methods for CRUD operations using DataService
        public static List<SavedArticle> GetUserSavedArticles(int userId)
        {
            return DataService.ExecuteList(db => db.GetUserSavedArticles(userId));
        }
        
        public static List<SavedArticle> SearchSavedArticles(int userId, string searchTerm)
        {
            return DataService.ExecuteList(db => db.SearchUserSavedArticles(userId, searchTerm));
        }
        
        public static bool SaveArticle(Article article , int userId)
        {
            return DataService.ExecuteBool(db => db.SaveArticle(article, userId));
        }
  
        public static bool RemoveSavedArticle(int userId, int articleId)
        {
            return DataService.ExecuteBool(db => db.RemoveSavedArticle(userId, articleId));
        }
    }
}
