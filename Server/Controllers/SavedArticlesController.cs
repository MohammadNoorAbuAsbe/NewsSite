using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using NewsAPI.Models;
using Server.Models;

namespace Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SavedArticlesController : BaseController
    {
        /// <summary>
        /// Get all saved articles for the authenticated user
        /// </summary>
        [HttpGet("user")]
        public IActionResult GetUserSavedArticles(int page = 1, int pageSize = 10)
        {
            return ExecuteWithUserValidation(userId =>
            {
                var savedArticles = SavedArticle.GetUserSavedArticles(userId);
                
                // Apply pagination if needed
                if (page > 0 && pageSize > 0)
                {
                    var pagedArticles = savedArticles
                        .Skip((page - 1) * pageSize)
                        .Take(pageSize)
                        .ToList();
                    
                    return (object)new 
                    { 
                        articles = pagedArticles,
                        totalCount = savedArticles.Count,
                        page = page,
                        pageSize = pageSize
                    };
                }
                
                return (object)savedArticles;
            });
        }

        /// <summary>
        /// Get statistics for the authenticated user's saved articles
        /// </summary>
        [HttpGet("user/stats")]
        public IActionResult GetUserSavedArticlesStats()
        {
            return ExecuteWithUserValidation(userId =>
            {
                var savedArticles = SavedArticle.GetUserSavedArticles(userId);
                var oneWeekAgo = DateTime.Now.AddDays(-7);
                
                return (object)new
                {
                    totalArticles = savedArticles.Count,
                    weeklyArticles = savedArticles.Count(a => a.SavedAt >= oneWeekAgo)
                };
            });
        }

        /// <summary>
        /// Search saved articles for the authenticated user
        /// </summary>
        [HttpGet("user/search")]
        public IActionResult SearchSavedArticles(string searchTerm)
        {
            return ExecuteWithUserValidation(userId =>
            {
                return (object)SavedArticle.SearchSavedArticles(userId, searchTerm);
            });
        }

        /// <summary>
        /// Save an article for the authenticated user
        /// </summary>
        [HttpPost]
        public IActionResult SaveArticle([FromBody] SaveArticleRequest request)
        {
            return ExecuteWithUserValidationConditional(
                userId => SavedArticle.SaveArticle(request.Article, userId),
                "Article saved successfully",
                "Failed to save article"
            );
        }

        /// <summary>
        /// Remove a saved article for the authenticated user
        /// </summary>
        [HttpDelete("article")]
        public IActionResult RemoveSavedArticle(int articleId)
        {
            return ExecuteWithUserValidationConditional(
                userId => SavedArticle.RemoveSavedArticle(userId, articleId),
                "Article removed successfully",
                "Failed to remove article",
                true
            );
        }

        /// <summary>
        /// Remove all saved articles for the authenticated user
        /// </summary>
        [HttpDelete("user/all")]
        public IActionResult RemoveAllSavedArticles()
        {
            return ExecuteWithUserValidation(userId =>
            {
                var savedArticles = SavedArticle.GetUserSavedArticles(userId);
                int deletedCount = 0;
                
                foreach (var article in savedArticles)
                {
                    if (SavedArticle.RemoveSavedArticle(userId, article.Id))
                    {
                        deletedCount++;
                    }
                }
                
                return (object)new { 
                    message = $"Removed {deletedCount} articles successfully", 
                    success = true,
                    deletedCount = deletedCount
                };
            });
        }

        public class SaveArticleRequest
        {
            public Article Article { get; set; } = new Article();
        }
    }
}
