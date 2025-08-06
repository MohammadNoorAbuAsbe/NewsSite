using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Server.Models;

namespace Server.Services
{
    public class JwtService
    {
        private readonly IConfiguration _configuration;
        private readonly string _secretKey;
        private readonly string _issuer;
        private readonly string _audience;

        public JwtService(IConfiguration configuration)
        {
            _configuration = configuration;
            _secretKey = _configuration["JwtSettings:SecretKey"] ?? "your-super-secret-key-that-is-at-least-256-bits-long-for-security";
            _issuer = _configuration["JwtSettings:Issuer"] ?? "NewsSiteAPI";
            _audience = _configuration["JwtSettings:Audience"] ?? "NewsSiteClients";
        }

        /// <summary>
        /// Generates a JWT token for the authenticated user
        /// </summary>
        /// <param name="user">The user for whom to generate the token</param>
        /// <returns>JWT token string</returns>
        public string GenerateToken(UserResponse user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_secretKey);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Name, user.Name),
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim(ClaimTypes.Role, user.IsAdmin ? "Admin" : "User")
                }),
                Expires = DateTime.UtcNow.AddHours(24), // Token expires in 24 hours
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
                Issuer = _issuer,
                Audience = _audience
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        /// <summary>
        /// Generates a refresh token
        /// </summary>
        /// <returns>Refresh token string</returns>
        public string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];
            using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomNumber);
                return Convert.ToBase64String(randomNumber);
            }
        }

        /// <summary>
        /// Validates a JWT token and returns the claims principal
        /// </summary>
        /// <param name="token">The JWT token to validate</param>
        /// <returns>ClaimsPrincipal if valid, null if invalid</returns>
        public ClaimsPrincipal? ValidateToken(string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.ASCII.GetBytes(_secretKey);

                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = _issuer,
                    ValidateAudience = true,
                    ValidAudience = _audience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };

                var principal = tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);
                return principal;
            }
            catch
            {
                return null;
            }
        }

        /// <summary>
        /// Extracts user ID from JWT token
        /// </summary>
        /// <param name="token">The JWT token</param>
        /// <returns>User ID if valid, null if invalid</returns>
        public int? GetUserIdFromToken(string token)
        {
            var principal = ValidateToken(token);
            if (principal != null)
            {
                var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
                {
                    return userId;
                }
            }
            return null;
        }

        /// <summary>
        /// Checks if the user is an admin from the JWT token
        /// </summary>
        /// <param name="token">The JWT token</param>
        /// <returns>True if user is admin, false otherwise</returns>
        public bool IsAdminFromToken(string token)
        {
            var principal = ValidateToken(token);
            if (principal != null)
            {
                var roleClaim = principal.FindFirst(ClaimTypes.Role);
                return roleClaim?.Value == "Admin";
            }
            return false;
        }
    }
}
