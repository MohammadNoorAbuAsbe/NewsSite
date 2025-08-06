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
