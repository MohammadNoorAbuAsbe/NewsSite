using Microsoft.AspNetCore.Mvc;
using Server.Models;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TagsController : ControllerBase
    {
        [HttpGet("tags")]
        public IActionResult GetAllTags()
        {
            return Ok(Tag.GetAllTags());
        }

        [HttpGet("{userId}/interests")]
        public IActionResult GetUserInterests(int userId)
        {
            var tag = new Tag(""); // Name is not needed for this call
            return Ok(tag.GetInterests(userId));
        }

        [HttpPost("{userId}/interests/{tagName}")]
        public IActionResult AddUserInterest(int userId, string tagName)
        {
            var tag = new Tag(tagName);
            tag.AddInterest(userId, tagName);
            return Ok();
        }

        [HttpDelete("{userId}/interests/{tagName}")]
        public IActionResult RemoveUserInterest(int userId, string tagName)
        {
            var tag = new Tag(tagName);
            tag.RemoveInterest(userId, tagName);
            return Ok();
        }
    }
}
