using Microsoft.AspNetCore.Mvc;
using NewsSite.Server.Services;
using System.Text.Json;
using NewsAPI;
using NewsAPI.Models;
using NewsAPI.Constants;
using Server.Models;
using Server.Services;

namespace Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NewsController : BaseController
    {

        private readonly NewsApiService _newsApiService;
        private readonly SentimentAnalysisService _sentimentAnalysisService;
        private readonly SummaryService _summaryService;

        /// <summary>
        /// Initializes a new instance of the NewsController class with dependencies.
        /// </summary>
        /// <param name="newsApiService">The service used to interact with the news API.</param>
        /// <param name="sentimentAnalysisService">The service used for sentiment analysis.</param>
        /// <param name="summaryService">The service used for text summarization.</param>
        public NewsController(NewsApiService newsApiService, SentimentAnalysisService sentimentAnalysisService, SummaryService summaryService)
        {
            _newsApiService = newsApiService;
            _sentimentAnalysisService = sentimentAnalysisService;
            _summaryService = summaryService;
        }

        /// <summary>
        /// Retrieves specific news articles based on a search query without sentiment analysis.
        /// </summary>
        /// <param name="query">The search query for filtering news articles.</param>
        /// <param name="userId">The ID of the user making the request.</param>
        /// <param name="page">The page number for pagination (default: 1).</param>
        /// <param name="pageSize">The number of articles per page (default: 12).</param>
        /// <returns>A tagged articles result containing the news articles.</returns>
        [HttpGet("SpecificNews")]
        public async Task<ActionResult<TaggedArticlesResult>> GetSpecificNews(string query, int userId, int page = 1, int pageSize = 12)
        {
            return await GetNewsWithOptionalSentiment(
                () => NewsApiResponse.GetSpecificNews(_newsApiService, query, userId, page, pageSize),
                false);
        }

        /// <summary>
        /// Retrieves specific news articles based on a search query with sentiment analysis included.
        /// </summary>
        /// <param name="query">The search query for filtering news articles.</param>
        /// <param name="userId">The ID of the user making the request.</param>
        /// <param name="page">The page number for pagination (default: 1).</param>
        /// <param name="pageSize">The number of articles per page (default: 12).</param>
        /// <returns>A tagged articles result containing the news articles with sentiment analysis.</returns>
        [HttpGet("SpecificNewsWithSentiment")]
        public async Task<ActionResult<TaggedArticlesResult>> GetSpecificNewsWithSentiment(string query, int userId, int page = 1, int pageSize = 12)
        {
            return await GetNewsWithOptionalSentiment(
                () => NewsApiResponse.GetSpecificNews(_newsApiService, query, userId, page, pageSize),
                true);
        }

        /// <summary>
        /// Retrieves top headlines without sentiment analysis.
        /// </summary>
        /// <param name="page">The page number for pagination.</param>
        /// <param name="pageSize">The number of articles per page.</param>
        /// <param name="userId">The ID of the user making the request.</param>
        /// <returns>A tagged articles result containing the top headlines.</returns>
        [HttpGet("TopHeadlines")]
        public async Task<ActionResult<TaggedArticlesResult>> GetTopHeadlines(int page, int pageSize, int userId)
        {
            return await GetNewsWithOptionalSentiment(
                () => NewsApiResponse.GetTopHeadlines(_newsApiService, page, pageSize, userId),
                false);
        }

        /// <summary>
        /// Retrieves top headlines with sentiment analysis included.
        /// </summary>
        /// <param name="page">The page number for pagination.</param>
        /// <param name="pageSize">The number of articles per page.</param>
        /// <param name="userId">The ID of the user making the request.</param>
        /// <returns>A tagged articles result containing the top headlines with sentiment analysis.</returns>
        [HttpGet("TopHeadlinesWithSentiment")]
        public async Task<ActionResult<TaggedArticlesResult>> GetTopHeadlinesWithSentiment(int page, int pageSize, int userId)
        {
            return await GetNewsWithOptionalSentiment(
                () => NewsApiResponse.GetTopHeadlines(_newsApiService, page, pageSize, userId),
                true);
        }

        /// <summary>
        /// Searches for news articles by specific tags without sentiment analysis.
        /// </summary>
        /// <param name="tagNames">The list of tag names to search for.</param>
        /// <param name="userId">The ID of the user making the request.</param>
        /// <param name="page">The page number for pagination (default: 1).</param>
        /// <param name="pageSize">The number of articles per page (default: 12).</param>
        /// <returns>A tagged articles result containing articles matching the specified tags.</returns>
        [HttpPost("SearchByTags")]
        public async Task<ActionResult<TaggedArticlesResult>> SearchByTags([FromBody] List<string> tagNames, int userId, int page = 1, int pageSize = 12)
        {
            return await SearchByTagsWithOptionalSentiment(tagNames, userId, page, pageSize, false);
        }

        /// <summary>
        /// Searches for news articles by specific tags with sentiment analysis included.
        /// </summary>
        /// <param name="tagNames">The list of tag names to search for.</param>
        /// <param name="userId">The ID of the user making the request.</param>
        /// <param name="page">The page number for pagination (default: 1).</param>
        /// <param name="pageSize">The number of articles per page (default: 12).</param>
        /// <returns>A tagged articles result containing articles matching the specified tags with sentiment analysis.</returns>
        [HttpPost("SearchByTagsWithSentiment")]
        public async Task<ActionResult<TaggedArticlesResult>> SearchByTagsWithSentiment([FromBody] List<string> tagNames, int userId, int page = 1, int pageSize = 12)
        {
            return await SearchByTagsWithOptionalSentiment(tagNames, userId, page, pageSize, true);
        }

        /// <summary>
        /// Generates a daily summary of top news articles.
        /// </summary>
        /// <returns>A daily summary result containing summarized news content.</returns>
        [HttpGet("DailySummary")]
        public async Task<ActionResult> GetDailySummary()
        {
            try
            {
                // Get today's top news articles - use userId = 0 for anonymous daily summary
                var result = await NewsApiResponse.GetTopHeadlines(_newsApiService, 1, 20, 0); // Get more articles for better summary

                if (result?.Articles != null && result.Articles.Any())
                {
                    var summaryResult = await _summaryService.GenerateDailySummaryAsync(result.Articles);
                    return Ok(summaryResult);
                }

                return Ok(new DailySummaryResult
                {
                    Summary = "No news articles available for today's summary",
                    Success = false,
                    ArticleCount = 0,
                    GeneratedAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Daily summary error: {ex.Message}");
                return StatusCode(500, new DailySummaryResult
                {
                    Summary = "Error generating daily summary",
                    Success = false,
                    ArticleCount = 0,
                    GeneratedAt = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Helper method to get news with optional sentiment analysis to eliminate duplicate logic.
        /// </summary>
        /// <param name="fetchArticlesFunc">Function to fetch articles from the API</param>
        /// <param name="includeSentiment">Whether to include sentiment analysis</param>
        /// <returns>ActionResult with TaggedArticlesResult</returns>
        private async Task<ActionResult<TaggedArticlesResult>> GetNewsWithOptionalSentiment(
            Func<Task<ArticlesResult>> fetchArticlesFunc,
            bool includeSentiment)
        {
            try
            {
                var result = await fetchArticlesFunc();

                if (result?.Articles != null)
                {
                    if (includeSentiment)
                    {
                        var articlesWithSentiment = await _sentimentAnalysisService.AnalyzeArticlesSentimentAsync(result.Articles);
                        var enhanced = TaggedArticlesResult.FromArticlesWithSentiment(articlesWithSentiment);
                        return Ok(enhanced);
                    }
                    else
                    {
                        var enhanced = TaggedArticlesResult.FromArticlesResult(result);
                        return Ok(enhanced);
                    }
                }

                return Ok(new TaggedArticlesResult { Status = "Error", TotalResults = 0, Articles = new List<TaggedArticle>() });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetNewsWithOptionalSentiment: {ex.Message}");
                return StatusCode(500, new TaggedArticlesResult { Status = "Error", TotalResults = 0, Articles = new List<TaggedArticle>() });
            }
        }

        /// <summary>
        /// Helper method to search by tags with optional sentiment analysis to eliminate duplicate logic.
        /// </summary>
        /// <param name="tagNames">List of tag names to search for</param>
        /// <param name="userId">User ID for logging</param>
        /// <param name="page">Page number for pagination</param>
        /// <param name="pageSize">Number of articles per page</param>
        /// <param name="includeSentiment">Whether to include sentiment analysis</param>
        /// <returns>ActionResult with TaggedArticlesResult</returns>
        private async Task<ActionResult<TaggedArticlesResult>> SearchByTagsWithOptionalSentiment(
            List<string> tagNames,
            int userId,
            int page,
            int pageSize,
            bool includeSentiment)
        {
            if (tagNames == null || tagNames.Count == 0)
            {
                return BadRequest("Tag names are required");
            }

            try
            {
                var result = await TaggedArticlesResult.SearchByTagsAsync(
                    tagNames,
                    userId,
                    page,
                    pageSize,
                    includeSentiment,
                    GetArticlesForTag,
                    includeSentiment ? _sentimentAnalysisService : null);

                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in SearchByTagsWithOptionalSentiment: {ex.Message}");
                return StatusCode(500, new TaggedArticlesResult { Status = "Error", TotalResults = 0, Articles = new List<TaggedArticle>() });
            }
        }

        /// <summary>
        /// Helper method to get articles for a specific tag to eliminate duplicate API calling logic.
        /// </summary>
        /// <param name="tag">The tag to search for</param>
        /// <param name="userId">User ID for logging</param>
        /// <returns>ArticlesResult containing the articles</returns>
        private async Task<ArticlesResult> GetArticlesForTag(Tag tag, int userId)
        {
            if (!tag.Custom && Enum.TryParse<Categories>(tag.Name, true, out var category))
            {
                // System tag - search by category (get more results for better pagination)
                var categoryResults = await NewsApiResponse.GetTopHeadlinesByCategories(_newsApiService, new List<Categories> { category }, userId, 1, 100);
                return categoryResults.FirstOrDefault().Value;
            }
            else
            {
                // Custom tag - search by term (get more results for better pagination)
                return await NewsApiResponse.GetSpecificNews(_newsApiService, tag.Name, userId, 1, 100);
            }
        }
    }
}