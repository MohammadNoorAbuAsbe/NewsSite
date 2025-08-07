using Microsoft.AspNetCore.Mvc;
using Server.Models;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TagsController : BaseController
    {
        /// <summary>
        /// Retrieves all available news tags from the system.
        /// </summary>
        /// <returns>A list of all tags that can be used for news categorization.</returns>
        [HttpGet("tags")]
        public IActionResult GetAllTags()
        {
            return ExecuteWithErrorHandling(() => Tag.GetAllTags());
        }
    }
}
