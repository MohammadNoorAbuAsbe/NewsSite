using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Server.Models;
using Server.Services;
using Google.Apis.Auth;
using System.Linq;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : BaseController
    {
        private readonly JwtService _jwtService;
        private readonly IConfiguration _configuration;

        public UsersController(JwtService jwtService, IConfiguration configuration)
        {
            _jwtService = jwtService;
            _configuration = configuration;
        }

        #region GET Methods
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public IEnumerable<User> Get()
        {
            return Models.User.Read();
        }
        #endregion

        #region POST Methods
        /// <summary>
        /// Handles user registration by creating a new user and returning the registration result.
        /// </summary>
        /// <param name="request">The registration request containing user details.</param>
        /// <returns>
        /// An IActionResult containing a 200 OK response with the registration result if successful,
        /// or a 400 Bad Request response with an error message if registration fails.
        /// </returns>
        [HttpPost("register")]
        [ProducesResponseType(typeof(object), 200)]
        [ProducesResponseType(typeof(object), 400)]
        public IActionResult Register([FromBody] RegisterRequest request)
        {
            return ExecuteWithResponseObject(
                () =>
                {
                    var user = new User
                    {
                        Name = request.Name,
                        Email = request.Email,
                        Password = request.Password
                    };
                    return Models.User.Register(user);
                },
                ex => new RegisterResponse
                {
                    Message = ex.Message,
                    Success = false
                }
            );
        }

        /// <summary>
        /// Authenticates a user with the provided login credentials and returns JWT tokens.
        /// </summary>
        /// <param name="request">The login request containing email and password.</param>
        /// <returns>
        /// 200 OK with user information and JWT tokens if authentication is successful; 
        /// 401 Unauthorized with an error message if credentials are invalid.
        /// </returns>
        [HttpPost("login")]
        [ProducesResponseType(typeof(LoginResponse), 200)]
        [ProducesResponseType(typeof(string), 401)]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            var userResponse = Models.User.Login(request.Email, request.Password);
            if (userResponse != null)
            {
                // Check if user is disabled
                var fullUser = Models.User.GetUserByEmail(request.Email);
                if (fullUser != null && !fullUser.IsEnabled)
                {
                    return Unauthorized("Account has been disabled");
                }

                // Include admin status in response
                userResponse.IsAdmin = fullUser?.IsAdmin ?? false;

                // Generate JWT tokens
                var accessToken = _jwtService.GenerateToken(userResponse);
                var refreshToken = _jwtService.GenerateRefreshToken();

                return Ok(new LoginResponse
                {
                    User = userResponse,
                    AccessToken = accessToken,
                    RefreshToken = refreshToken,
                    TokenType = "Bearer",
                    ExpiresIn = 86400 // 24 hours in seconds
                });
            }
            return Unauthorized("Invalid email or password");
        }

        /// <summary>
        /// Authenticates a user with Google OAuth token and returns JWT tokens.
        /// If user doesn't exist, automatically creates a new account.
        /// </summary>
        /// <param name="request">The Google login request containing the Google ID token.</param>
        /// <returns>
        /// 200 OK with user information and JWT tokens if authentication is successful; 
        /// 401 Unauthorized with an error message if token is invalid.
        /// </returns>
        [HttpPost("google-login")]
        [ProducesResponseType(typeof(LoginResponse), 200)]
        [ProducesResponseType(typeof(string), 401)]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
        {
            try
            {
                // Verify the Google ID token
                var settings = new GoogleJsonWebSignature.ValidationSettings()
                {
                    // Get Google Client ID from configuration
                    Audience = new[] { _configuration["GoogleAuth:ClientId"] }
                };

                var payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, settings);

                if (payload == null)
                {
                    return Unauthorized("Invalid Google token");
                }

                // Check if user exists
                var existingUser = Models.User.GetUserByEmail(payload.Email);

                UserResponse userResponse;

                if (existingUser == null)
                {
                    // Auto-register the user with Google info
                    var newUser = new User
                    {
                        Name = payload.Name,
                        Email = payload.Email,
                        Password = GenerateRandomPassword() // Generate a random password since they'll use Google login
                    };

                    var registerResult = Models.User.Register(newUser);

                    if (!registerResult.Success)
                    {
                        return Unauthorized($"Failed to create account: {registerResult.Message}");
                    }

                    // Get the newly created user
                    existingUser = Models.User.GetUserByEmail(payload.Email);
                    if (existingUser == null)
                    {
                        return Unauthorized("Failed to retrieve created account");
                    }
                }

                // Check if user is disabled
                if (!existingUser.IsEnabled)
                {
                    return Unauthorized("Account has been disabled");
                }

                // Create user response
                userResponse = new UserResponse
                {
                    Id = existingUser.Id,
                    Name = existingUser.Name,
                    Email = existingUser.Email,
                    IsAdmin = existingUser.IsAdmin
                };

                // Generate JWT tokens (same as regular login)
                var accessToken = _jwtService.GenerateToken(userResponse);
                var refreshToken = _jwtService.GenerateRefreshToken();

                return Ok(new LoginResponse
                {
                    User = userResponse,
                    AccessToken = accessToken,
                    RefreshToken = refreshToken,
                    TokenType = "Bearer",
                    ExpiresIn = 86400 // 24 hours in seconds
                });
            }
            catch (Exception ex)
            {
                return Unauthorized($"Google authentication failed: {ex.Message}");
            }
        }

        /// <summary>
        /// Generates a random password for Google OAuth users
        /// </summary>
        private string GenerateRandomPassword()
        {
            var random = new Random();
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
            return new string(Enumerable.Repeat(chars, 16)
                .Select(s => s[random.Next(s.Length)]).ToArray());
        }

        /// <summary>
        /// Logout user and log the session end
        /// </summary>
        [HttpPost("logout")]
        [Authorize]
        public IActionResult Logout()
        {
            return ExecuteWithUserValidation(userId =>
            {
                // Log the logout activity for admin statistics
                Models.User.LogUserActivity(userId, "logout");
            }, "Logged out successfully");
        }

        /// <summary>
        /// Validates the current JWT token and returns user information
        /// </summary>
        [HttpGet("validate")]
        [Authorize]
        public IActionResult ValidateToken()
        {
            return ExecuteWithUserValidation(userId =>
            {
                var nameClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Name);
                var emailClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Email);
                var roleClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Role);

                return (object)new UserResponse
                {
                    Id = userId,
                    Name = nameClaim?.Value ?? "",
                    Email = emailClaim?.Value ?? "",
                    IsAdmin = roleClaim?.Value == "Admin"
                };
            });
        }

        #endregion
    }

    public class LoginRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class LoginResponse
    {
        public UserResponse User { get; set; }
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }
        public string TokenType { get; set; }
        public int ExpiresIn { get; set; }
    }

    public class RegisterResponse
    {
        public string Message { get; set; }
        public bool Success { get; set; }
        public int? Id { get; set; }
        public string? Email { get; set; }
        public string? Name { get; set; }
    }

    public class RegisterRequest
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class GoogleLoginRequest
    {
        public string IdToken { get; set; }
    }
}
