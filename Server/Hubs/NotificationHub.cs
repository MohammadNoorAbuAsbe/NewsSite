using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace Server.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        /// <summary>
        /// Called when a client connects to the hub
        /// </summary>
        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userRole = Context.User?.FindFirst(ClaimTypes.Role)?.Value;
            
            if (!string.IsNullOrEmpty(userId))
            {
                // Add user to their personal group
                await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
                
                // Add admin users to admin group
                if (userRole == "Admin")
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, "Admins");
                }
                
                Console.WriteLine($"User {userId} connected to NotificationHub");
            }
            
            await base.OnConnectedAsync();
        }

        /// <summary>
        /// Called when a client disconnects from the hub
        /// </summary>
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userRole = Context.User?.FindFirst(ClaimTypes.Role)?.Value;
            
            if (!string.IsNullOrEmpty(userId))
            {
                // Remove user from their personal group
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"User_{userId}");
                
                // Remove admin users from admin group
                if (userRole == "Admin")
                {
                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, "Admins");
                }
                
                Console.WriteLine($"User {userId} disconnected from NotificationHub");
            }
            
            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Join a specific notification group (for future features)
        /// </summary>
        public async Task JoinGroup(string groupName)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        }

        /// <summary>
        /// Leave a specific notification group
        /// </summary>
        public async Task LeaveGroup(string groupName)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        }

        /// <summary>
        /// Join interest-based groups for breaking news notifications
        /// </summary>
        public async Task JoinInterestGroups(List<string> interests)
        {
            foreach (var interest in interests)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"Interest_{interest}");
            }
        }

        /// <summary>
        /// Send a test notification (for debugging)
        /// </summary>
        public async Task SendTestNotification()
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                await Clients.Caller.SendAsync("ReceiveNotification", new
                {
                    Type = "info",
                    Title = "Test Notification",
                    Message = "This is a test notification to verify the connection is working.",
                    Timestamp = DateTime.UtcNow
                });
            }
        }
    }
}
