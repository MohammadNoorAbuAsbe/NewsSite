using Microsoft.AspNetCore.SignalR;
using Server.Hubs;
using Server.Models;

namespace Server.Services
{
    public class NotificationService
    {
        private readonly IHubContext<NotificationHub> _hubContext;

        public NotificationService(IHubContext<NotificationHub> hubContext)
        {
            _hubContext = hubContext;
        }

        /// <summary>
        /// Send notification to a specific user
        /// </summary>
        public async Task SendToUserAsync(int userId, string type, string title, string message, object? data = null)
        {
            var notification = new
            {
                Type = type,
                Title = title,
                Message = message,
                Data = data,
                Timestamp = DateTime.UtcNow
            };

            await _hubContext.Clients.Group($"User_{userId}").SendAsync("ReceiveNotification", notification);
        }

        /// <summary>
        /// Send notification to all admin users
        /// </summary>
        public async Task SendToAdminsAsync(string type, string title, string message, object? data = null)
        {
            var notification = new
            {
                Type = type,
                Title = title,
                Message = message,
                Data = data,
                Timestamp = DateTime.UtcNow
            };

            await _hubContext.Clients.Group("Admins").SendAsync("ReceiveNotification", notification);
        }

        /// <summary>
        /// Send notification to users with specific interests
        /// </summary>
        public async Task SendToInterestGroupAsync(string interest, string type, string title, string message, object? data = null)
        {
            var notification = new
            {
                Type = type,
                Title = title,
                Message = message,
                Data = data,
                Timestamp = DateTime.UtcNow
            };

            await _hubContext.Clients.Group($"Interest_{interest}").SendAsync("ReceiveNotification", notification);
        }

        /// <summary>
        /// Send breaking news notification to multiple interest groups
        /// </summary>
        public async Task SendBreakingNewsAsync(List<string> interests, string headline, string category, string url)
        {
            var notification = new
            {
                Type = "breaking_news",
                Title = "🚨 Breaking News",
                Message = headline,
                Data = new { Category = category, Url = url },
                Timestamp = DateTime.UtcNow
            };

            foreach (var interest in interests)
            {
                await _hubContext.Clients.Group($"Interest_{interest}").SendAsync("ReceiveNotification", notification);
            }
        }

        /// <summary>
        /// Notify user when their shared content gets interaction
        /// </summary>
        public async Task NotifyContentInteractionAsync(int contentOwnerId, string interactionType, string userName, string articleTitle)
        {
            var message = interactionType switch
            {
                "like" => $"{userName} liked your shared article: {articleTitle}",
                "comment" => $"{userName} commented on your shared article: {articleTitle}",
                "report" => $"Your shared article was reported: {articleTitle}",
                _ => $"{userName} interacted with your shared article: {articleTitle}"
            };

            await SendToUserAsync(contentOwnerId, "content_interaction", "Content Interaction", message, 
                new { InteractionType = interactionType, UserName = userName, ArticleTitle = articleTitle });
        }

        /// <summary>
        /// Notify admins about new content reports
        /// </summary>
        public async Task NotifyAdminsContentReportAsync(int contentId, string reportedBy, string reason, string articleTitle)
        {
            var message = $"New content report by {reportedBy}: {articleTitle}";
            
            await SendToAdminsAsync("content_report", "⚠️ Content Report", message,
                new { ContentId = contentId, ReportedBy = reportedBy, Reason = reason, ArticleTitle = articleTitle });
        }

        /// <summary>
        /// Notify user about security events
        /// </summary>
        public async Task NotifySecurityEventAsync(int userId, string eventType, string details)
        {
            var title = eventType switch
            {
                "login" => "🔐 New Login",
                "password_change" => "🔐 Password Changed",
                "failed_login" => "⚠️ Failed Login Attempt",
                _ => "🔐 Security Alert"
            };

            await SendToUserAsync(userId, "security", title, details);
        }

        /// <summary>
        /// Send admin dashboard updates
        /// </summary>
        public async Task SendAdminDashboardUpdateAsync(object dashboardData)
        {
            await _hubContext.Clients.Group("Admins").SendAsync("DashboardUpdate", dashboardData);
        }

        /// <summary>
        /// Notify users about new articles matching their saved searches
        /// </summary>
        public async Task NotifyMatchingArticleAsync(int userId, string searchTerm, string articleTitle, string articleUrl)
        {
            var message = $"New article found for your saved search '{searchTerm}': {articleTitle}";
            
            await SendToUserAsync(userId, "saved_search", "📰 New Article Match", message,
                new { SearchTerm = searchTerm, ArticleTitle = articleTitle, ArticleUrl = articleUrl });
        }

        /// <summary>
        /// Send daily summary notification
        /// </summary>
        public async Task NotifyDailySummaryReadyAsync(int userId)
        {
            await SendToUserAsync(userId, "daily_summary", "📊 Daily Summary Ready", 
                "Your personalized daily news summary is now available.");
        }
    }
}
