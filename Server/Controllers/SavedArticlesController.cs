using Microsoft.AspNetCore.Mvc;
using Server.Models;

namespace Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SavedArticlesController : ControllerBase
    {
        /// <summary>
        /// Get all saved articles for a specific user
        /// </summary>
        [HttpGet("user/{userId}")]
        public IActionResult GetUserSavedArticles(int userId)
        {
            try
            {
                var savedArticles = SavedArticle.GetUserSavedArticles(userId);
                return Ok(savedArticles);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        
        /// <summary>
        /// Search saved articles for a specific user
        /// </summary>
        [HttpGet("user/{userId}/search")]
        public IActionResult SearchSavedArticles(int userId, [FromQuery] string searchTerm)
        {
            try
            {
                var results = SavedArticle.SearchSavedArticles(userId, searchTerm);
                return Ok(results);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        
        /// <summary>
        /// Save an article for a user
        /// </summary>
        [HttpPost]
        public IActionResult SaveArticle([FromBody] SavedArticle article)
        {
            try

            {
                bool success = SavedArticle.SaveArticle(article);
                if (success)
                {
                    return Ok(new { message = "Article saved successfully" });
                }
                return BadRequest(new { message = "Failed to save article" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        
        /// <summary>
        /// Remove a saved article
        /// </summary>
        [HttpDelete("user/{userId}/article/{articleId}")]
        public IActionResult RemoveSavedArticle(int userId, int articleId)
        {
            try
            {
                bool success = SavedArticle.RemoveSavedArticle(userId, articleId);
                if (success)
                {
                    return Ok(new { message = "Article removed successfully" });
                }
                return BadRequest(new { message = "Failed to remove article" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
