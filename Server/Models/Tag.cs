namespace Server.Models
{
    public class Tag
    {
        #region Fields  
        string name;
        bool custom = false;
        #endregion


        public Tag(string name, bool custom = false)
        {
            Name = name;
            Custom = custom;
        }

        public string Name { get => name; set => name = value; }
        public bool Custom { get => custom; set => custom = value; }

        public static List<Tag> GetAllTags()
        {
            DBservices db = new DBservices();
            return db.GetAllTags();
        }

        public List<Tag> GetInterests(int userId)
        {
            DBservices db = new DBservices();
            return db.GetUserTags(userId);
        }

        public void AddInterest(int userId, string tagName)
        {
            DBservices db = new DBservices();
            db.AddUserTag(userId, tagName);
        }

        public void RemoveInterest(int userId, string tagName)
        {
            DBservices db = new DBservices();
            db.RemoveUserTag(userId, tagName);
        }
    }
}