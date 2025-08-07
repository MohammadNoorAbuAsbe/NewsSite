using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Server.Models;
using NewsAPI.Models;
using System.Security.Claims;

namespace Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SharedContentController : BaseController
    {
        /// <summary>
        /// Get all shared content filtered by user preferences
        /// </summary>
        [HttpGet("user")]
        public IActionResult GetSharedContent()
        {
            return ExecuteWithUserValidation(userId =>
            {
                var userSettings = UserSettings.GetUserSettings(userId);
                return (object)SharedContent.GetFilteredSharedContent(userId);
            });
        }

        /// <summary>
        /// Share content with a comment
        /// </summary>
        [HttpPost]
        public IActionResult ShareContent([FromBody] ShareContentRequest request)
        {
            return ExecuteWithUserValidationConditional(
                userId =>
                {
                    var sharedContent = new SharedContent(userId, request.Article, request.UserComment);
                    var result = SharedContent.ShareContent(sharedContent);
                    if (result) Models.User.LogUserActivity(userId, "share_content");
                    return result;
                },
                "Content shared successfully",
                "Failed to share content"
            );
        }

        /// <summary>
        /// Report shared content as offensive
        /// </summary>
        [HttpPost("report")]
        public IActionResult ReportContent([FromBody] ReportRequest request)
        {
            return ExecuteWithConditionalResponse(
                () => {
                    var result = SharedContent.ReportContent(request.ContentId, request.ReporterId);
                    if (result) Models.User.LogUserActivity(request.ReporterId, "report_content");
                    return result;
                },
                "Content reported successfully",
                "Failed to report content"
            );
        }

        /// <summary>
        /// Like shared content
        /// </summary>
        [HttpPost("like")]
        public IActionResult LikeContent([FromBody] ContentReactionRequest request)
        {
            return HandleContentReaction(request, ContentReactionType.Like);
        }

        /// <summary>
        /// Unlike shared content
        /// </summary>
        [HttpPost("unlike")]
        public IActionResult UnlikeContent([FromBody] ContentReactionRequest request)
        {
            return HandleContentReaction(request, ContentReactionType.Unlike);
        }

        /// <summary>
        /// Dislike shared content
        /// </summary>
        [HttpPost("dislike")]
        public IActionResult DislikeContent([FromBody] ContentReactionRequest request)
        {
            return HandleContentReaction(request, ContentReactionType.Dislike);
        }

        /// <summary>
        /// Remove dislike from shared content
        /// </summary>
        [HttpPost("undislike")]
        public IActionResult UndislikeContent([FromBody] ContentReactionRequest request)
        {
            return HandleContentReaction(request, ContentReactionType.Undislike);
        }

        /// <summary>
        /// Generic method to handle all content reactions (like, unlike, dislike, undislike)
        /// </summary>
        private IActionResult HandleContentReaction(ContentReactionRequest request, ContentReactionType reactionType)
        {
            var (operation, successMessage, errorMessage) = GetReactionDetails(reactionType);
            var activityType = GetActivityType(reactionType);

            return ExecuteWithConditionalResponse(
                () => {
                    var result = operation(request.ContentId, request.UserId);
                    if (result) Models.User.LogUserActivity(request.UserId, activityType);
                    return result;
                },
                successMessage,
                errorMessage
            );
        }

        /// <summary>
        /// Get the appropriate operation and messages for the reaction type
        /// </summary>
        private static (Func<int, int, bool> operation, string successMessage, string errorMessage) GetReactionDetails(ContentReactionType reactionType)
        {
            return reactionType switch
            {
                ContentReactionType.Like => (SharedContent.LikeContent, "Content liked successfully", "Failed to like content"),
                ContentReactionType.Unlike => (SharedContent.UnlikeContent, "Content unliked successfully", "Failed to unlike content"),
                ContentReactionType.Dislike => (SharedContent.DislikeContent, "Content disliked successfully", "Failed to dislike content"),
                ContentReactionType.Undislike => (SharedContent.UndislikeContent, "Content undisliked successfully", "Failed to undislike content"),
                _ => throw new ArgumentException($"Unknown reaction type: {reactionType}")
            };
        }

        /// <summary>
        /// Get the activity type for logging based on the reaction type
        /// </summary>
        private static string GetActivityType(ContentReactionType reactionType)
        {
            return reactionType switch
            {
                ContentReactionType.Like => "like_content",
                ContentReactionType.Unlike => "unlike_content",
                ContentReactionType.Dislike => "dislike_content",
                ContentReactionType.Undislike => "undislike_content",
                _ => throw new ArgumentException($"Unknown reaction type: {reactionType}")
            };
        }
    }

    public enum ContentReactionType
    {
        Like,
        Unlike,
        Dislike,
        Undislike
    }

    public class ShareContentRequest
    {
        public Article Article { get; set; } = new Article();
        public string UserComment { get; set; } = string.Empty;
    }

    public class ReportRequest
    {
        public int ContentId { get; set; }
        public int ReporterId { get; set; }
    }

    public class ContentReactionRequest
    {
        public int ContentId { get; set; }
        public int UserId { get; set; }
    }
}
