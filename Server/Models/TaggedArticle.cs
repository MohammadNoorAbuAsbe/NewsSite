using NewsAPI.Models;
using Server.Models;
using Server.Services;
using NewsAPI.Constants;

namespace Server.Models
{
    public class TaggedArticle
    {
        public TaggedArticle(int id, Article article, List<Tag> tags)
        {
            Id = id;
            this.article = article;
            Tags = tags;
        }

        public TaggedArticle()
        {
        }

        public int Id { get; set; }
        public Article article { get; set; } = new Article();
        public List<Tag> Tags { get; set; } = new List<Tag>();
        public SentimentResult? Sentiment { get; set; }

        public static TaggedArticle FromArticle(Article article, string? category = null)
        {
            var tagged = new TaggedArticle
            {
                article = article,
                Tags = Tag.GetArticleTags(article.Title ?? string.Empty, article.Description ?? string.Empty, category ?? string.Empty)
            };

            return tagged;
        }

        public static TaggedArticle FromArticleWithSentiment(Article article, SentimentResult sentiment, string? category = null)
        {
            var tagged = new TaggedArticle
            {
                article = article,
                Tags = Tag.GetArticleTags(article.Title ?? string.Empty, article.Description ?? string.Empty, category ?? string.Empty),
                Sentiment = sentiment
            };

            return tagged;
        }
    }

    public class TaggedArticlesResult
    {
        public string Status { get; set; } = string.Empty;
        public int TotalResults { get; set; }
        public List<TaggedArticle> Articles { get; set; } = new List<TaggedArticle>();

        public static TaggedArticlesResult FromArticlesResult(ArticlesResult result, string? category = null)
        {
            var taggedResult = new TaggedArticlesResult
            {
                Status = result.Status.ToString(),
                TotalResults = result.TotalResults,
                Articles = result.Articles?.Select(a => TaggedArticle.FromArticle(a, category)).ToList() ?? new List<TaggedArticle>()
            };

            return taggedResult;
        }

        public static TaggedArticlesResult FromArticlesWithSentiment(List<ArticleWithSentiment> articlesWithSentiment, string status = "Ok")
        {
            var taggedResult = new TaggedArticlesResult
            {
                Status = status,
                TotalResults = articlesWithSentiment.Count,
                Articles = articlesWithSentiment.Select(aws => TaggedArticle.FromArticleWithSentiment(aws.Article, aws.Sentiment)).ToList()
            };

            return taggedResult;
        }

        /// <summary>
        /// Searches for news articles by specific tags with optional sentiment analysis.
        /// </summary>
        /// <param name="tagNames">List of tag names to search for</param>
        /// <param name="userId">User ID for logging</param>
        /// <param name="page">Page number for pagination</param>
        /// <param name="pageSize">Number of articles per page</param>
        /// <param name="includeSentiment">Whether to include sentiment analysis</param>
        /// <param name="getArticlesForTagFunc">Function to get articles for a specific tag</param>
        /// <param name="sentimentAnalysisService">Service for sentiment analysis (required when includeSentiment is true)</param>
        /// <returns>TaggedArticlesResult containing the search results</returns>
        public static async Task<TaggedArticlesResult> SearchByTagsAsync(
            List<string> tagNames,
            int userId,
            int page,
            int pageSize,
            bool includeSentiment,
            Func<Tag, int, Task<ArticlesResult>> getArticlesForTagFunc,
            SentimentAnalysisService? sentimentAnalysisService = null)
        {
            if (tagNames == null || tagNames.Count == 0)
            {
                throw new ArgumentException("Tag names are required");
            }

            if (includeSentiment && sentimentAnalysisService == null)
            {
                throw new ArgumentException("Sentiment analysis service is required when includeSentiment is true");
            }

            var allTags = Tag.GetAllTags();
            var allArticles = new List<Article>();

            // Collect all articles for the specified tags
            foreach (var tagName in tagNames)
            {
                var tag = allTags.FirstOrDefault(t => t.Name.Equals(tagName, StringComparison.OrdinalIgnoreCase));
                if (tag != null)
                {
                    var articleResult = await getArticlesForTagFunc(tag, userId);
                    if (articleResult?.Articles != null)
                    {
                        allArticles.AddRange(articleResult.Articles);
                    }
                }
            }

            // Remove duplicates based on URL
            var uniqueArticles = allArticles
                .GroupBy(a => a.Url)
                .Select(g => g.First())
                .ToList();

            if (!uniqueArticles.Any())
            {
                return new TaggedArticlesResult { Status = "Ok", TotalResults = 0, Articles = new List<TaggedArticle>() };
            }

            var totalResults = uniqueArticles.Count;

            if (includeSentiment)
            {
                // For sentiment analysis, paginate before processing to avoid unnecessary API calls
                var skip = (page - 1) * pageSize;
                var paginatedArticles = uniqueArticles
                    .Skip(skip)
                    .Take(pageSize)
                    .ToList();

                var articlesWithSentiment = await sentimentAnalysisService!.AnalyzeArticlesSentimentAsync(paginatedArticles);
                var enhanced = FromArticlesWithSentiment(articlesWithSentiment);
                enhanced.TotalResults = totalResults; // Set the correct total count
                return enhanced;
            }
            else
            {
                // For regular search, create tagged articles first, then paginate
                var searchResults = uniqueArticles.Select(a =>
                {
                    // Find the tag that matched this article for proper categorization
                    var matchingTag = allTags.FirstOrDefault(t =>
                        tagNames.Any(tn => tn.Equals(t.Name, StringComparison.OrdinalIgnoreCase)));
                    return TaggedArticle.FromArticle(a, !matchingTag?.Custom == true ? matchingTag?.Name : null);
                }).ToList();

                // Apply pagination
                var skip = (page - 1) * pageSize;
                var paginatedResults = searchResults
                    .Skip(skip)
                    .Take(pageSize)
                    .ToList();

                return new TaggedArticlesResult
                {
                    Status = "Ok",
                    TotalResults = totalResults,
                    Articles = paginatedResults
                };
            }
        }
    }
}
