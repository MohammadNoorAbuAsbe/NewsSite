using Microsoft.AspNetCore.Mvc;
using NewsSite.Server.Services;
using System.Text.Json;

namespace Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NewsController : ControllerBase
    {
        [HttpGet]
        public async Task<ActionResult<NewsApiResponse>> Get(string query, string fromDate, string sortBy = "popularity")
        {
            return Ok(await NewsApiResponse.Get(query, fromDate, sortBy));
        }
    }
}