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
        /// <param name="page">The page number (default: 1).</param>
        /// <param name="pageSize">The number of items per page (default: 12).</param>
        /// <returns>A task representing the asynchronous operation, with a result of type ArticlesResult containing the news articles.</returns>
        public async Task<ArticlesResult> GetNewsAsync(string query, int page = 1, int pageSize = 12)
        {
            var request = new EverythingRequest
            {
                Q = query,
                From = DateTime.Now.AddMonths(-1),
                SortBy = (SortBys)Enum.Parse(typeof(SortBys), "popularity", true),
                Language = Languages.EN,
                Page = page,
                PageSize = pageSize
            };

            return await newsApiClient.GetEverythingAsync(request);
        }


        public async Task<ArticlesResult> GetTopHeadlinesAsync(int page, int pageSize)
        {
            var request = new TopHeadlinesRequest
            {
                Country = Countries.US, //newsApi only work with US
                Page = page,
                PageSize = pageSize
            };

            return await newsApiClient.GetTopHeadlinesAsync(request);
        }

        public async Task<Dictionary<Categories, ArticlesResult>> GetTopHeadlinesByCategoriesAsync(List<Categories> categories, int page = 1, int pageSize = 12)
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
                    Category = category,
                    Page = page,
                    PageSize = pageSize
                };
                var result = await newsApiClient.GetTopHeadlinesAsync(request);
                results[category] = result;
            }
            return results;
        }
    }
}