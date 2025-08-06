namespace Server.Models
{
    public class Tag
    {
        #region Fields  
        string name;
        bool custom = false;
        private static List<Tag>? _cachedTags = null;
        private static DateTime _cacheTime = DateTime.MinValue;
        private static readonly TimeSpan CacheExpiry = TimeSpan.FromMinutes(10); // Cache for 10 minutes
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
            // Check if cache is valid
            if (_cachedTags != null && DateTime.Now - _cacheTime < CacheExpiry)
            {
                return _cachedTags;
            }

            // Cache is invalid, refresh it
            DBservices db = new DBservices();
            _cachedTags = db.GetAllTags();
            _cacheTime = DateTime.Now;
            return _cachedTags;
        }

        public static List<Tag> GetArticleTags(string title, string description, string category = null)
        {
            List<Tag> articleTags = new List<Tag>();
            List<Tag> allTags = GetAllTags(); // Now uses cached version
            
            string content = (title + " " + description).ToLower();
            
            foreach (var tag in allTags)
            {
                if (!tag.Custom && category != null && 
                    tag.Name.ToLower() == category.ToLower())
                {
                    articleTags.Add(tag);
                }
                else if (tag.Custom && content.Contains(tag.Name.ToLower()))
                {
                    articleTags.Add(tag);
                }
            }
            
            return articleTags;
        }

        public static void ClearCache()
        {
            _cachedTags = null;
        }
    }
}