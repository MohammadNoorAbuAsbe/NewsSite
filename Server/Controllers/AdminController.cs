using Microsoft.AspNetCore.Mvc;
using Server.Models;

namespace Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        /// <summary>
        /// Get daily statistics for admin dashboard
        /// </summary>
        [HttpGet("stats/daily")]
        public IActionResult GetDailyStats([FromQuery] DateTime? date)
        {
            try
            {
                DateTime targetDate = date ?? DateTime.Today;
                var stats = AdminStats.GetDailyStats(targetDate);
                return Ok(stats);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        
        /// <summary>
        /// Get statistics for a date range
        /// </summary>
        [HttpGet("stats/range")]
        public IActionResult GetStatsRange([FromQuery] DateTime fromDate, [FromQuery] DateTime toDate)
        {
            try
            {
                var stats = AdminStats.GetStatsRange(fromDate, toDate);
                return Ok(stats);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        
        /// <summary>
        /// Get all users with their activity statistics
        /// </summary>
        [HttpGet("users")]
        public IActionResult GetAllUsersWithStats()
        {
            try
            {
                var users = UserManagement.GetAllUsersWithStats();
                return Ok(users);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        
        /// <summary>
        /// Enable or disable a user
        /// </summary>
        [HttpPut("users/{userId}/status")]
        public IActionResult ToggleUserStatus(int userId, [FromBody] UserStatusRequest request)
        {
            try
            {
                bool success = UserManagement.ToggleUserStatus(userId, request.IsEnabled);
                if (success)
                {
                    string action = request.IsEnabled ? "enabled" : "disabled";
                    return Ok(new { message = $"User {action} successfully" });
                }
                return BadRequest(new { message = "Failed to update user status" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        
        /// <summary>
        /// Get all reported content for admin review
        /// </summary>
        [HttpGet("reported-content")]
        public IActionResult GetReportedContent()
        {
            try
            {
                var reportedContent = UserManagement.GetReportedContent();
                return Ok(reportedContent);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        
        /// <summary>
        /// Handle reported content (remove or keep)
        /// </summary>
        [HttpPut("reported-content/{contentId}/handle")]
        public IActionResult HandleReportedContent(int contentId, [FromBody] HandleReportRequest request)
        {
            try
            {
                bool success = UserManagement.HandleReportedContent(contentId, request.RemoveContent);
                if (success)
                {
                    string action = request.RemoveContent ? "removed" : "kept";
                    return Ok(new { message = $"Content {action} successfully" });
                }
                return BadRequest(new { message = "Failed to handle reported content" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
    
    public class UserStatusRequest
    {
        public bool IsEnabled { get; set; }
    }
    
    public class HandleReportRequest
    {
        public bool RemoveContent { get; set; }
    }
}
