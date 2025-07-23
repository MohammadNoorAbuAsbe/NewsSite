namespace Server.Models
{
    public class UserSettings
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public List<int> BlockedUserIds { get; set; } = new List<int>();
        public List<string> PreferredTags { get; set; } = new List<string>();
        public bool NotificationsEnabled { get; set; } = true;
        
        public static UserSettings GetUserSettings(int userId)
        {
            DBservices db = new DBservices();
            return db.GetUserSettings(userId);
        }
        
        public static bool UpdateUserSettings(UserSettings settings)
        {
            DBservices db = new DBservices();
            return db.UpdateUserSettings(settings);
        }
        
        public static bool BlockUser(int userId, int userToBlockId)
        {
            DBservices db = new DBservices();
            return db.BlockUser(userId, userToBlockId);
        }
        
        public static bool UnblockUser(int userId, int userToUnblockId)
        {
            DBservices db = new DBservices();
            return db.UnblockUser(userId, userToUnblockId);
        }
    }
}
