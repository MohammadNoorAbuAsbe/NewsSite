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

        public async Task<ArticlesResult> GetNewsAsync(string query, string fromDate, string sortBy = "popularity")
        {
            var request = new EverythingRequest
            {
                Q = query,
                From = DateTime.Parse(fromDate),
                SortBy = (SortBys)Enum.Parse(typeof(SortBys), sortBy, true),
                Language = Languages.EN
            };

            // NewsAPI client does not have async, so wrap in Task.Run
            return await Task.Run(() => newsApiClient.GetEverything(request));
        }
    }
}