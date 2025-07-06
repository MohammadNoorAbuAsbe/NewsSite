using NewsAPI.Constants;
using NewsSite.Server.Services;
using System.Text.Json;
using NewsAPI.Models;

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

    public static async Task<ArticlesResult> GetSpecificNews(NewsApiService newsApiService, string query, string fromDate, string sortBy = "popularity")
    {
        return await GetResponseAsync(() => newsApiService.GetNewsAsync(query, fromDate, sortBy));
    }

    public static async Task<ArticlesResult> GetTopHeadlines(NewsApiService newsApiService, Countries country)
    {
        return await GetResponseAsync(() => newsApiService.GetTopHeadlinesAsync(country));
    }

    public static async Task<Dictionary<Categories, ArticlesResult>> GetTopHeadlinesByCategories(NewsApiService newsApiService, List<Categories> categories)
    {
        return await newsApiService.GetTopHeadlinesByCategoriesAsync(categories);
    }

    private static async Task<ArticlesResult> GetResponseAsync(Func<Task<ArticlesResult>> fetchArticlesFunc)
    {
        var articlesResult = await fetchArticlesFunc();
        return articlesResult;
    }

}