using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Server.Models;

namespace Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminController : BaseController
    {
        /// <summary>
        /// Get summary statistics for admin dashboard
        /// </summary>
        [HttpGet("stats/summary")]
        public IActionResult GetStatsSummary()
        {
            return ExecuteWithErrorHandling(() =>
            {
                var stats = AdminStats.GetDailyStats(DateTime.Today);
                return new
                {
                    success = true,
                    totalUsers = stats.TotalUsers,
                    dailyLogins = stats.DailyLogins,
                    dailyNewsViews = stats.DailyNewsRequests,
                    dailySavedArticles = stats.DailySavedArticles
                };
            });
        }

        /// <summary>
        /// Get daily statistics for admin dashboard
        /// </summary>
        [HttpGet("stats/daily")]
        public IActionResult GetDailyStats([FromQuery] DateTime? date)
        {
            return ExecuteWithErrorHandling(() =>
            {
                DateTime targetDate = date ?? DateTime.Today;
                return AdminStats.GetDailyStats(targetDate);
            });
        }

        /// <summary>
        /// Get recent activity for admin dashboard
        /// </summary>
        [HttpGet("activity/recent")]
        public IActionResult GetRecentActivity()
        {
            return ExecuteWithErrorHandling(() =>
            {
                var activities = AdminStats.GetRecentActivity();
                return new { success = true, activities = activities };
            });
        }

        /// <summary>
        /// Get statistics for a date range
        /// </summary>
        [HttpGet("stats/range")]
        public IActionResult GetStatsRange([FromQuery] DateTime fromDate, [FromQuery] DateTime toDate)
        {
            return ExecuteWithErrorHandling(() =>
            {
                return AdminStats.GetStatsRange(fromDate, toDate);
            });
        }

        /// <summary>
        /// Get all users with their activity statistics
        /// </summary>
        [HttpGet("users")]
        public IActionResult GetAllUsersWithStats()
        {
            return ExecuteWithErrorHandling(() =>
            {
                return UserManagement.GetAllUsersWithStats();
            });
        }

        /// <summary>
        /// Enable or disable a user
        /// </summary>
        [HttpPut("users/{userId}/status")]
        public IActionResult ToggleUserStatus(int userId, [FromBody] UserStatusRequest request)
        {
            return ExecuteWithConditionalResponse(
                () => UserManagement.ToggleUserStatus(userId, request.IsEnabled),
                $"User {(request.IsEnabled ? "enabled" : "disabled")} successfully",
                "Failed to update user status"
            );
        }

        /// <summary>
        /// Get all reported content for admin review
        /// </summary>
        [HttpGet("reported-content")]
        public IActionResult GetReportedContent()
        {
            return ExecuteWithErrorHandling(() =>
            {
                var reportedContent = UserManagement.GetReportedContent();
                return new { success = true, reports = reportedContent };
            });
        }

        /// <summary>
        /// Handle reported content (remove or keep)
        /// </summary>
        [HttpPut("reported-content/{contentId}/handle")]
        public IActionResult HandleReportedContent(int contentId, [FromBody] HandleReportRequest request)
        {
            return ExecuteWithConditionalResponse(
                () => UserManagement.HandleReportedContent(contentId, request.RemoveContent),
                $"Content {(request.RemoveContent ? "removed" : "kept")} successfully",
                "Failed to handle reported content"
            );
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
