
using Server.Controllers;

namespace Server.Models
{
    public class User
    {
        #region Fields  

        int id;
        string name = string.Empty;
        string email = string.Empty;
        string password = string.Empty;
        bool isAdmin = false;
        bool isEnabled = true;
        #endregion

        #region Constructors  

        public User()
        {
        }

        public User(string name, string email, string password)
        {
            Name = name;
            Email = email;
            Password = password;
        }

        public User(int id, string name, string email, string password, bool isAdmin, bool isEnabled)
        {
            Id = id;
            Name = name;
            Email = email;
            Password = password;
            IsAdmin = isAdmin;
            IsEnabled = isEnabled;
        }
        #endregion

        #region Properties  
        public int Id { get => id; set => id = value; }
        public string Name { get => name; set => name = value; }
        public string Email { get => email; set => email = value; }
        public string Password { get => password; set => password = value; }
        public bool IsAdmin { get => isAdmin; set => isAdmin = value; }
        public bool IsEnabled { get => isEnabled; set => isEnabled = value; }
        #endregion

        #region GET Methods

        public static List<User> Read()
        {
            DBservices dBservices = new DBservices();
            try
            {
                return dBservices.GetUsers();
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        //public static User? GetByEmail(string email)
        //{
        //    DBservices dBservices = new DBservices();
        //    try
        //    {
        //        return dBservices.GetUserByEmail(email);
        //    }
        //    catch (Exception ex)
        //    {
        //        return null;
        //    }
        //}

        //public static User? GetById(int id)
        //{
        //    DBservices dBservices = new DBservices();
        //    try
        //    {
        //        return dBservices.GetUserById(id);
        //    }
        //    catch (Exception ex)
        //    {
        //        return null;
        //    }
        //}

        //public static User? GetByName(string name)
        //{
        //    DBservices dBservices = new DBservices();
        //    try
        //    {
        //        return dBservices.GetUserByName(name);
        //    }
        //    catch (Exception ex)
        //    {
        //        return null;
        //    }
        //}

        //public static List<User> GetByActive(bool isActive)
        //{
        //    DBservices dBservices = new DBservices();
        //    try
        //    {
        //        return dBservices.GetUserByActive(isActive);
        //    }
        //    catch (Exception ex)
        //    {
        //        return null;
        //    }
        //}

        //public static List<User> GetByDeletedAt(DateTime deletedAt)
        //{
        //    DBservices dBservices = new DBservices();
        //    try
        //    {
        //        return dBservices.GetUserByDeletedAt(deletedAt);
        //    }
        //    catch (Exception ex)
        //    {
        //        return null;
        //    }
        //}
        #endregion

        #region Authentication Methods
        // The registerLock ensures thread safety when multiple threads attempt to register users simultaneously.
        // Without this lock, concurrent access to the usersList could result in concurrency Issue, 
        // such as duplicate registrations or inconsistent state of the list.
        private static readonly object registerLock = new object();
       
        public static RegisterResponse Register(User user)
        {
            lock (registerLock)
            {
                user.Password = BCrypt.Net.BCrypt.HashPassword(user.Password, 15);
                DBservices dBservices = new DBservices();
                try 
                {
                    User? registeredUser = dBservices.RegisterUser(user);
                    if (registeredUser == null)
                    {  
                        return new RegisterResponse
                        {
                            Message = "Email already exists",
                            Success = false
                        };
                    }
                    return new RegisterResponse
                    {
                        Message = "User registered successfully",
                        Success = true,
                        Id = registeredUser.Id,
                        Name = registeredUser.Name,
                        Email = registeredUser.Email
                    };

                }
                catch (Exception ex)
                {
                    return  new RegisterResponse
                    {
                        Message = ex.Message,
                        Success = false
                    };
                }

            }
        }

        public static UserResponse? Login(string email, string password)
        {
            DBservices dBservices = new DBservices();
            try
            {
                User? user = dBservices.LoginUser(email);
                if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.Password))
                {
                    return null;
                }

                // Return a response object excluding sensitive information
                return new UserResponse
                {
                    Id = user.Id,
                    Name = user.Name,
                    Email = user.Email,
                };

            }
            catch (Exception ex)
            {
                return null;
            }
        }
        #endregion

        //#region DELETE Methods
        //public static bool DeleteUserById(int id)
        //{
        //    DBservices dBservices = new DBservices();
        //    if (dBservices.DeleteUser(id) == 0)
        //    {
        //        return false;
        //    }
        //    return true;
        //}
        //#endregion

        //#region Update Methods
        //public static UserResponse? UpdateUser(int id, User user)
        //{
        //    try
        //    {
        //        DBservices dBservices = new DBservices();
        //        if (user.Password != "")
        //        {
        //            user.Password = BCrypt.Net.BCrypt.HashPassword(user.Password, 15);
        //        }
        //        if (dBservices.UpdateUser(id, user) != null) 
        //        {
        //            return new UserResponse
        //            {
        //                Id = user.Id,
        //                Name = user.Name,
        //                Email = user.Email
        //            };
        //        }
        //        else
        //        {
        //            return null;
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        return null;
        //    }
        //}
        //#endregion

    }

    public class UserResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
    }
}
