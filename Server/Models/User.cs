using Server.Controllers;
using Google.Apis.Auth;
using System.Linq;

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
                    Message = "user registered successfully",
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

                // Log successful login for admin statistics
                LogUserActivity(user.Id, "login");

                // Return a response object excluding sensitive information
                return new UserResponse
                {
                    Id = user.Id,
                    Name = user.Name,
                    Email = user.Email,
                    IsAdmin = user.IsAdmin
                };

            }
            catch (Exception ex)
            {
                return null;
            }
        }

        /// <summary>
        /// Authenticates a user with Google OAuth token and handles user registration if needed.
        /// </summary>
        /// <param name="idToken">The Google ID token to validate.</param>
        /// <param name="googleClientId">The Google Client ID from configuration.</param>
        /// <returns>UserResponse object on successful authentication; throws exception on failure.</returns>
        public static async Task<UserResponse> GoogleLogin(string idToken, string googleClientId)
        {
            // Verify the Google ID token
            var settings = new GoogleJsonWebSignature.ValidationSettings()
            {
                Audience = new[] { googleClientId }
            };

            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);

            if (payload == null)
            {
                throw new UnauthorizedAccessException("Invalid Google token");
            }

            // Check if user exists
            var existingUser = GetUserByEmail(payload.Email);

            if (existingUser == null)
            {
                // Auto-register the user with Google info
                var newUser = new User
                {
                    Name = payload.Name,
                    Email = payload.Email,
                    Password = GenerateRandomPassword() // Generate a random password since they'll use Google login
                };

                var registerResult = Register(newUser);

                if (!registerResult.Success)
                {
                    throw new Exception($"Failed to create account: {registerResult.Message}");
                }

                // Get the newly created user
                existingUser = GetUserByEmail(payload.Email);
                if (existingUser == null)
                {
                    throw new Exception("Failed to retrieve created account");
                }
            }

            // Check if user is disabled
            if (!existingUser.IsEnabled)
            {
                throw new UnauthorizedAccessException("Account has been disabled");
            }

            // Log successful Google login for admin statistics
            LogUserActivity(existingUser.Id, "google-login");

            // Create and return user response
            return new UserResponse
            {
                Id = existingUser.Id,
                Name = existingUser.Name,
                Email = existingUser.Email,
                IsAdmin = existingUser.IsAdmin
            };
        }

        /// <summary>
        /// Generates a random password for Google OAuth users
        /// </summary>
        private static string GenerateRandomPassword()
        {
            var random = new Random();
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
            return new string(Enumerable.Repeat(chars, 16)
                .Select(s => s[random.Next(s.Length)]).ToArray());
        }

        /// <summary>
        /// Get user by email for admin functions
        /// </summary>
        public static User? GetUserByEmail(string email)
        {
            DBservices dBservices = new DBservices();
            try
            {
                return dBservices.LoginUser(email);
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        /// <summary>
        /// Log user activity for admin statistics
        /// </summary>
        public static void LogUserActivity(int userId, string activityType)
        {
            DBservices dBservices = new DBservices();
            try
            {
                dBservices.LogUserActivity(userId, activityType);
            }
            catch (Exception ex)
            {
                // Log error but don't throw
            }
        }
        #endregion

    }

    public class UserResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public bool IsAdmin { get; set; }
    }
}
