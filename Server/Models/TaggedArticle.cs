using NewsAPI.Models;
using Server.Models;
using Server.Services;

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
    }
}
