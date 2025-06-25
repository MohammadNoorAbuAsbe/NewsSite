
using Server.Controllers;

namespace Server.Models
{
    public class User
    {
        #region Fields  

        int id;
        string name = string.Empty;
        string email = string.Empty;
        string password = string.Empty;
        bool isAdmin = false;
        bool isEnabled = true;
        #endregion

        #region Constructors  

        public User()
        {
        }

        public User(string name, string email, string password)
        {
            Name = name;
            Email = email;
            Password = password;
        }

        public User(int id, string name, string email, string password, bool isAdmin, bool isEnabled)
        {
            Id = id;
            Name = name;
            Email = email;
            Password = password;
            IsAdmin = isAdmin;
            IsEnabled = isEnabled;
        }
        #endregion

        #region Properties  
        public int Id { get => id; set => id = value; }
        public string Name { get => name; set => name = value; }
        public string Email { get => email; set => email = value; }
        public string Password { get => password; set => password = value; }
        public bool IsAdmin { get => isAdmin; set => isAdmin = value; }
        public bool IsEnabled { get => isEnabled; set => isEnabled = value; }
        #endregion

        #region GET Methods

        public static List<User> Read()
        {
            DBservices dBservices = new DBservices();
            try
            {
                return dBservices.GetUsers();
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        #endregion

        #region Authentication Methods
        /// <summary>
        /// Registers a new user by hashing the password and saving the user to the database.
        /// Returns a RegisterResponse indicating success, failure, or if the email already exists.
        /// </summary>
        /// <param name="user">The user object containing registration details.</param>
        /// <returns>A RegisterResponse with the registration result and user information if successful.</returns>
        public static RegisterResponse Register(User user)
        {
            user.Password = BCrypt.Net.BCrypt.HashPassword(user.Password, 15);
            DBservices dBservices = new DBservices();
            try
            {
                User? registeredUser = dBservices.RegisterUser(user);
                if (registeredUser == null)
                {
                    return new RegisterResponse
                    {
                        Message = "Email already exists",
                        Success = false
                    };
                }
                return new RegisterResponse
                {
                    Message = "User registered successfully",
                    Success = true,
                    Id = registeredUser.Id,
                    Name = registeredUser.Name,
                    Email = registeredUser.Email
                };

            }
            catch (Exception ex)
            {
                return new RegisterResponse
                {
                    Message = ex.Message,
                    Success = false
                };
            }
        }

        /// <summary>
        /// Authenticates a user by email and password, returning a UserResponse if successful, or null if authentication fails.
        /// </summary>
        /// <param name="email">The user's email address.</param>
        /// <param name="password">The user's password.</param>
        /// <returns>UserResponse object on successful login; otherwise, null.</returns>
        public static UserResponse? Login(string email, string password)
        {
            DBservices dBservices = new DBservices();
            try
            {
                User? user = dBservices.LoginUser(email);
                if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.Password))
                {
                    return null;
                }

                // Return a response object excluding sensitive information
                return new UserResponse
                {
                    Id = user.Id,
                    Name = user.Name,
                    Email = user.Email,
                };

            }
            catch (Exception ex)
            {
                return null;
            }
        }
        #endregion

    }

    public class UserResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
    }
}
