using Newtonsoft.Json;
using System.Text;

namespace Server.Services
{
    public class SummaryService
    {
        private readonly HttpClient _httpClient;
        private readonly string _huggingFaceApiKey;
        private readonly string _modelUrl = "https://router.huggingface.co/hf-inference/models/Falconsai/text_summarization";

        /// <summary>
        /// Initializes a new instance of the SummaryService class, configuring the HTTP client with a longer timeout and setting the authorization header using the HuggingFace API key from configuration.
        /// </summary>
        /// <param name="httpClient">The HTTP client used for making requests.</param>
        /// <param name="configuration">The configuration provider for accessing settings.</param>
        public SummaryService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _huggingFaceApiKey = configuration["HuggingFace:ApiKey"] ?? "";

            // Set longer timeout for summarization (it can take a while)
            _httpClient.Timeout = TimeSpan.FromMinutes(2);

            // Set up the HTTP client with authorization header
            if (!string.IsNullOrEmpty(_huggingFaceApiKey))
            {
                _httpClient.DefaultRequestHeaders.Authorization =
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _huggingFaceApiKey);
            }
        }

        /// <summary>
        /// Asynchronously summarizes the provided text using an external model API.
        /// Cleans the input, sends it for summarization, and returns the summary result.
        /// Returns a failure result if the input is empty or if an error occurs during processing.
        /// </summary>
        /// <param name="text">The text to be summarized.</param>
        /// <returns>A <see cref="SummaryResult"/> containing the summary and success status.</returns>
        public async Task<SummaryResult> SummarizeTextAsync(string text)
        {
            try
            {
                var cleanText = CleanText(text);
                if (string.IsNullOrWhiteSpace(cleanText))
                {
                    return new SummaryResult { Summary = "No content to summarize", Success = false };
                }

                var payload = new { inputs = cleanText };
                var jsonContent = JsonConvert.SerializeObject(payload);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(_modelUrl, content);

                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    var results = JsonConvert.DeserializeObject<List<SummaryResponse>>(responseContent);

                    if (results?.Any() == true && !string.IsNullOrWhiteSpace(results.First().SummaryText))
                    {
                        return new SummaryResult
                        {
                            Summary = results.First().SummaryText.Trim(),
                            Success = true
                        };
                    }
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"Summary API error: {response.StatusCode} - {errorContent}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Summary error: {ex.Message}");
            }

            return new SummaryResult { Summary = "Unable to generate summary", Success = false };
        }

        /// <summary>
        /// Asynchronously generates a daily news summary from a list of articles by combining the titles and descriptions of the top 10 articles and summarizing the result.
        /// Returns a <see cref="DailySummaryResult"/> indicating the summary, success status, article count, and generation time.
        /// Handles cases where no articles or content are available, and logs errors if exceptions occur.
        /// </summary>
        /// <param name="articles">A list of news articles to summarize.</param>
        /// <returns>A task representing the asynchronous operation, with a <see cref="DailySummaryResult"/> containing the summary and related information.</returns>
        public async Task<DailySummaryResult> GenerateDailySummaryAsync(List<NewsAPI.Models.Article> articles)
        {
            try
            {
                if (!articles?.Any() == true)
                {
                    return new DailySummaryResult
                    {
                        Summary = "No articles available for today's summary",
                        Success = false,
                        ArticleCount = 0
                    };
                }

                // Take top 10 articles and combine their titles and descriptions
                var topArticles = articles.Take(10).ToList();
                var combinedText = string.Join(". ", topArticles
                    .Where(a => !string.IsNullOrWhiteSpace(a.Title))
                    .Select(a => $"{a.Title}{(!string.IsNullOrWhiteSpace(a.Description) ? ": " + a.Description : "")}"));

                if (string.IsNullOrWhiteSpace(combinedText))
                {
                    return new DailySummaryResult
                    {
                        Summary = "No content available for summarization",
                        Success = false,
                        ArticleCount = 0
                    };
                }

                var summaryResult = await SummarizeTextAsync(combinedText);

                return new DailySummaryResult
                {
                    Summary = summaryResult.Summary,
                    Success = summaryResult.Success,
                    ArticleCount = topArticles.Count,
                    GeneratedAt = DateTime.UtcNow
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Daily summary generation error: {ex.Message}");
                return new DailySummaryResult
                {
                    Summary = "Error generating daily summary",
                    Success = false,
                    ArticleCount = 0
                };
            }
        }

        /// <summary>
        /// Cleans and preprocesses the input text by removing extra whitespace and limiting its length to 1024 characters,
        /// attempting to end at a sentence boundary if truncated. Returns an empty string if input is null or whitespace.
        /// </summary>
        /// <param name="text">The input string to be cleaned.</param>
        /// <returns>The cleaned and truncated string suitable for summarization models.</returns>
        private string CleanText(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return "";

            // Remove extra whitespace and limit length for the summarization model
            text = System.Text.RegularExpressions.Regex.Replace(text, @"\s+", " ").Trim();

            // Limit to 1024 characters as summarization models often have shorter input limits
            if (text.Length > 1024)
            {
                text = text.Substring(0, 1024);
                // Try to end at a sentence boundary
                var lastPeriod = text.LastIndexOf('.');
                if (lastPeriod > 500) // Ensure we don't cut too much
                {
                    text = text.Substring(0, lastPeriod + 1);
                }
            }

            return text;
        }
    }

    public class SummaryResult
    {
        public string Summary { get; set; } = "";
        public bool Success { get; set; }
    }

    public class DailySummaryResult
    {
        public string Summary { get; set; } = "";
        public bool Success { get; set; }
        public int ArticleCount { get; set; }
        public DateTime GeneratedAt { get; set; }
    }

    public class SummaryResponse
    {
        [JsonProperty("summary_text")]
        public string SummaryText { get; set; } = "";
    }
}
