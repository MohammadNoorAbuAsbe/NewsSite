using NewsAPI.Constants;
using NewsAPI.Models;
using NewsSite.Server.Services;
using System.Reflection;
using System.Text.Json;
using Server.Models;

public class NewsApiResponse
{
    public NewsApiResponse(Statuses status, int totalResults, List<Article> articles)
    {
        Status = status;
        TotalResults = totalResults;
        Articles = articles;
    }

    public Statuses Status { get; set; }
    public int TotalResults { get; set; }
    public List<Article> Articles { get; set; }

    public static async Task<ArticlesResult> GetSpecificNews(NewsApiService newsApiService, string query, int userId, int page = 1, int pageSize = 12)
    {
        User.LogUserActivity(userId, "news_request");
        return await GetResponseAsync(() => newsApiService.GetNewsAsync(query, page, pageSize));
    }

    public static async Task<ArticlesResult> GetTopHeadlines(NewsApiService newsApiService, int page, int pageSize, int userId)
    {
        User.LogUserActivity(userId, "news_request");
        return await GetResponseAsync(() => newsApiService.GetTopHeadlinesAsync(page, pageSize));
    }

    public static async Task<Dictionary<Categories, ArticlesResult>> GetTopHeadlinesByCategories(NewsApiService newsApiService, List<Categories> categories, int userId, int page = 1, int pageSize = 12)
    {
        User.LogUserActivity(userId, "news_request");
        return await newsApiService.GetTopHeadlinesByCategoriesAsync(categories, page, pageSize);
    }

    private static async Task<ArticlesResult> GetResponseAsync(Func<Task<ArticlesResult>> fetchArticlesFunc)
    {
        var articlesResult = await fetchArticlesFunc();
        return articlesResult;
    }

}