using Microsoft.AspNetCore.Mvc;
using NewsSite.Server.Services;
using System.Text.Json;
using NewsAPI;
using NewsAPI.Models;
using NewsAPI.Constants;

namespace Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NewsController : ControllerBase
    {

        private readonly NewsApiService _newsApiService;
        /// <summary>
        /// Initializes a new instance of the NewsController class with a NewsApiService dependency.
        /// </summary>
        /// <param name="newsApiService">The service used to interact with the news API.</param>
        public NewsController(NewsApiService newsApiService)
        {
            _newsApiService = newsApiService;
        }


        [HttpGet("SpecificNews")]
        public async Task<ActionResult<ArticlesResult>> GetSpecificNews(string query, string fromDate, string sortBy = "popularity")
        {
            return Ok(await NewsApiResponse.GetSpecificNews(_newsApiService, query, fromDate, sortBy));
        }

        [HttpGet("TopHeadlines")]
        public async Task<ActionResult<ArticlesResult>> GetTopHeadlines(Countries country, int page, int pageSize)
        {
            return Ok(await NewsApiResponse.GetTopHeadlines(_newsApiService, country, page, pageSize));
        }

        [HttpPost("TopHeadlinesByCategories")]
        public async Task<ActionResult<Dictionary<Categories, ArticlesResult>>> GetTopHeadlinesByCategories([FromBody] List<Categories> categories)
        {
            var results = await NewsApiResponse.GetTopHeadlinesByCategories(_newsApiService, categories);
            return Ok(results);
        }
    }
}