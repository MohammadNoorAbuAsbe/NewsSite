using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data.SqlClient;
using System.Data;
using System.Text;
using Server.Models;

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

    public List<Tag> GetUserTags(int userId)
    {
        var paramDic = new Dictionary<string, object>
        {
            ["@userId"] = userId
        };
        return ExecuteSqlCommandReturnList(paramDic, "SP_NewsSite_GetUserTags", MapTag);
    }

    public void AddUserTag(int userId, string tagName)
    {
        var paramDic = new Dictionary<string, object>
        {
            ["@userId"] = userId,
            ["@tagName"] = tagName
        };
        ExecuteSQLCommand(paramDic, "SP_NewsSite_AddUserTag");
    }

    public void RemoveUserTag(int userId, string tagName)
    {
        var paramDic = new Dictionary<string, object>
        {
            ["@userId"] = userId,
            ["@tagName"] = tagName
        };
        ExecuteSQLCommand(paramDic, "SP_NewsSite_RemoveUserTag");
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

    public bool SaveArticle(SavedArticle article)
    {
        var paramDic = new Dictionary<string, object>
        {
    
            ["@userId"] = article.UserId,
            ["@title"] = article.Title,
            ["@description"] = article.Description,
            ["@url"] = article.Url,
            ["@urlToImage"] = article.UrlToImage,
            ["@source"] = article.Source,
            ["@publishedAt"] = article.PublishedAt,

          
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
            ["@currentUserId"] = currentUserId,
            ["@blockedUserIds"] = string.Join(",", blockedUserIds)
        };
        return ExecuteSqlCommandReturnList(paramDic, "SP_NewsSite_GetFilteredSharedContent", MapSharedContent);
    }

    public bool ShareContent(SharedContent content)
    {
        var paramDic = new Dictionary<string, object>
        {
            ["@userId"] = content.UserId,
            ["@articleTitle"] = content.ArticleTitle,
            ["@articleUrl"] = content.ArticleUrl,
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
    #endregion

    #region User Settings
    public UserSettings GetUserSettings(int userId)
    {
        var paramDic = new Dictionary<string, object>
        {
            ["@userId"] = userId
        };
        var settings = ExecuteSqlCommandReturnList(paramDic, "SP_NewsSite_GetUserSettings", MapUserSettings).FirstOrDefault();
        return settings ?? new UserSettings { UserId = userId };
    }

    public bool UpdateUserSettings(UserSettings settings)
    {
        var paramDic = new Dictionary<string, object>
        {
            ["@userId"] = settings.UserId,
            ["@blockedUserIds"] = string.Join(",", settings.BlockedUserIds),
            ["@preferredTags"] = string.Join(",", settings.PreferredTags),
            ["@notificationsEnabled"] = settings.NotificationsEnabled
        };
        return ExecuteSQLCommand(paramDic, "SP_NewsSite_UpdateUserSettings") > 0;
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

    public List<User> GetAllUsersWithStats()
    {
        var paramDic = new Dictionary<string, object>();
        return ExecuteSqlCommandReturnList(paramDic, "SP_NewsSite_GetAllUsersWithStats", MapUser);
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
    /// <returns>List of User objects.</returns>
    public List<User> GetUsers()
    {
        return GetUsersHelper("SP_NewsSite_GetUsers", new Dictionary<string, object>(), users => users);
    }

    /// <summary>
    /// Attempts to log in a user by email using a stored procedure and returns the first matching User, or null if not found.
    /// </summary>
    /// <param name="email">The email address of the user to log in.</param>
    /// <returns>The matching User object if found; otherwise, null.</returns>
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
    /// <returns>The registered User object if successful; otherwise, null.</returns>
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
    /// Maps the current row of a SqlDataReader to a User object.
    /// </summary>
    /// <param name="reader">The SqlDataReader containing the data to map.</param>
    /// <returns>A User object populated with the data from the SqlDataReader.</returns>
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
            
            UserId = reader.GetInt32(reader.GetOrdinal("UserId")),
            Title = reader.GetString(reader.GetOrdinal("Title")),
            Description = reader.GetString(reader.GetOrdinal("Description")),
            Url = reader.GetString(reader.GetOrdinal("Url")),
            UrlToImage = reader.GetString(reader.GetOrdinal("UrlToImage")),
            Source = reader.GetString(reader.GetOrdinal("Source")),
            PublishedAt = reader.GetDateTime(reader.GetOrdinal("PublishedAt")),
            SavedAt = reader.GetDateTime(reader.GetOrdinal("SavedAt")),
            Id = reader.GetInt32(reader.GetOrdinal("Id"))
        };
    }

    private SharedContent MapSharedContent(SqlDataReader reader)
    {
        return new SharedContent
        {
            Id = reader.GetInt32(reader.GetOrdinal("Id")),
            UserId = reader.GetInt32(reader.GetOrdinal("UserId")),
            UserName = reader.GetString(reader.GetOrdinal("UserName")),
            ArticleTitle = reader.GetString(reader.GetOrdinal("ArticleTitle")),
            ArticleUrl = reader.GetString(reader.GetOrdinal("ArticleUrl")),
            UserComment = reader.GetString(reader.GetOrdinal("UserComment")),
            SharedAt = reader.GetDateTime(reader.GetOrdinal("SharedAt")),
            IsReported = reader.GetBoolean(reader.GetOrdinal("IsReported")),
            LikesCount = reader.GetInt32(reader.GetOrdinal("LikesCount"))
        };
    }

    private UserSettings MapUserSettings(SqlDataReader reader)
    {
        var blockedUserIds = new List<int>();
        var preferredTags = new List<string>();
        
        string blockedUsersStr = reader.IsDBNull(reader.GetOrdinal("BlockedUserIds")) ? "" : reader.GetString(reader.GetOrdinal("BlockedUserIds"));
        string tagsStr = reader.IsDBNull(reader.GetOrdinal("PreferredTags")) ? "" : reader.GetString(reader.GetOrdinal("PreferredTags"));
        
        if (!string.IsNullOrEmpty(blockedUsersStr))
            blockedUserIds = blockedUsersStr.Split(',').Select(int.Parse).ToList();
        
        if (!string.IsNullOrEmpty(tagsStr))
            preferredTags = tagsStr.Split(',').ToList();

        return new UserSettings
        {
            Id = reader.GetInt32(reader.GetOrdinal("Id")),
            UserId = reader.GetInt32(reader.GetOrdinal("UserId")),
            BlockedUserIds = blockedUserIds,
            PreferredTags = preferredTags,
            NotificationsEnabled = reader.GetBoolean(reader.GetOrdinal("NotificationsEnabled"))
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