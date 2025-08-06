namespace Server.Models
{
    public class AdminStats
    {
        public int DailyLogins { get; set; }
        public int DailyNewsRequests { get; set; }
        public int DailySavedArticles { get; set; }
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int ReportedContent { get; set; }
        public DateTime Date { get; set; } = DateTime.Today;

        public static AdminStats GetDailyStats(DateTime date)
        {
            DBservices db = new DBservices();
            return db.GetAdminStats(date);
        }

        public static List<AdminStats> GetStatsRange(DateTime fromDate, DateTime toDate)
        {
            DBservices db = new DBservices();
            return db.GetStatsRange(fromDate, toDate);
        }

        public static List<ActivityLog> GetRecentActivity()
        {
            DBservices db = new DBservices();
            return db.GetRecentActivity();
        }
    }

    public class ActivityLog
    {
        public string ActivityType { get; set; }
        public string UserName { get; set; }
        public DateTime Timestamp { get; set; }
        public string Details { get; set; }
    }

    public class UserManagement
    {
        public static List<User> GetAllUsersWithStats()
        {
            DBservices db = new DBservices();
            return db.GetAllUsersWithStats();
        }

        public static bool ToggleUserStatus(int userId, bool isEnabled)
        {
            DBservices db = new DBservices();
            return db.ToggleUserStatus(userId, isEnabled);
        }

        public static List<SharedContent> GetReportedContent()
        {
            DBservices db = new DBservices();
            return db.GetReportedContent();
        }

        public static bool HandleReportedContent(int contentId, bool removeContent)
        {
            DBservices db = new DBservices();
            return db.HandleReportedContent(contentId, removeContent);
        }
    }
}
