using NewsAPI.Models;

namespace Server.Models
{
    public class SharedContent
    {
        public SharedContent(int userId, Article article, string userComment)
        {
            UserId = userId;
            Article = article;
            UserComment = userComment;
        }
        public SharedContent()
        {
        }

        public int Id { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public Article Article { get; set; } = new Article();
        public string UserComment { get; set; } = string.Empty;
        public DateTime SharedAt { get; set; } = DateTime.Now;
        public bool IsReported { get; set; } = false;
        public int LikesCount { get; set; } = 0;
        public int DislikesCount { get; set; } = 0;
        public bool UserHasLiked { get; set; } = false;
        public bool UserHasDisliked { get; set; } = false;

        // Static methods for CRUD operations using DataService
        public static List<SharedContent> GetAllSharedContent(int currentUserId)
        {
            return DataService.ExecuteList(db => db.GetAllSharedContent(currentUserId));
        }

        public static List<SharedContent> GetFilteredSharedContent(int currentUserId, List<int> blockedUserIds)
        {
            return DataService.ExecuteList(db => db.GetFilteredSharedContent(currentUserId, blockedUserIds));
        }

        public static bool ShareContent(SharedContent content)
        {
            return DataService.ExecuteBool(db => db.ShareContent(content));
        }

        public static bool ReportContent(int contentId, int reporterId)
        {
            return DataService.ExecuteBool(db => db.ReportContent(contentId, reporterId));
        }

        public static bool LikeContent(int contentId, int userId)
        {
            return DataService.ExecuteBool(db => db.LikeContent(contentId, userId));
        }

        public static bool UnlikeContent(int contentId, int userId)
        {
            return DataService.ExecuteBool(db => db.UnlikeContent(contentId, userId));
        }

        public static bool DislikeContent(int contentId, int userId)
        {
            return DataService.ExecuteBool(db => db.DislikeContent(contentId, userId));
        }

        public static bool UndislikeContent(int contentId, int userId)
        {
            return DataService.ExecuteBool(db => db.UndislikeContent(contentId, userId));
        }
    }
}