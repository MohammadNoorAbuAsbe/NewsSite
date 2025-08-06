using System;
using System.Collections.Generic;

namespace Server.Models
{
    /// <summary>
    /// Base class for models that need database access
    /// Provides common database service functionality to avoid repetition
    /// </summary>
    public abstract class BaseModel
    {
        /// <summary>
        /// Lazy-loaded database service instance
        /// </summary>
        private static readonly Lazy<DBservices> _dbService = new Lazy<DBservices>(() => new DBservices());
        
        /// <summary>
        /// Gets the shared database service instance
        /// </summary>
        protected static DBservices DB => _dbService.Value;
    }

    /// <summary>
    /// Static helper class for database operations
    /// Centralizes DBservices instantiation and common patterns
    /// </summary>
    public static class DataService
    {
        /// <summary>
        /// Gets a database service instance
        /// </summary>
        /// <returns>DBservices instance</returns>
        public static DBservices GetDbService()
        {
            return new DBservices();
        }

        /// <summary>
        /// Executes a database operation with automatic service management
        /// </summary>
        /// <typeparam name="T">Return type</typeparam>
        /// <param name="operation">Database operation to execute</param>
        /// <returns>Result of the operation</returns>
        public static T Execute<T>(Func<DBservices, T> operation)
        {
            var db = new DBservices();
            return operation(db);
        }

        /// <summary>
        /// Executes a database operation that returns void
        /// </summary>
        /// <param name="operation">Database operation to execute</param>
        public static void Execute(Action<DBservices> operation)
        {
            var db = new DBservices();
            operation(db);
        }

        /// <summary>
        /// Executes a database operation that returns a boolean result
        /// </summary>
        /// <param name="operation">Database operation to execute</param>
        /// <returns>Boolean result of the operation</returns>
        public static bool ExecuteBool(Func<DBservices, bool> operation)
        {
            var db = new DBservices();
            return operation(db);
        }

        /// <summary>
        /// Executes a database operation that returns a list
        /// </summary>
        /// <typeparam name="T">List item type</typeparam>
        /// <param name="operation">Database operation to execute</param>
        /// <returns>List result of the operation</returns>
        public static List<T> ExecuteList<T>(Func<DBservices, List<T>> operation)
        {
            var db = new DBservices();
            return operation(db);
        }
    }
}
