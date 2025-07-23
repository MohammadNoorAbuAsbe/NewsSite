using Microsoft.AspNetCore.Mvc;
using Server.Models;

namespace Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SharedContentController : ControllerBase
    {
        /// <summary>
        /// Get all shared content filtered by user preferences
        /// </summary>
        [HttpGet("user/{userId}")]
        public IActionResult GetSharedContent(int userId)
        {
            try
            {
                var userSettings = UserSettings.GetUserSettings(userId);
                var sharedContent = SharedContent.GetFilteredSharedContent(userId, userSettings.BlockedUserIds);
                return Ok(sharedContent);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        
        /// <summary>
        /// Share content with a comment
        /// </summary>
        [HttpPost]
        public IActionResult ShareContent([FromBody] SharedContent content)
        {
            try
            {
                bool success = SharedContent.ShareContent(content);
                if (success)
                {
                    return Ok(new { message = "Content shared successfully" });
                }
                return BadRequest(new { message = "Failed to share content" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        
        /// <summary>
        /// Report shared content as offensive
        /// </summary>
        [HttpPost("{contentId}/report")]
        public IActionResult ReportContent(int contentId, [FromBody] ReportRequest request)
        {
            try
            {
                bool success = SharedContent.ReportContent(contentId, request.ReporterId);
                if (success)
                {
                    return Ok(new { message = "Content reported successfully" });
                }
                return BadRequest(new { message = "Failed to report content" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        
        /// <summary>
        /// Like shared content
        /// </summary>
        [HttpPost("{contentId}/like")]
        public IActionResult LikeContent(int contentId, [FromBody] LikeRequest request)
        {
            try
            {
                bool success = SharedContent.LikeContent(contentId, request.UserId);
                if (success)
                {
                    return Ok(new { message = "Content liked successfully" });
                }
                return BadRequest(new { message = "Failed to like content" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        
        /// <summary>
        /// Unlike shared content
        /// </summary>
        [HttpDelete("{contentId}/like")]
        public IActionResult UnlikeContent(int contentId, [FromBody] LikeRequest request)
        {
            try
            {
                bool success = SharedContent.UnlikeContent(contentId, request.UserId);
                if (success)
                {
                    return Ok(new { message = "Content unliked successfully" });
                }
                return BadRequest(new { message = "Failed to unlike content" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
    
    public class ReportRequest
    {
        public int ReporterId { get; set; }
    }
    
    public class LikeRequest
    {
        public int UserId { get; set; }
    }
}
