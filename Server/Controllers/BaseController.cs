using Microsoft.AspNetCore.Mvc;

namespace Server.Controllers
{
    /// <summary>
    /// Base controller class that provides common functionality for all controllers
    /// </summary>
    public abstract class BaseController : ControllerBase
    {
        /// <summary>
        /// Extracts the user ID from the JWT token in the current request
        /// </summary>
        /// <returns>User ID if valid token, null if invalid or missing</returns>
        protected int? GetUserIdFromToken()
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
            {
                return userId;
            }
            return null;
        }

        /// <summary>
        /// Executes an action with JWT user validation and standardized error handling
        /// </summary>
        /// <typeparam name="T">The return type of the action</typeparam>
        /// <param name="action">The action to execute with the validated user ID</param>
        /// <param name="includeSuccessFlag">Whether to include a success flag in the response</param>
        /// <returns>IActionResult with standardized response format</returns>
        protected IActionResult ExecuteWithUserValidation<T>(Func<int, T> action, bool includeSuccessFlag = false)
        {
            var userId = GetUserIdFromToken();
            if (userId == null)
            {
                return Unauthorized("Invalid token");
            }

            return ExecuteWithErrorHandling(() => action(userId.Value), includeSuccessFlag);
        }

        /// <summary>
        /// Executes a void action with JWT user validation and standardized error handling
        /// </summary>
        /// <param name="action">The action to execute with the validated user ID</param>
        /// <param name="successMessage">Custom success message</param>
        /// <param name="includeSuccessFlag">Whether to include a success flag in the response</param>
        /// <returns>IActionResult with standardized response format</returns>
        protected IActionResult ExecuteWithUserValidation(Action<int> action, string successMessage = "Operation completed successfully", bool includeSuccessFlag = false)
        {
            var userId = GetUserIdFromToken();
            if (userId == null)
            {
                return Unauthorized("Invalid token");
            }

            return ExecuteWithErrorHandling(() => action(userId.Value), successMessage, includeSuccessFlag);
        }

        /// <summary>
        /// Executes a boolean action with JWT user validation and conditional response
        /// </summary>
        /// <param name="action">The action to execute with the validated user ID</param>
        /// <param name="successMessage">Message to return on success</param>
        /// <param name="failureMessage">Message to return on failure</param>
        /// <param name="includeSuccessFlag">Whether to include a success flag in the response</param>
        /// <returns>IActionResult with standardized response format</returns>
        protected IActionResult ExecuteWithUserValidationConditional(Func<int, bool> action, string successMessage, string failureMessage, bool includeSuccessFlag = false)
        {
            var userId = GetUserIdFromToken();
            if (userId == null)
            {
                return Unauthorized("Invalid token");
            }

            return ExecuteWithConditionalResponse(() => action(userId.Value), successMessage, failureMessage, includeSuccessFlag);
        }

        /// <summary>
        /// Executes an async action with standardized error handling
        /// </summary>
        /// <typeparam name="T">The return type of the action</typeparam>
        /// <param name="action">The async action to execute</param>
        /// <param name="includeSuccessFlag">Whether to include a success flag in the response</param>
        /// <returns>IActionResult with standardized response format</returns>
        protected async Task<IActionResult> ExecuteWithErrorHandling<T>(Func<Task<T>> action, bool includeSuccessFlag = false)
        {
            try
            {
                var result = await action();
                
                if (includeSuccessFlag)
                {
                    return Ok(new { success = true, data = result });
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                if (includeSuccessFlag)
                {
                    return BadRequest(new { success = false, message = ex.Message });
                }
                
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Executes an action with standardized error handling
        /// </summary>
        /// <typeparam name="T">The return type of the action</typeparam>
        /// <param name="action">The action to execute</param>
        /// <param name="includeSuccessFlag">Whether to include a success flag in the response</param>
        /// <returns>IActionResult with standardized response format</returns>
        protected IActionResult ExecuteWithErrorHandling<T>(Func<T> action, bool includeSuccessFlag = false)
        {
            try
            {
                var result = action();
                
                if (includeSuccessFlag)
                {
                    return Ok(new { success = true, data = result });
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                if (includeSuccessFlag)
                {
                    return BadRequest(new { success = false, message = ex.Message });
                }
                
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Executes an action that returns void with standardized error handling
        /// </summary>
        /// <param name="action">The action to execute</param>
        /// <param name="successMessage">Custom success message</param>
        /// <param name="includeSuccessFlag">Whether to include a success flag in the response</param>
        /// <returns>IActionResult with standardized response format</returns>
        protected IActionResult ExecuteWithErrorHandling(Action action, string successMessage = "Operation completed successfully", bool includeSuccessFlag = false)
        {
            try
            {
                action();
                
                if (includeSuccessFlag)
                {
                    return Ok(new { success = true, message = successMessage });
                }
                
                return Ok(new { message = successMessage });
            }
            catch (Exception ex)
            {
                if (includeSuccessFlag)
                {
                    return BadRequest(new { success = false, message = ex.Message });
                }
                
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Executes an action with conditional success response based on boolean result
        /// </summary>
        /// <param name="action">The action to execute that returns a boolean</param>
        /// <param name="successMessage">Message to return on success</param>
        /// <param name="failureMessage">Message to return on failure</param>
        /// <param name="includeSuccessFlag">Whether to include a success flag in the response</param>
        /// <returns>IActionResult with standardized response format</returns>
        protected IActionResult ExecuteWithConditionalResponse(Func<bool> action, string successMessage, string failureMessage, bool includeSuccessFlag = false)
        {
            try
            {
                bool result = action();
                
                if (result)
                {
                    if (includeSuccessFlag)
                    {
                        return Ok(new { success = true, message = successMessage });
                    }
                    return Ok(new { message = successMessage });
                }
                else
                {
                    if (includeSuccessFlag)
                    {
                        return BadRequest(new { success = false, message = failureMessage });
                    }
                    return BadRequest(new { message = failureMessage });
                }
            }
            catch (Exception ex)
            {
                if (includeSuccessFlag)
                {
                    return BadRequest(new { success = false, message = ex.Message });
                }
                
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Executes an action that returns a response object with success/failure logic
        /// </summary>
        /// <typeparam name="T">The response type</typeparam>
        /// <param name="action">The action to execute</param>
        /// <param name="createErrorResponse">Function to create error response object</param>
        /// <returns>IActionResult with response object</returns>
        protected IActionResult ExecuteWithResponseObject<T>(Func<T> action, Func<Exception, T> createErrorResponse) where T : class
        {
            try
            {
                var result = action();
                
                // Check if the result has a Success property
                var successProperty = typeof(T).GetProperty("Success");
                if (successProperty != null && successProperty.PropertyType == typeof(bool))
                {
                    var success = (bool)successProperty.GetValue(result);
                    return success ? Ok(result) : BadRequest(result);
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                var errorResponse = createErrorResponse(ex);
                return BadRequest(errorResponse);
            }
        }
    }
}
