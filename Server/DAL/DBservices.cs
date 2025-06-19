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

    #region Getters
    /// <summary>
    /// Retrieves a list of users from the data source using a stored procedure.
    /// </summary>
    /// <returns>List of User objects.</returns>
    public List<User> GetUsers()
    {
        return GetUsersHelper("SP_NewsSite_GetUsers", new Dictionary<string, object>(), users => users);
    }

    public User? LoginUser(string email)
    {
        Dictionary<string, object> paramDic = new Dictionary<string, object>();
        paramDic.Add("@email", email);
        return GetUsersHelper("SP_LoginUser_2025", paramDic, users => users.FirstOrDefault());
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
                    con.Open();
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