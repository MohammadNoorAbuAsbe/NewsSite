using Newtonsoft.Json;
using System.Text;

namespace Server.Services
{
    public class SentimentAnalysisService
    {
        private readonly HttpClient _httpClient;
        private readonly string _huggingFaceApiKey;
        private readonly string _modelUrl = "https://router.huggingface.co/hf-inference/models/mrm8488/distilroberta-finetuned-financial-news-sentiment-analysis";

        public SentimentAnalysisService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _huggingFaceApiKey = configuration["HuggingFace:ApiKey"] ?? "";

            // Set up the HTTP client with authorization header
            if (!string.IsNullOrEmpty(_huggingFaceApiKey))
            {
                _httpClient.DefaultRequestHeaders.Authorization =
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _huggingFaceApiKey);
            }
        }

        /// <summary>
        /// Asynchronously analyzes the sentiment of the provided text using an external model API.
        /// Returns a <see cref="SentimentResult"/> with the sentiment label, score, and confidence level.
        /// If the input is empty or an error occurs, returns a default neutral sentiment.
        /// </summary>
        /// <param name="text">The input text to analyze.</param>
        /// <returns>A task that represents the asynchronous operation, containing the sentiment analysis result.</returns>
        public async Task<SentimentResult> AnalyzeSentimentAsync(string text)
        {
            try
            {
                var cleanText = CleanText(text);
                if (string.IsNullOrWhiteSpace(cleanText))
                {
                    return new SentimentResult { Label = "NEUTRAL", Score = 0.5f, Confidence = "LOW" };
                }

                var payload = new { inputs = cleanText };
                var jsonContent = JsonConvert.SerializeObject(payload);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(_modelUrl, content);

                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    var results = JsonConvert.DeserializeObject<List<List<SentimentScore>>>(responseContent);

                    if (results?.FirstOrDefault()?.Any() == true)
                    {
                        var bestSentiment = results.First().OrderByDescending(x => x.Score).First();
                        var mappedLabel = MapSentimentLabel(bestSentiment.Label);

                        return new SentimentResult
                        {
                            Label = mappedLabel,
                            Score = bestSentiment.Score,
                            Confidence = GetConfidenceLevel(bestSentiment.Score)
                        };
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Sentiment analysis error: {ex.Message}");
            }

            return new SentimentResult { Label = "NEUTRAL", Score = 0.5f, Confidence = "LOW" };
        }

        /// <summary>
        /// Asynchronously analyzes the sentiment of a list of articles and returns a list of articles with their associated sentiment.
        /// </summary>
        /// <param name="articles">The list of articles to analyze.</param>
        /// <returns>A task that represents the asynchronous operation. The task result contains a list of articles with sentiment analysis results.</returns>
        public async Task<List<ArticleWithSentiment>> AnalyzeArticlesSentimentAsync(List<NewsAPI.Models.Article> articles)
        {
            var results = new List<ArticleWithSentiment>();

            foreach (var article in articles)
            {
                var textToAnalyze = $"{article.Title} {article.Description}";
                var sentiment = await AnalyzeSentimentAsync(textToAnalyze);

                results.Add(new ArticleWithSentiment
                {
                    Article = article,
                    Sentiment = sentiment
                });
            }

            return results;
        }

        /// <summary>
        /// Cleans the input text by normalizing whitespace, trimming, and limiting its length to 512 characters.
        /// </summary>
        /// <param name="text">The input string to clean.</param>
        /// <returns>The cleaned string.</returns>
        private string CleanText(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return "";

            text = System.Text.RegularExpressions.Regex.Replace(text, @"\s+", " ").Trim();

            if (text.Length > 512)
            {
                text = text.Substring(0, 512);
            }

            return text;
        }

        /// <summary>
        /// Maps sentiment labels from the API response to standardized labels.
        /// Handles both text-based labels (NEGATIVE, NEUTRAL, POSITIVE) and numeric labels (LABEL_0, LABEL_1, LABEL_2).
        /// </summary>
        /// <param name="originalLabel">The original sentiment label from the API response.</param>
        /// <returns>A standardized sentiment label (NEGATIVE, NEUTRAL, or POSITIVE).</returns>
        private string MapSentimentLabel(string originalLabel)
        {
            return originalLabel.ToUpper() switch
            {
                "NEGATIVE" => "NEGATIVE",
                "NEUTRAL" => "NEUTRAL",
                "POSITIVE" => "POSITIVE",
                "LABEL_0" => "NEGATIVE",
                "LABEL_1" => "NEUTRAL",
                "LABEL_2" => "POSITIVE",
                _ => "NEUTRAL"
            };
        }

        /// <summary>
        /// Determines the confidence level based on the sentiment analysis score.
        /// Scores of 0.8 and above are considered HIGH confidence, scores between 0.6 and 0.8 are MEDIUM confidence,
        /// and scores below 0.6 are LOW confidence.
        /// </summary>
        /// <param name="score">The sentiment analysis score (typically between 0 and 1).</param>
        /// <returns>A string representing the confidence level: "HIGH", "MEDIUM", or "LOW".</returns>
        private string GetConfidenceLevel(float score)
        {
            return score switch
            {
                >= 0.8f => "HIGH",
                >= 0.6f => "MEDIUM",
                _ => "LOW"
            };
        }
    }

    public class SentimentResult
    {
        public string Label { get; set; } = "NEUTRAL";
        public float Score { get; set; }
        public string Confidence { get; set; } = "LOW";
    }

    public class SentimentScore
    {
        public string Label { get; set; } = "";
        public float Score { get; set; }
    }

    public class ArticleWithSentiment
    {
        public NewsAPI.Models.Article Article { get; set; } = new();
        public SentimentResult Sentiment { get; set; } = new();
    }
}
