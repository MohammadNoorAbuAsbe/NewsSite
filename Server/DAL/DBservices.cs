using NewsAPI.Models;
using Server.Models;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Reflection.Metadata;
using System.Text;
using System.Web;

/// <summary>
/// DBServices is a class created by me to provides some DataBase Services
/// </summary>
public class DBservices
{
    public DBservices()
    {

    }

    //--------------------------------------------------------------------------------------------------
    // This method creates a connection to the database according to the connectionString name in the appsettings.json 
    //--------------------------------------------------------------------------------------------------
    public SqlConnection connect(String conString)
    {

        // read the connection string from the configuration file
        IConfigurationRoot configuration = new ConfigurationBuilder()
        .AddJsonFile("appsettings.json").Build();
        string cStr = configuration.GetConnectionString("myProjDB");
        SqlConnection con = new SqlConnection(cStr);
        con.Open();
        return con;
    }

    #region Tag Management
    public List<Tag> GetAllTags()
    {
        var paramDic = new Dictionary<string, object>();
        return ExecuteSqlCommandReturnList(paramDic, "SP_NewsSite_GetAllTags", MapTag);
    }
    #endregion

    #region Saved Articles
    public List<SavedArticle> GetUserSavedArticles(int userId)
    {
        var paramDic = new Dictionary<string, object>
        {
            ["@userId"] = userId
        };
        return ExecuteSqlCommandReturnList(paramDic, "SP_NewsSite_GetUserSavedArticles", MapSavedArticle);
    }

    public List<SavedArticle> SearchUserSavedArticles(int userId, string searchTerm)
    {
        var paramDic = new Dictionary<string, object>
        {
            ["@userId"] = userId,
            ["@searchTerm"] = searchTerm
        };
        return ExecuteSqlCommandReturnList(paramDic, "SP_NewsSite_SearchUserSavedArticles", MapSavedArticle);
    }

    public bool SaveArticle(Article article, int userID)
    {
        // First, add the article and get its ID
        int articleId = AddArticle(article);

        // Then share the content using the article ID
        var paramDic = new Dictionary<string, object>
        {
            ["@userId"] = userID,
            ["@articleId"] = articleId,
        };
        return ExecuteSQLCommand(paramDic, "SP_NewsSite_SaveArticle") > 0;
    }

    public bool RemoveSavedArticle(int userId, int articleId)
    {
        var paramDic = new Dictionary<string, object>
        {
            ["@userId"] = userId,
            ["@articleId"] = articleId
        };
        return ExecuteSQLCommand(paramDic, "SP_NewsSite_RemoveSavedArticle") > 0;
    }
    #endregion

    #region Shared Content
    public List<SharedContent> GetAllSharedContent(int currentUserId)
    {
        var paramDic = new Dictionary<string, object>
        {
            ["@currentUserId"] = currentUserId
        };
        return ExecuteSqlCommandReturnList(paramDic, "SP_NewsSite_GetAllSharedContent", MapSharedContent);
    }

    public List<SharedContent> GetFilteredSharedContent(int currentUserId, List<int> blockedUserIds)
    {
        var paramDic = new Dictionary<string, object>
        {
            ["@currentUserId"] = currentUserId
        };
        return ExecuteSqlCommandReturnList(paramDic, "SP_NewsSite_GetFilteredSharedContent", MapSharedContent);
    }

    public int AddArticle(Article article)
    {
        var paramDic = new Dictionary<string, object>
        {
            ["@title"] = article.Title ?? string.Empty,
            ["@description"] = article.Description ?? string.Empty,
            ["@url"] = article.Url ?? string.Empty,
            ["@urlToImage"] = article.UrlToImage ?? string.Empty,
            ["@publishedAt"] = article.PublishedAt ?? (object)DBNull.Value,
            ["@sourceName"] = article.Source?.Name ?? string.Empty
        };
        return ExecuteSQLCommand_ReturnInt(paramDic, "SP_NewsSite_AddArticle");
    }

    public bool ShareContent(SharedContent content)
    {
        // First, add the article and get its ID
        int articleId = AddArticle(content.Article);

        // Then share the content using the article ID
        var paramDic = new Dictionary<string, object>
        {
            ["@userId"] = content.UserId,
            ["@articleId"] = articleId,
            ["@userComment"] = content.UserComment
        };
        return ExecuteSQLCommand(paramDic, "SP_NewsSite_ShareContent") > 0;
    }

    public bool ReportContent(int contentId, int reporterId)
    {
        var paramDic = new Dictionary<string, object>
        {
            ["@contentId"] = contentId,
            ["@reporterId"] = reporterId
        };
        return ExecuteSQLCommand(paramDic, "SP_NewsSite_ReportContent") > 0;
    }

    public bool LikeContent(int contentId, int userId)
    {
        var paramDic = new Dictionary<string, object>
        {
            ["@contentId"] = contentId,
            ["@userId"] = userId
        };
        return ExecuteSQLCommand(paramDic, "SP_NewsSite_LikeContent") > 0;
    }

    public bool UnlikeContent(int contentId, int userId)
    {
        var paramDic = new Dictionary<string, object>
        {
            ["@contentId"] = contentId,
            ["@userId"] = userId
        };
        return ExecuteSQLCommand(paramDic, "SP_NewsSite_UnlikeContent") > 0;
    }

    public bool DislikeContent(int contentId, int userId)
    {
        var paramDic = new Dictionary<string, object>
        {
            ["@contentId"] = contentId,
            ["@userId"] = userId
        };
        return ExecuteSQLCommand(paramDic, "SP_NewsSite_DislikeContent") > 0;
    }

    public bool UndislikeContent(int contentId, int userId)
    {
        var paramDic = new Dictionary<string, object>
        {
            ["@contentId"] = contentId,
            ["@userId"] = userId
        };
        return ExecuteSQLCommand(paramDic, "SP_NewsSite_UndislikeContent") > 0;
    }
    #endregion

    #region User Settings
    public UserSettings GetUserSettings(int userId)
    {
        var paramDic = new Dictionary<string, object>
        {
            ["@userId"] = userId
        };
        var settingsList = ExecuteSqlCommandReturnList(paramDic, "SP_NewsSite_GetUserSettings", MapUserSettings);

        // Group by UserId and collect all blocked user IDs
        var userSettings = new UserSettings { UserId = userId };
        userSettings.BlockedUserIds = settingsList
            .Where(s => s.BlockedUserIds.Count > 0)
            .SelectMany(s => s.BlockedUserIds)
            .ToList();

        // Get blocked users with names
        userSettings.BlockedUsers = GetBlockedUsersWithNames(userSettings.BlockedUserIds);

        return userSettings;
    }

    public List<BlockedUser> GetBlockedUsersWithNames(List<int> blockedUserIds)
    {
        if (blockedUserIds == null || blockedUserIds.Count == 0)
            return new List<BlockedUser>();

        var blockedUsers = new List<BlockedUser>();
        var allUsers = GetUsers();

        foreach (var userId in blockedUserIds)
        {
            var user = allUsers.FirstOrDefault(u => u.Id == userId);
            if (user != null)
            {
                blockedUsers.Add(new BlockedUser
                {
                    Id = user.Id,
                    Name = user.Name
                });
            }
        }

        return blockedUsers;
    }

    public bool BlockUser(int userId, int userToBlockId)
    {
        var paramDic = new Dictionary<string, object>
        {
            ["@userId"] = userId,
            ["@userToBlockId"] = userToBlockId
        };
        return ExecuteSQLCommand(paramDic, "SP_NewsSite_BlockUser") > 0;
    }

    public bool UnblockUser(int userId, int userToUnblockId)
    {
        var paramDic = new Dictionary<string, object>
        {
            ["@userId"] = userId,
            ["@userToUnblockId"] = userToUnblockId
        };
        return ExecuteSQLCommand(paramDic, "SP_NewsSite_UnblockUser") > 0;
    }
    #endregion

    #region Admin Functions
    public AdminStats GetAdminStats(DateTime date)
    {
        var paramDic = new Dictionary<string, object>
        {
            ["@date"] = date
        };
        return ExecuteSqlCommandReturnList(paramDic, "SP_NewsSite_GetAdminStats", MapAdminStats).FirstOrDefault() ?? new AdminStats();
    }

    public List<AdminStats> GetStatsRange(DateTime fromDate, DateTime toDate)
    {
        var paramDic = new Dictionary<string, object>
        {
            ["@fromDate"] = fromDate,
            ["@toDate"] = toDate
        };
        return ExecuteSqlCommandReturnList(paramDic, "SP_NewsSite_GetStatsRange", MapAdminStats);
    }

    public List<ActivityLog> GetRecentActivity()
    {
        var paramDic = new Dictionary<string, object>();
        return ExecuteSqlCommandReturnList(paramDic, "SP_NewsSite_GetRecentActivity", MapActivityLog);
    }

    public List<User> GetAllUsersWithStats()
    {
        var paramDic = new Dictionary<string, object>();
        return ExecuteSqlCommandReturnList(paramDic, "SP_NewsSite_GetAllUsersWithStats", MapUserWithStats);
    }

    public bool ToggleUserStatus(int userId, bool isEnabled)
    {
        var paramDic = new Dictionary<string, object>
        {
            ["@userId"] = userId,
            ["@isEnabled"] = isEnabled
        };
        return ExecuteSQLCommand(paramDic, "SP_NewsSite_ToggleUserStatus") > 0;
    }

    public List<SharedContent> GetReportedContent()
    {
        var paramDic = new Dictionary<string, object>();
        return ExecuteSqlCommandReturnList(paramDic, "SP_NewsSite_GetReportedContent", MapSharedContent);
    }

    public bool HandleReportedContent(int contentId, bool removeContent)
    {
        var paramDic = new Dictionary<string, object>
        {
            ["@contentId"] = contentId,
            ["@removeContent"] = removeContent
        };
        return ExecuteSQLCommand(paramDic, "SP_NewsSite_HandleReportedContent") > 0;
    }

    public void LogUserActivity(int userId, string activityType)
    {
        var paramDic = new Dictionary<string, object>
        {
            ["@userId"] = userId,
            ["@activityType"] = activityType,
            ["@timestamp"] = DateTime.Now
        };
        ExecuteSQLCommand(paramDic, "SP_NewsSite_LogUserActivity");
    }
    #endregion

    #region Getters
    /// <summary>
    /// Retrieves a list of users from the data source using a stored procedure.
    /// </summary>
    /// <returns>List of user objects.</returns>
    public List<User> GetUsers()
    {
        return GetUsersHelper("SP_NewsSite_GetUsers", new Dictionary<string, object>(), users => users);
    }

    /// <summary>
    /// Attempts to log in a user by email using a stored procedure and returns the first matching user, or null if not found.
    /// </summary>
    /// <param name="email">The email address of the user to log in.</param>
    /// <returns>The matching user object if found; otherwise, null.</returns>
    public User? LoginUser(string email)
    {
        Dictionary<string, object> paramDic = new Dictionary<string, object>();
        paramDic.Add("@email", email);
        return GetUsersHelper("SP_NewsSite_LoginUser", paramDic, users => users.FirstOrDefault());
    }

    /// <summary>
    /// Executes a stored procedure to retrieve a list of users and applies a selector function to the result.
    /// </summary>
    /// <typeparam name="T">The type returned by the selector function.</typeparam>
    /// <param name="storedProcedureBaseName">The base name of the stored procedure to execute.</param>
    /// <param name="parameters">A dictionary of parameters for the stored procedure.</param>
    /// <param name="resultSelector">A function to transform the list of users into the desired result type.</param>
    /// <returns>The result of applying the selector function to the list of users.</returns>
    private T GetUsersHelper<T>(string storedProcedureBaseName, Dictionary<string, object> parameters, Func<List<User>, T> resultSelector)
    {
        List<User> users = ExecuteSqlCommandReturnList(parameters, storedProcedureBaseName, MapUser);
        return resultSelector(users);
    }
    #endregion

    #region Inserts
    /// <summary>
    /// Registers a new user by inserting their details into the database and returns the created user object, or null if registration fails.
    /// </summary>
    /// <param name="user">The user object containing name, email, and password.</param>
    /// <returns>The registered user object if successful; otherwise, null.</returns>
    public User? RegisterUser(User user)
    {
        var paramDic = new Dictionary<string, object>
        {
            ["@name"] = user.Name,
            ["@email"] = user.Email,
            ["@password"] = user.Password
        };
        return GetUsersHelper("SP_NewsSite_RegisterUser", paramDic, users => users.FirstOrDefault());
    }
    #endregion

    #region Mappers
    /// <summary>
    /// Maps the current row of a SqlDataReader to a user object.
    /// </summary>
    /// <param name="reader">The SqlDataReader containing the data to map.</param>
    /// <returns>A user object populated with the data from the SqlDataReader.</returns>
    /// <exception cref="ArgumentNullException">Thrown if the reader is null.</exception>
    private User MapUser(SqlDataReader reader)
    {
        if (reader == null) throw new ArgumentNullException(nameof(reader));

        return new User
        {
            Id = reader.GetInt32(reader.GetOrdinal("Id")),
            Name = reader.GetString(reader.GetOrdinal("Name")),
            Email = reader.GetString(reader.GetOrdinal("Email")),
            Password = reader.GetString(reader.GetOrdinal("Password")),
            IsAdmin = reader.GetBoolean(reader.GetOrdinal("IsAdmin")),
            IsEnabled = reader.GetBoolean(reader.GetOrdinal("IsEnabled"))
        };
    }

    private User MapUserWithStats(SqlDataReader reader)
    {
        if (reader == null) throw new ArgumentNullException(nameof(reader));

        return new User
        {
            Id = reader.GetInt32(reader.GetOrdinal("Id")),
            Name = reader.GetString(reader.GetOrdinal("Name")),
            Email = reader.GetString(reader.GetOrdinal("Email")),
            Password = string.Empty, // Don't expose passwords in admin views
            IsAdmin = reader.GetBoolean(reader.GetOrdinal("IsAdmin")),
            IsEnabled = reader.GetBoolean(reader.GetOrdinal("IsEnabled"))
        };
    }

    private Tag MapTag(SqlDataReader reader)
    {
        return new Tag(
            reader.GetString(reader.GetOrdinal("Name")),
            reader.GetBoolean(reader.GetOrdinal("Custom"))
        );
    }

    private SavedArticle MapSavedArticle(SqlDataReader reader)
    {
        return new SavedArticle
        {
            Id = reader.GetInt32(reader.GetOrdinal("Id")),
            Article = new Article
            {
                Title = reader.GetString(reader.GetOrdinal("ArticleTitle")),
                Url = reader.GetString(reader.GetOrdinal("ArticleUrl")),
                Description = reader.IsDBNull(reader.GetOrdinal("ArticleDescription")) ? null : reader.GetString(reader.GetOrdinal("ArticleDescription")),
                UrlToImage = reader.IsDBNull(reader.GetOrdinal("ArticleImageUrl")) ? null : reader.GetString(reader.GetOrdinal("ArticleImageUrl")),
                PublishedAt = reader.IsDBNull(reader.GetOrdinal("ArticlePublishedAt")) ? null : reader.GetDateTime(reader.GetOrdinal("ArticlePublishedAt")),
                Source = reader.IsDBNull(reader.GetOrdinal("ArticleSource")) ? null : new NewsAPI.Models.Source { Name = reader.GetString(reader.GetOrdinal("ArticleSource")) }
            },
            SavedAt = reader.GetDateTime(reader.GetOrdinal("SavedAt"))
        };
    }

    private SharedContent MapSharedContent(SqlDataReader reader)
    {
        return new SharedContent
        {
            Id = reader.GetInt32(reader.GetOrdinal("Id")),
            UserId = reader.GetInt32(reader.GetOrdinal("UserId")),
            UserName = reader.GetString(reader.GetOrdinal("UserName")),
            Article = new Article
            {
                Title = reader.GetString(reader.GetOrdinal("ArticleTitle")),
                Url = reader.GetString(reader.GetOrdinal("ArticleUrl")),
                Description = reader.IsDBNull(reader.GetOrdinal("ArticleDescription")) ? null : reader.GetString(reader.GetOrdinal("ArticleDescription")),
                UrlToImage = reader.IsDBNull(reader.GetOrdinal("ArticleImageUrl")) ? null : reader.GetString(reader.GetOrdinal("ArticleImageUrl")),
                PublishedAt = reader.IsDBNull(reader.GetOrdinal("ArticlePublishedAt")) ? null : reader.GetDateTime(reader.GetOrdinal("ArticlePublishedAt")),
                Source = reader.IsDBNull(reader.GetOrdinal("ArticleSource")) ? null : new NewsAPI.Models.Source { Name = reader.GetString(reader.GetOrdinal("ArticleSource")) }
            },
            UserComment = reader.GetString(reader.GetOrdinal("UserComment")),
            SharedAt = reader.GetDateTime(reader.GetOrdinal("SharedAt")),
            IsReported = reader.GetBoolean(reader.GetOrdinal("IsReported")),
            LikesCount = reader.GetInt32(reader.GetOrdinal("LikesCount")),
            DislikesCount = reader.GetInt32(reader.GetOrdinal("DislikesCount")),
            UserHasLiked = HasColumn(reader, "UserHasLiked") ? (reader.GetInt32(reader.GetOrdinal("UserHasLiked")) == 1) : false,
            UserHasDisliked = HasColumn(reader, "UserHasDisliked") ? (reader.GetInt32(reader.GetOrdinal("UserHasDisliked")) == 1) : false
        };
    }

    private bool HasColumn(SqlDataReader reader, string columnName)
    {
        try
        {
            return reader.GetOrdinal(columnName) >= 0;
        }
        catch (IndexOutOfRangeException)
        {
            return false;
        }
    }

    private UserSettings MapUserSettings(SqlDataReader reader)
    {
        var blockedUserIds = new List<int>();

        // In the new structure, each row represents one blocked user relationship
        // BlockedUserId is now NOT NULL in the new schema, so we can directly read it
        blockedUserIds.Add(reader.GetInt32(reader.GetOrdinal("BlockedUserId")));

        return new UserSettings
        {
            UserId = reader.GetInt32(reader.GetOrdinal("UserId")),
            BlockedUserIds = blockedUserIds
        };
    }

    private AdminStats MapAdminStats(SqlDataReader reader)
    {
        return new AdminStats
        {
            DailyLogins = reader.GetInt32(reader.GetOrdinal("DailyLogins")),
            DailyNewsRequests = reader.GetInt32(reader.GetOrdinal("DailyNewsRequests")),
            DailySavedArticles = reader.GetInt32(reader.GetOrdinal("DailySavedArticles")),
            TotalUsers = reader.GetInt32(reader.GetOrdinal("TotalUsers")),
            ActiveUsers = reader.GetInt32(reader.GetOrdinal("ActiveUsers")),
            ReportedContent = reader.GetInt32(reader.GetOrdinal("ReportedContent")),
            Date = reader.GetDateTime(reader.GetOrdinal("Date"))
        };
    }

    private ActivityLog MapActivityLog(SqlDataReader reader)
    {
        return new ActivityLog
        {
            ActivityType = reader.GetString(reader.GetOrdinal("ActivityType")),
            UserName = reader.GetString(reader.GetOrdinal("UserName")),
            Timestamp = reader.GetDateTime(reader.GetOrdinal("Timestamp")),
            Details = reader.IsDBNull(reader.GetOrdinal("Details")) ? "" : reader.GetString(reader.GetOrdinal("Details"))
        };
    }
    #endregion

    #region SQL commands
    public int ExecuteSQLCommand_ReturnInt(Dictionary<string, object> paramDic, string spName)
    {
        SqlConnection con = null;
        SqlCommand cmd = null;
        SqlDataReader reader = null;
        try
        {
            con = connect("myProjDB");
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }
        cmd = CreateCommandWithStoredProcedureGeneral(spName, con, paramDic);       // create the command
        try
        {
            reader = cmd.ExecuteReader(); // execute the command
            if (reader.Read())
            {
                int numEffected = reader.GetInt32(0);
                return numEffected;
            }
            else
            {
                return 0;
            }
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }
        finally
        {
            reader?.Close();
            con?.Close();
        }
    }

    /// <summary>
    /// Executes a stored procedure with the given parameters and maps each result row to a type T using the provided mapper function.
    /// </summary>
    /// <param name="paramDic">Dictionary of parameter names and values for the stored procedure.</param>
    /// <param name="spName">Name of the stored procedure to execute.</param>
    /// <param name="mapper">Function to map each SqlDataReader row to an object of type T.</param>
    /// <returns>List of objects of type T resulting from the query.</returns>
    /// <exception cref="ArgumentNullException">Thrown if spName, paramDic, or mapper is null.</exception>
    /// <exception cref="Exception">Propagates any exceptions thrown during database operations.</exception>
    public List<T> ExecuteSqlCommandReturnList<T>(Dictionary<string, object> paramDic, string spName, Func<SqlDataReader, T> mapper)
    {
        if (spName == null) throw new ArgumentNullException(nameof(spName));
        if (paramDic == null) throw new ArgumentNullException(nameof(paramDic));
        if (mapper == null) throw new ArgumentNullException(nameof(mapper));
        var resultList = new List<T>();

        try
        {
            using (var con = connect("myProjDB"))
            {
                using (var cmd = CreateCommandWithStoredProcedureGeneral(spName, con, paramDic))
                {
                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            resultList.Add(mapper(reader));
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            throw ex;
        }

        return resultList;
    }

    public int ExecuteSQLCommand(Dictionary<string, object> paramDic, string spName)
    {

        SqlConnection con;
        SqlCommand cmd;

        try
        {
            con = connect("myProjDB"); // create the connection
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }


        cmd = CreateCommandWithStoredProcedureGeneral(spName, con, paramDic);       // create the command

        try
        {
            int numEffected = cmd.ExecuteNonQuery(); // execute the command
            return numEffected;
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        finally
        {
            if (con != null)
            {
                // close the db connection
                con.Close();
            }
        }

    }

    //---------------------------------------------------------------------------------
    // Create the SqlCommand
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGeneral(String spName, SqlConnection con, Dictionary<string, object> paramDic)
    {

        SqlCommand cmd = new SqlCommand(); // create the command object

        cmd.Connection = con;              // assign the connection to the command object

        cmd.CommandText = spName;      // can be Select, Insert, Update, Delete 

        cmd.CommandTimeout = 10;           // Time to wait for the execution' The default is 30 seconds

        cmd.CommandType = System.Data.CommandType.StoredProcedure; // the type of the command, can also be text

        if (paramDic != null)
            foreach (KeyValuePair<string, object> param in paramDic)
            {
                cmd.Parameters.AddWithValue(param.Key, param.Value);

            }


        return cmd;
    }
    #endregion
}