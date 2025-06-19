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
        // GET: api/<UsersController>
        [HttpGet]
        public IEnumerable<User> Get()
        {
            return Models.User.Read();
        }

        //[HttpGet("getById")]
        //public User? GetById(int id)
        //{
        //    return Models.User.GetById(id);
        //}

        //[HttpGet("getByEmail")]
        //public User? GetByEmail(string email)
        //{
        //    return Models.User.GetByEmail(email);
        //}

        //[HttpGet("getByName")]
        //public User? GetByName(string name)
        //{
        //    return Models.User.GetByName(name);
        //}

        //[HttpGet("getByActive")]
        //public IEnumerable<User> GetByActive(bool isActive)
        //{
        //    return Models.User.GetByActive(isActive);
        //}

        //[HttpGet("getByDeletedAt")]
        //public IEnumerable<User> GetByDeletedAt(DateTime deletedAt)
        //{
        //    return Models.User.GetByDeletedAt(deletedAt);
        //}
        #endregion

        #region POST Methods
        // POST: api/<UsersController>/register
        [HttpPost("register")]
        [ProducesResponseType(typeof(object), 200)]
        [ProducesResponseType(typeof(object), 400)]
        public IActionResult Register([FromBody] User user)
        {
            try
            {
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


        // POST: api/<UsersController>/login
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

        //#region Delete Methods
        //// DELETE api/<UserController>/5
        //[HttpDelete("{id}")]
        //public bool Delete(int id)
        //{
        //    return Models.User.DeleteUserById(id);
        //}
        //#endregion

        //#region PUT Methods
        //// DELETE api/<MoviesController>/5
        //[HttpPut("Update/{id}")]
        //public IActionResult Put(int id, [FromBody] User user)
        //{
        //    var userResponse = Models.User.UpdateUser(id, user);
        //    if (userResponse != null)
        //    {
        //        return Ok(userResponse);
        //    }
        //    return Unauthorized("Invalid email or password");
        //}
        //#endregion

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
}
