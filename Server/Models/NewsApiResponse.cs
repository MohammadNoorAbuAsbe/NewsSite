using NewsAPI.Constants;
using NewsSite.Server.Services;
using System.Text.Json;

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

    public static async Task<NewsApiResponse> Get(string query, string fromDate, string sortBy = "popularity")
    {
        NewsApiService newsApiService = new NewsApiService();
        var articlesResult = await newsApiService.GetNewsAsync(query, fromDate, sortBy);

        // Map NewsAPI.Models.Article to your Article model
        var articles = articlesResult.Articles.Select(a => new Article
        {
            Source = new Source
            {
                Id = a.Source.Id,
                Name = a.Source.Name
            },
            Author = a.Author,
            Title = a.Title,
            Description = a.Description,
            Url = a.Url,
            UrlToImage = a.UrlToImage,
            PublishedAt = a.PublishedAt ?? DateTime.MinValue,
            Content = a.Content
        }).ToList();

        return new NewsApiResponse(articlesResult.Status, articlesResult.TotalResults, articles);
    }
}