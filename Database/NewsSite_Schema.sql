-- NewsSite Database Schema
-- This script creates all necessary tables and stored procedures for the NewsSite project

-- =============================================
-- Create Tables
-- =============================================

-- Users table (existing - for reference)
CREATE TABLE NewsSite_Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(255) UNIQUE NOT NULL,
    Password NVARCHAR(255) NOT NULL,
    IsAdmin BIT DEFAULT 0,
    IsEnabled BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);


-- Tags table for news categories and user interests
CREATE TABLE NewsSite_Tags (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(50) UNIQUE NOT NULL,
    Custom BIT DEFAULT 0, -- True if it's a user-created custom tag
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- User interests - linking users to their preferred tags
CREATE TABLE NewsSite_UserInterests (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    TagName NVARCHAR(50) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES NewsSite_Users(Id) ON DELETE CASCADE,
    UNIQUE(UserId, TagName)
);

-- Saved articles for each user
CREATE TABLE NewsSite_SavedArticles (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Title NVARCHAR(500) NOT NULL,
    Description NTEXT,
    Url NVARCHAR(1000) NOT NULL,
    UrlToImage NVARCHAR(1000),
    Source NVARCHAR(100),
    PublishedAt DATETIME,
    SavedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES NewsSite_Users(Id) ON DELETE CASCADE
);

-- Shared content - articles shared by users with comments
CREATE TABLE NewsSite_SharedContent (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    ArticleTitle NVARCHAR(500) NOT NULL,
    ArticleUrl NVARCHAR(1000) NOT NULL,
    UserComment NTEXT,
    SharedAt DATETIME DEFAULT GETDATE(),
    IsReported BIT DEFAULT 0,
    IsRemoved BIT DEFAULT 0,
    FOREIGN KEY (UserId) REFERENCES NewsSite_Users(Id) ON DELETE NO ACTION
);

-- Likes for shared content
CREATE TABLE NewsSite_ContentLikes (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ContentId INT NOT NULL,
    UserId INT NOT NULL,
    LikedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ContentId) REFERENCES NewsSite_SharedContent(Id) ON DELETE CASCADE,
    FOREIGN KEY (UserId) REFERENCES NewsSite_Users(Id) ON DELETE NO ACTION,
    UNIQUE(ContentId, UserId)
);

-- Reports for offensive content
CREATE TABLE NewsSite_ContentReports (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ContentId INT NOT NULL,
    ReporterId INT NOT NULL,
    ReportedAt DATETIME DEFAULT GETDATE(),
    Handled BIT DEFAULT 0,
    HandledAt DATETIME,
    FOREIGN KEY (ContentId) REFERENCES NewsSite_SharedContent(Id) ON DELETE CASCADE,
    FOREIGN KEY (ReporterId) REFERENCES NewsSite_Users(Id)
);

-- User settings and preferences
CREATE TABLE NewsSite_UserSettings (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT UNIQUE NOT NULL,
    BlockedUserIds NVARCHAR(1000), -- Comma-separated list of blocked user IDs
    PreferredTags NVARCHAR(1000), -- Comma-separated list of preferred tags
    NotificationsEnabled BIT DEFAULT 1,
    UpdatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES NewsSite_Users(Id) ON DELETE CASCADE
);

-- User activity log for admin statistics
CREATE TABLE NewsSite_UserActivity (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    ActivityType NVARCHAR(50) NOT NULL, -- 'login', 'logout', 'news_request', 'save_article', etc.
    ActivityDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES NewsSite_Users(Id) ON DELETE CASCADE
);

-- =============================================
-- Insert Default Data
-- =============================================

-- Insert default tags
INSERT INTO NewsSite_Tags (Name, Custom) VALUES 
    ('Politics', 0),
    ('Business', 0),
    ('Technology', 0),
    ('Sports', 0),
    ('Health', 0),
    ('Science', 0),
    ('Entertainment', 0),
    ('World', 0),
    ('National', 0),
    ('Local', 0);

-- Insert admin user (password: admin - hashed with BCrypt)
INSERT INTO NewsSite_Users (Name, Email, Password, IsAdmin, IsEnabled) VALUES 
    ('admin', 'admin', '$2a$15$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 1);

-- =============================================
-- Stored Procedures
-- =============================================

-- Register new user
CREATE PROCEDURE SP_NewsSite_RegisterUser
    @name NVARCHAR(100),
    @email NVARCHAR(255),
    @password NVARCHAR(255)
AS
BEGIN
    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM NewsSite_Users WHERE Email = @email)
    BEGIN
        -- Return empty result set when email already exists
        SELECT TOP 0 Id, Name, Email, Password, IsAdmin, IsEnabled, CreatedAt
        FROM NewsSite_Users;
        RETURN;
    END
    
    -- Insert new user
    INSERT INTO NewsSite_Users (Name, Email, Password, IsAdmin, IsEnabled)
    VALUES (@name, @email, @password, 0, 1);
    
    -- Get the newly created user ID
    DECLARE @newUserId INT = SCOPE_IDENTITY();
    
    -- Log registration activity
    INSERT INTO NewsSite_UserActivity (UserId, ActivityType) 
    VALUES (@newUserId, 'register');
    
    -- Return the newly created user information
    SELECT Id, Name, Email, Password, IsAdmin, IsEnabled, CreatedAt
    FROM NewsSite_Users 
    WHERE Id = @newUserId;
END
GO

-- Login user
CREATE PROCEDURE SP_NewsSite_LoginUser
    @email NVARCHAR(255)
AS
BEGIN
    SELECT Id, Name, Email, Password, IsAdmin, IsEnabled, CreatedAt
    FROM NewsSite_Users 
    WHERE Email = @email AND IsEnabled = 1;
END
GO

-- Get all tags
CREATE PROCEDURE SP_NewsSite_GetAllTags
AS
BEGIN
    SELECT Name, Custom FROM NewsSite_Tags ORDER BY Name;
END
GO

-- Get user tags
CREATE PROCEDURE SP_NewsSite_GetUserTags
    @userId INT
AS
BEGIN
    SELECT t.Name, t.Custom 
    FROM NewsSite_Tags t
    INNER JOIN NewsSite_UserInterests ui ON t.Name = ui.TagName
    WHERE ui.UserId = @userId
    ORDER BY t.Name;
END
GO

-- Add user tag
CREATE PROCEDURE SP_NewsSite_AddUserTag
    @userId INT,
    @tagName NVARCHAR(50)
AS
BEGIN
    -- Insert tag if it doesn't exist (as custom tag)
    IF NOT EXISTS (SELECT 1 FROM NewsSite_Tags WHERE Name = @tagName)
    BEGIN
        INSERT INTO NewsSite_Tags (Name, Custom) VALUES (@tagName, 1);
    END
    
    -- Insert user interest if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM NewsSite_UserInterests WHERE UserId = @userId AND TagName = @tagName)
    BEGIN
        INSERT INTO NewsSite_UserInterests (UserId, TagName) VALUES (@userId, @tagName);
    END
END
GO

-- Remove user tag
CREATE PROCEDURE SP_NewsSite_RemoveUserTag
    @userId INT,
    @tagName NVARCHAR(50)
AS
BEGIN
    DELETE FROM NewsSite_UserInterests WHERE UserId = @userId AND TagName = @tagName;
END
GO

-- Get user saved articles
CREATE PROCEDURE SP_NewsSite_GetUserSavedArticles
    @userId INT
AS
BEGIN
    SELECT Id, UserId, Title, Description, Url, UrlToImage, Source, PublishedAt, SavedAt
    FROM NewsSite_SavedArticles 
    WHERE UserId = @userId 
    ORDER BY SavedAt DESC;
END
GO

-- Search user saved articles
CREATE PROCEDURE SP_NewsSite_SearchUserSavedArticles
    @userId INT,
    @searchTerm NVARCHAR(100)
AS
BEGIN
    SELECT Id, UserId, Title, Description, Url, UrlToImage, Source, PublishedAt, SavedAt
    FROM NewsSite_SavedArticles 
    WHERE UserId = @userId 
        AND (Title LIKE '%' + @searchTerm + '%' OR Description LIKE '%' + @searchTerm + '%')
    ORDER BY SavedAt DESC;
END
GO

-- Save article
CREATE PROCEDURE SP_NewsSite_SaveArticle
    @userId INT,
    @title NVARCHAR(500),
    @description NTEXT,
    @url NVARCHAR(1000),
    @urlToImage NVARCHAR(1000),
    @source NVARCHAR(100),
    @publishedAt DATETIME
AS
BEGIN
    -- Check if article already saved by user
    IF NOT EXISTS (SELECT 1 FROM NewsSite_SavedArticles WHERE UserId = @userId AND Url = @url)
    BEGIN
        INSERT INTO NewsSite_SavedArticles (UserId, Title, Description, Url, UrlToImage, Source, PublishedAt)
        VALUES (@userId, @title, @description, @url, @urlToImage, @source, @publishedAt);
        
        -- Log activity
        INSERT INTO NewsSite_UserActivity (UserId, ActivityType) VALUES (@userId, 'save_article');
        
        SELECT 1 AS Success;
    END
    ELSE
    BEGIN
        SELECT 0 AS Success;
    END
END
GO

-- Remove saved article
CREATE PROCEDURE SP_NewsSite_RemoveSavedArticle
    @userId INT,
    @articleId INT
AS
BEGIN
    DELETE FROM NewsSite_SavedArticles WHERE Id = @articleId AND UserId = @userId;
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- Get all shared content (filtered by blocked users)
CREATE PROCEDURE SP_NewsSite_GetFilteredSharedContent
    @currentUserId INT,
    @blockedUserIds NVARCHAR(1000)
AS
BEGIN
    SELECT 
        sc.Id, sc.UserId, u.Name AS UserName, sc.ArticleTitle, sc.ArticleUrl, 
        sc.UserComment, sc.SharedAt, sc.IsReported,
        (SELECT COUNT(*) FROM NewsSite_ContentLikes WHERE ContentId = sc.Id) AS LikesCount
    FROM NewsSite_SharedContent sc
    INNER JOIN NewsSite_Users u ON sc.UserId = u.Id
    WHERE sc.IsRemoved = 0
        AND (@blockedUserIds = '' OR sc.UserId NOT IN (SELECT value FROM STRING_SPLIT(@blockedUserIds, ',')))
    ORDER BY sc.SharedAt DESC;
END
GO

-- Share content
CREATE PROCEDURE SP_NewsSite_ShareContent
    @userId INT,
    @articleTitle NVARCHAR(500),
    @articleUrl NVARCHAR(1000),
    @userComment NTEXT
AS
BEGIN
    INSERT INTO NewsSite_SharedContent (UserId, ArticleTitle, ArticleUrl, UserComment)
    VALUES (@userId, @articleTitle, @articleUrl, @userComment);
    
    SELECT 1 AS Success;
END
GO

-- Report content
CREATE PROCEDURE SP_NewsSite_ReportContent
    @contentId INT,
    @reporterId INT
AS
BEGIN
    -- Insert report if not already reported by this user
    IF NOT EXISTS (SELECT 1 FROM NewsSite_ContentReports WHERE ContentId = @contentId AND ReporterId = @reporterId)
    BEGIN
        INSERT INTO NewsSite_ContentReports (ContentId, ReporterId) VALUES (@contentId, @reporterId);
        UPDATE NewsSite_SharedContent SET IsReported = 1 WHERE Id = @contentId;
        SELECT 1 AS Success;
    END
    ELSE
    BEGIN
        SELECT 0 AS Success;
    END
END
GO

-- Like content
CREATE PROCEDURE SP_NewsSite_LikeContent
    @contentId INT,
    @userId INT
AS
BEGIN
    IF NOT EXISTS (SELECT 1 FROM NewsSite_ContentLikes WHERE ContentId = @contentId AND UserId = @userId)
    BEGIN
        INSERT INTO NewsSite_ContentLikes (ContentId, UserId) VALUES (@contentId, @userId);
        SELECT 1 AS Success;
    END
    ELSE
    BEGIN
        SELECT 0 AS Success;
    END
END
GO

-- Unlike content
CREATE PROCEDURE SP_NewsSite_UnlikeContent
    @contentId INT,
    @userId INT
AS
BEGIN
    DELETE FROM NewsSite_ContentLikes WHERE ContentId = @contentId AND UserId = @userId;
    SELECT @@ROWCOUNT AS Success;
END
GO

-- Get user settings
CREATE PROCEDURE SP_NewsSite_GetUserSettings
    @userId INT
AS
BEGIN
    SELECT Id, UserId, BlockedUserIds, PreferredTags, NotificationsEnabled
    FROM NewsSite_UserSettings 
    WHERE UserId = @userId;
END
GO

-- Update user settings
CREATE PROCEDURE SP_NewsSite_UpdateUserSettings
    @userId INT,
    @blockedUserIds NVARCHAR(1000),
    @preferredTags NVARCHAR(1000),
    @notificationsEnabled BIT
AS
BEGIN
    IF EXISTS (SELECT 1 FROM NewsSite_UserSettings WHERE UserId = @userId)
    BEGIN
        UPDATE NewsSite_UserSettings 
        SET BlockedUserIds = @blockedUserIds,
            PreferredTags = @preferredTags,
            NotificationsEnabled = @notificationsEnabled,
            UpdatedAt = GETDATE()
        WHERE UserId = @userId;
    END
    ELSE
    BEGIN
        INSERT INTO NewsSite_UserSettings (UserId, BlockedUserIds, PreferredTags, NotificationsEnabled)
        VALUES (@userId, @blockedUserIds, @preferredTags, @notificationsEnabled);
    END
    SELECT 1 AS Success;
END
GO

-- Block user
CREATE PROCEDURE SP_NewsSite_BlockUser
    @userId INT,
    @userToBlockId INT
AS
BEGIN
    DECLARE @currentBlocked NVARCHAR(1000);
    SELECT @currentBlocked = ISNULL(BlockedUserIds, '') FROM NewsSite_UserSettings WHERE UserId = @userId;
    
    IF @currentBlocked = ''
        SET @currentBlocked = CAST(@userToBlockId AS NVARCHAR(10));
    ELSE
        SET @currentBlocked = @currentBlocked + ',' + CAST(@userToBlockId AS NVARCHAR(10));
    
    IF EXISTS (SELECT 1 FROM NewsSite_UserSettings WHERE UserId = @userId)
    BEGIN
        UPDATE NewsSite_UserSettings SET BlockedUserIds = @currentBlocked WHERE UserId = @userId;
    END
    ELSE
    BEGIN
        INSERT INTO NewsSite_UserSettings (UserId, BlockedUserIds) VALUES (@userId, @currentBlocked);
    END
    
    SELECT 1 AS Success;
END
GO

-- Unblock user
CREATE PROCEDURE SP_NewsSite_UnblockUser
    @userId INT,
    @userToUnblockId INT
AS
BEGIN
    DECLARE @currentBlocked NVARCHAR(1000);
    SELECT @currentBlocked = ISNULL(BlockedUserIds, '') FROM NewsSite_UserSettings WHERE UserId = @userId;
    
    SET @currentBlocked = REPLACE(@currentBlocked, CAST(@userToUnblockId AS NVARCHAR(10)), '');
    SET @currentBlocked = REPLACE(@currentBlocked, ',,', ',');
    SET @currentBlocked = LTRIM(RTRIM(@currentBlocked));
    IF LEFT(@currentBlocked, 1) = ',' SET @currentBlocked = SUBSTRING(@currentBlocked, 2, LEN(@currentBlocked));
    IF RIGHT(@currentBlocked, 1) = ',' SET @currentBlocked = SUBSTRING(@currentBlocked, 1, LEN(@currentBlocked) - 1);
    
    UPDATE NewsSite_UserSettings SET BlockedUserIds = @currentBlocked WHERE UserId = @userId;
    SELECT 1 AS Success;
END
GO

-- =============================================
-- Admin Procedures
-- =============================================

-- Get admin statistics for a specific date
CREATE PROCEDURE SP_NewsSite_GetAdminStats
    @date DATE
AS
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM NewsSite_UserActivity WHERE ActivityType = 'login' AND CAST(ActivityDate AS DATE) = @date) AS DailyLogins,
        (SELECT COUNT(*) FROM NewsSite_UserActivity WHERE ActivityType = 'news_request' AND CAST(ActivityDate AS DATE) = @date) AS DailyNewsRequests,
        (SELECT COUNT(*) FROM NewsSite_UserActivity WHERE ActivityType = 'save_article' AND CAST(ActivityDate AS DATE) = @date) AS DailySavedArticles,
        (SELECT COUNT(*) FROM NewsSite_Users) AS TotalUsers,
        (SELECT COUNT(*) FROM NewsSite_Users WHERE IsEnabled = 1) AS ActiveUsers,
        (SELECT COUNT(*) FROM NewsSite_SharedContent WHERE IsReported = 1 AND IsRemoved = 0) AS ReportedContent,
        @date AS Date;
END
GO

-- Get statistics for date range
CREATE PROCEDURE SP_NewsSite_GetStatsRange
    @fromDate DATE,
    @toDate DATE
AS
BEGIN
    SELECT 
        CAST(ActivityDate AS DATE) AS Date,
        SUM(CASE WHEN ActivityType = 'login' THEN 1 ELSE 0 END) AS DailyLogins,
        SUM(CASE WHEN ActivityType = 'news_request' THEN 1 ELSE 0 END) AS DailyNewsRequests,
        SUM(CASE WHEN ActivityType = 'save_article' THEN 1 ELSE 0 END) AS DailySavedArticles,
        0 AS TotalUsers,
        0 AS ActiveUsers,
        0 AS ReportedContent
    FROM NewsSite_UserActivity 
    WHERE CAST(ActivityDate AS DATE) BETWEEN @fromDate AND @toDate
    GROUP BY CAST(ActivityDate AS DATE)
    ORDER BY Date;
END
GO

-- Get all users with stats
CREATE PROCEDURE SP_NewsSite_GetAllUsersWithStats
AS
BEGIN
    SELECT 
        u.Id, u.Name, u.Email, u.IsAdmin, u.IsEnabled, u.CreatedAt,
        (SELECT COUNT(*) FROM NewsSite_SavedArticles WHERE UserId = u.Id) AS SavedArticlesCount,
        (SELECT COUNT(*) FROM NewsSite_SharedContent WHERE UserId = u.Id) AS SharedContentCount
    FROM NewsSite_Users u
    ORDER BY u.CreatedAt DESC;
END
GO

-- Toggle user status
CREATE PROCEDURE SP_NewsSite_ToggleUserStatus
    @userId INT,
    @isEnabled BIT
AS
BEGIN
    UPDATE NewsSite_Users SET IsEnabled = @isEnabled WHERE Id = @userId;
    SELECT @@ROWCOUNT AS Success;
END
GO

-- Get reported content
CREATE PROCEDURE SP_NewsSite_GetReportedContent
AS
BEGIN
    SELECT 
        sc.Id, sc.UserId, u.Name AS UserName, sc.ArticleTitle, sc.ArticleUrl, 
        sc.UserComment, sc.SharedAt, sc.IsReported
    FROM NewsSite_SharedContent sc
    INNER JOIN NewsSite_Users u ON sc.UserId = u.Id
    WHERE sc.IsReported = 1 AND sc.IsRemoved = 0
    ORDER BY sc.SharedAt DESC;
END
GO

-- Handle reported content
CREATE PROCEDURE SP_NewsSite_HandleReportedContent
    @contentId INT,
    @removeContent BIT
AS
BEGIN
    IF @removeContent = 1
    BEGIN
        UPDATE NewsSite_SharedContent SET IsRemoved = 1 WHERE Id = @contentId;
    END
    
    UPDATE NewsSite_ContentReports SET Handled = 1, HandledAt = GETDATE() WHERE ContentId = @contentId;
    UPDATE NewsSite_SharedContent SET IsReported = 0 WHERE Id = @contentId;
    
    SELECT 1 AS Success;
END
GO

-- Log user activity
CREATE PROCEDURE SP_NewsSite_LogUserActivity
    @userId INT,
    @activityType NVARCHAR(50),
    @timestamp DATETIME
AS
BEGIN
    INSERT INTO NewsSite_UserActivity (UserId, ActivityType, ActivityDate)
    VALUES (@userId, @activityType, @timestamp);
END
GO

-- =============================================
-- Create Indexes for Performance
-- =============================================

CREATE INDEX IX_NewsSite_UserInterests_UserId ON NewsSite_UserInterests(UserId);
CREATE INDEX IX_NewsSite_SavedArticles_UserId ON NewsSite_SavedArticles(UserId);
CREATE INDEX IX_NewsSite_SharedContent_UserId ON NewsSite_SharedContent(UserId);
CREATE INDEX IX_NewsSite_SharedContent_SharedAt ON NewsSite_SharedContent(SharedAt);
CREATE INDEX IX_NewsSite_ContentLikes_ContentId ON NewsSite_ContentLikes(ContentId);
CREATE INDEX IX_NewsSite_UserActivity_UserId_Date ON NewsSite_UserActivity(UserId, ActivityDate);
CREATE INDEX IX_NewsSite_UserActivity_Type_Date ON NewsSite_UserActivity(ActivityType, ActivityDate);
