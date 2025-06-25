using Microsoft.AspNetCore.Mvc;
using Server.Models;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        #region GET Methods
        [HttpGet]
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
            try
            {
                var user = new User
                {
                    Name = request.Name,
                    Email = request.Email,
                    Password = request.Password
                };
                RegisterResponse registerResponse = Models.User.Register(user);
                if (registerResponse.Success)
                {
                    return Ok(registerResponse);
                }
                return BadRequest(registerResponse);
            }
            catch (Exception ex)
            {
                return BadRequest(new RegisterResponse
                {
                    Message = ex.Message,
                    Success = false
                });
            }
        }

        /// <summary>
        /// Authenticates a user with the provided login credentials.
        /// </summary>
        /// <param name="request">The login request containing email and password.</param>
        /// <returns>
        /// 200 OK with user information if authentication is successful; 
        /// 401 Unauthorized with an error message if credentials are invalid.
        /// </returns>
        [HttpPost("login")]
        [ProducesResponseType(typeof(object), 200)]
        [ProducesResponseType(typeof(string), 401)]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            var userResponse = Models.User.Login(request.Email, request.Password);
            if (userResponse != null)
            {
                return Ok(userResponse);
            }
            return Unauthorized("Invalid email or password");
        }

        #endregion
    }

    public class LoginRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
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
}
