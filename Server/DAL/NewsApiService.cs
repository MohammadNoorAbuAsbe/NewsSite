using System.Net.Http;
using System.Threading.Tasks;
using NewsAPI;
using NewsAPI.Models;
using NewsAPI.Constants;

namespace NewsSite.Server.Services
{
    public class NewsApiService
    {
        private readonly NewsApiClient newsApiClient;

        public NewsApiService()
        {
            // Read the API key from configuration
            var apiKey = new ConfigurationBuilder().AddJsonFile("appsettings.json").Build()["NewsApi:ApiKey"];
            newsApiClient = new NewsApiClient(apiKey);
        }

        /// <summary>
        /// Asynchronously retrieves news articles based on the specified query, date, and sorting preference.
        /// </summary>
        /// <param name="query">The search query for the news articles.</param>
        /// <param name="fromDate">The starting date for the news articles in string format.</param>
        /// <param name="sortBy">The sorting preference for the articles, default is "popularity".</param>
        /// <returns>A task representing the asynchronous operation, with a result of type ArticlesResult containing the news articles.</returns>
        public async Task<ArticlesResult> GetNewsAsync(string query, string fromDate, string sortBy = "popularity")
        {
            var request = new EverythingRequest
            {
                Q = query,
                From = DateTime.Parse(fromDate),
                SortBy = (SortBys)Enum.Parse(typeof(SortBys), sortBy, true),
                Language = Languages.EN
            };

            return await newsApiClient.GetEverythingAsync(request);
        }


        public async Task<ArticlesResult> GetTopHeadlinesAsync(Countries country, int page, int pageSize)
        {
            var request = new TopHeadlinesRequest
            {
                Country = country,
                Page = page,
                PageSize = pageSize
            };

            return await newsApiClient.GetTopHeadlinesAsync(request);
        }

        public async Task<Dictionary<Categories, ArticlesResult>> GetTopHeadlinesByCategoriesAsync(List<Categories> categories)
        {
            if (categories == null || categories.Count == 0)
            {
                throw new ArgumentException("Categories list cannot be null or empty.", nameof(categories));
            }
            var results = new Dictionary<Categories, ArticlesResult>();
            foreach (var category in categories)
            {
                var request = new TopHeadlinesRequest
                {
                    Category = category
                };
                var result = await newsApiClient.GetTopHeadlinesAsync(request);
                results[category] = result;
            }
            return results;
        }
    }
}