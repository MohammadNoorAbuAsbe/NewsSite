using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Server.Models;

namespace Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UserSettingsController : BaseController
    {
        public class BlockUserRequest
        {
            public int UserToBlockId { get; set; }
        }

        public class UnblockUserRequest
        {
            public int UserToUnblockId { get; set; }
        }

        /// <summary>
        /// Get user settings and preferences for the authenticated user
        /// </summary>
        [HttpGet]
        public IActionResult GetUserSettings()
        {
            return ExecuteWithUserValidation(userId =>
            {
                return (object)UserSettings.GetUserSettings(userId);
            });
        }


        /// <summary>
        /// Block another user
        /// </summary>
        [HttpPost("block")]
        public IActionResult BlockUser([FromBody] BlockUserRequest request)
        {
            return ExecuteWithUserValidationConditional(
                userId =>
                {
                    // Prevent users from blocking themselves
                    if (userId == request.UserToBlockId)
                    {
                        return false;
                    }
                    return UserSettings.BlockUser(userId, request.UserToBlockId);
                },
                "user blocked successfully",
                "Cannot block yourself"
            );
        }

        /// <summary>
        /// Unblock a user
        /// </summary>
        [HttpPost("unblock")]
        public IActionResult UnblockUser([FromBody] UnblockUserRequest request)
        {
            return ExecuteWithUserValidationConditional(
                userId => UserSettings.UnblockUser(userId, request.UserToUnblockId),
                "user unblocked successfully",
                "Failed to unblock user"
            );
        }
    }
}
