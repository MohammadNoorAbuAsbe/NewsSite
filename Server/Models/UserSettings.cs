namespace Server.Models
{
    public class BlockedUser
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }
    
    public class UserSettings
    {
        public int UserId { get; set; }
        public List<int> BlockedUserIds { get; set; } = new List<int>();
        public List<BlockedUser> BlockedUsers { get; set; } = new List<BlockedUser>();
        
        public static UserSettings GetUserSettings(int userId)
        {
            DBservices db = new DBservices();
            return db.GetUserSettings(userId);
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
