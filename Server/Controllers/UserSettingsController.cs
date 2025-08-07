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
                    var result = UserSettings.BlockUser(userId, request.UserToBlockId);
                    if (result) Models.User.LogUserActivity(userId, "block_user");
                    return result;
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
                userId => {
                    var result = UserSettings.UnblockUser(userId, request.UserToUnblockId);
                    if (result) Models.User.LogUserActivity(userId, "unblock_user");
                    return result;
                },
                "user unblocked successfully",
                "Failed to unblock user"
            );
        }
    }
}
