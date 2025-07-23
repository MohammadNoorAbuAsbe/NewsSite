namespace Server.Models
{
    public class SharedContent
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string ArticleTitle { get; set; } = string.Empty;
        public string ArticleUrl { get; set; } = string.Empty;
        public string UserComment { get; set; } = string.Empty;
        public DateTime SharedAt { get; set; } = DateTime.Now;
        public bool IsReported { get; set; } = false;
        public int LikesCount { get; set; } = 0;
        
        // Static methods for CRUD operations
        public static List<SharedContent> GetAllSharedContent(int currentUserId)
        {
            DBservices db = new DBservices();
            return db.GetAllSharedContent(currentUserId);
        }
        
        public static List<SharedContent> GetFilteredSharedContent(int currentUserId, List<int> blockedUserIds)
        {
            DBservices db = new DBservices();
            return db.GetFilteredSharedContent(currentUserId, blockedUserIds);
        }
        
        public static bool ShareContent(SharedContent content)
        {
            DBservices db = new DBservices();
            return db.ShareContent(content);
        }
        
        public static bool ReportContent(int contentId, int reporterId)
        {
            DBservices db = new DBservices();
            return db.ReportContent(contentId, reporterId);
        }
        
        public static bool LikeContent(int contentId, int userId)
        {
            DBservices db = new DBservices();
            return db.LikeContent(contentId, userId);
        }
        
        public static bool UnlikeContent(int contentId, int userId)
        {
            DBservices db = new DBservices();
            return db.UnlikeContent(contentId, userId);
        }
    }
}
