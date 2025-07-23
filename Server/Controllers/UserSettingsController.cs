using Microsoft.AspNetCore.Mvc;
using Server.Models;

namespace Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserSettingsController : ControllerBase
    {
        /// <summary>
        /// Get user settings and preferences
        /// </summary>
        [HttpGet("{userId}")]
        public IActionResult GetUserSettings(int userId)
        {
            try
            {
                var settings = UserSettings.GetUserSettings(userId);
                return Ok(settings);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        
        /// <summary>
        /// Update user settings
        /// </summary>
        [HttpPut("{userId}")]
        public IActionResult UpdateUserSettings(int userId, [FromBody] UserSettings settings)
        {
            try
            {
                settings.UserId = userId; // Ensure correct user ID
                bool success = UserSettings.UpdateUserSettings(settings);
                if (success)
                {
                    return Ok(new { message = "Settings updated successfully" });
                }
                return BadRequest(new { message = "Failed to update settings" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        
        /// <summary>
        /// Block another user
        /// </summary>
        [HttpPost("{userId}/block/{userToBlockId}")]
        public IActionResult BlockUser(int userId, int userToBlockId)
        {
            try
            {
                bool success = UserSettings.BlockUser(userId, userToBlockId);
                if (success)
                {
                    return Ok(new { message = "User blocked successfully" });
                }
                return BadRequest(new { message = "Failed to block user" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        
        /// <summary>
        /// Unblock a user
        /// </summary>
        [HttpDelete("{userId}/block/{userToUnblockId}")]
        public IActionResult UnblockUser(int userId, int userToUnblockId)
        {
            try
            {
                bool success = UserSettings.UnblockUser(userId, userToUnblockId);
                if (success)
                {
                    return Ok(new { message = "User unblocked successfully" });
                }
                return BadRequest(new { message = "Failed to unblock user" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
