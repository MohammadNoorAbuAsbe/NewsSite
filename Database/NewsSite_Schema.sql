-- NewsSite Database Schema
-- This script creates all necessary tables and stored procedures for the NewsSite project

-- =============================================
-- Create Tables
-- =============================================
CREATE TABLE [dbo].[NewsSite_Articles] (
    [Id]          INT             IDENTITY (1, 1) NOT NULL,
    [Title]       NVARCHAR (500)  NOT NULL,
    [Description] NTEXT           NULL,
    [Url]         NVARCHAR (1000) NOT NULL,
    [UrlToImage]  NVARCHAR (1000) NULL,
    [PublishedAt] DATETIME        NULL,
    [SourceName]  NVARCHAR (200)  NULL,
    PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_NewsSite_Articles_Url] UNIQUE NONCLUSTERED ([Url] ASC)
);

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


-- Tags table for news categories
CREATE TABLE NewsSite_Tags (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(50) UNIQUE NOT NULL,
    Custom BIT DEFAULT 0, -- True if it's a user-created custom tag
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Saved articles for each user
CREATE TABLE NewsSite_SavedArticles (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    ArticleId INT NOT NULL,
    SavedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES NewsSite_Users(Id) ON DELETE CASCADE,
    FOREIGN KEY (ArticleId) REFERENCES NewsSite_Articles(Id) ON DELETE CASCADE
);

-- Shared content - articles shared by users with comments
CREATE TABLE NewsSite_SharedContent (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    ArticleId INT NOT NULL,
    UserComment NTEXT,
    SharedAt DATETIME DEFAULT GETDATE(),
    IsReported BIT DEFAULT 0,
    IsRemoved BIT DEFAULT 0,
    FOREIGN KEY (UserId) REFERENCES NewsSite_Users(Id) ON DELETE NO ACTION,
    FOREIGN KEY (ArticleId) REFERENCES NewsSite_Articles(Id) ON DELETE CASCADE
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

CREATE TABLE NewsSite_ContentDislikes (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ContentId INT NOT NULL,
    UserId INT NOT NULL,
    DislikedAt DATETIME DEFAULT GETDATE(),
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

-- User settings for blocking relationships
CREATE TABLE [dbo].[NewsSite_UserSettings] (
    [UserId]               INT             NOT NULL,
    [BlockedUserId]       INT             NOT NULL,
    [UpdatedAt]            DATETIME        DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([UserId], [BlockedUserId] ASC),
    FOREIGN KEY ([UserId]) REFERENCES [dbo].[NewsSite_Users] ([Id]) ON DELETE CASCADE,
	FOREIGN KEY ([BlockedUserId]) REFERENCES [dbo].[NewsSite_Users] ([Id]) ON DELETE NO ACTION
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
    ('Business', 0),
    ('Entertainment', 0),
    ('General', 0),
    ('Health', 0),
    ('Science', 0),
    ('Sports', 0),
    ('Technology', 0);

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

-- Get user saved articles
CREATE PROCEDURE SP_NewsSite_GetUserSavedArticles
    @userId INT
AS
BEGIN
    SELECT 
        sa.Id, sa.SavedAt,
        a.Title AS ArticleTitle, a.Url AS ArticleUrl, a.Description AS ArticleDescription,
        a.UrlToImage AS ArticleImageUrl, a.PublishedAt AS ArticlePublishedAt, a.SourceName AS ArticleSource
    FROM NewsSite_SavedArticles sa
    INNER JOIN NewsSite_Articles a ON sa.ArticleId = a.Id
    WHERE sa.UserId = @userId 
    ORDER BY sa.SavedAt DESC;
END
GO

-- Save article
CREATE PROCEDURE SP_NewsSite_SaveArticle
    @userId INT,
    @articleId INT
AS
BEGIN
    -- Check if article already saved by user
    IF NOT EXISTS (SELECT 1 FROM NewsSite_SavedArticles WHERE UserId = @userId AND ArticleId = @articleId)
    BEGIN
        INSERT INTO NewsSite_SavedArticles (UserId, ArticleId)
        VALUES (@userId, @articleId);
        
        -- Log activity
        INSERT INTO NewsSite_UserActivity (UserId, ActivityType) VALUES (@userId, 'save_article');
        
        SELECT 1 AS Success, 'Article saved successfully' AS Message;
    END
    ELSE
    BEGIN
        SELECT 0 AS Success, 'Article already saved' AS Message;
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

-- Search saved articles by title, description, or source
CREATE PROCEDURE SP_NewsSite_SearchUserSavedArticles
    @userId INT,
    @searchTerm NVARCHAR(255)
AS
BEGIN
    SELECT 
        sa.Id, sa.SavedAt,
        a.Title AS ArticleTitle, a.Url AS ArticleUrl, a.Description AS ArticleDescription,
        a.UrlToImage AS ArticleImageUrl, a.PublishedAt AS ArticlePublishedAt, a.SourceName AS ArticleSource
    FROM NewsSite_SavedArticles sa
    INNER JOIN NewsSite_Articles a ON sa.ArticleId = a.Id
    WHERE sa.UserId = @userId 
    AND (
        a.Title LIKE '%' + @searchTerm + '%' 
        OR a.Description LIKE '%' + @searchTerm + '%' 
        OR a.SourceName LIKE '%' + @searchTerm + '%'
    )
    ORDER BY sa.SavedAt DESC;
END
GO

-- Get all shared content (filtered by blocked users)

CREATE PROCEDURE SP_NewsSite_GetFilteredSharedContent
    @currentUserId INT
AS
BEGIN
    SELECT 
        sc.Id, sc.UserId, u.Name AS UserName, 
        a.Title AS ArticleTitle, a.Url AS ArticleUrl, a.Description AS ArticleDescription,
        a.UrlToImage AS ArticleImageUrl, a.PublishedAt AS ArticlePublishedAt, a.SourceName AS ArticleSource,
        sc.UserComment, sc.SharedAt, sc.IsReported,
        (SELECT COUNT(*) FROM NewsSite_ContentLikes WHERE ContentId = sc.Id) AS LikesCount,
        (SELECT COUNT(*) FROM NewsSite_ContentDislikes WHERE ContentId = sc.Id) AS DislikesCount,
        CASE WHEN EXISTS (SELECT 1 FROM NewsSite_ContentLikes WHERE ContentId = sc.Id AND UserId = @currentUserId) THEN 1 ELSE 0 END AS UserHasLiked,
        CASE WHEN EXISTS (SELECT 1 FROM NewsSite_ContentDislikes WHERE ContentId = sc.Id AND UserId = @currentUserId) THEN 1 ELSE 0 END AS UserHasDisliked
    FROM NewsSite_SharedContent sc
    INNER JOIN NewsSite_Users u ON sc.UserId = u.Id
    INNER JOIN NewsSite_Articles a ON sc.ArticleId = a.Id
    WHERE sc.IsRemoved = 0
        AND sc.UserId NOT IN (
            SELECT BlockedUserId 
            FROM NewsSite_UserSettings 
            WHERE UserId = @currentUserId
        )
    ORDER BY sc.SharedAt DESC;
END
GO

CREATE PROCEDURE SP_NewsSite_GetAllSharedContent
    @currentUserId INT
AS
BEGIN
    SELECT 
        sc.Id, sc.UserId, u.Name AS UserName, 
        a.Title AS ArticleTitle, a.Url AS ArticleUrl, a.Description AS ArticleDescription,
        a.UrlToImage AS ArticleImageUrl, a.PublishedAt AS ArticlePublishedAt, a.SourceName AS ArticleSource,
        sc.UserComment, sc.SharedAt, sc.IsReported,
        (SELECT COUNT(*) FROM NewsSite_ContentLikes WHERE ContentId = sc.Id) AS LikesCount,
        (SELECT COUNT(*) FROM NewsSite_ContentDislikes WHERE ContentId = sc.Id) AS DislikesCount,
        CASE WHEN EXISTS (SELECT 1 FROM NewsSite_ContentLikes WHERE ContentId = sc.Id AND UserId = @currentUserId) THEN 1 ELSE 0 END AS UserHasLiked,
        CASE WHEN EXISTS (SELECT 1 FROM NewsSite_ContentDislikes WHERE ContentId = sc.Id AND UserId = @currentUserId) THEN 1 ELSE 0 END AS UserHasDisliked
    FROM NewsSite_SharedContent sc
    INNER JOIN NewsSite_Users u ON sc.UserId = u.Id
    INNER JOIN NewsSite_Articles a ON sc.ArticleId = a.Id
    WHERE sc.IsRemoved = 0
    ORDER BY sc.SharedAt DESC;
END
GO


-- Share content
CREATE PROCEDURE SP_NewsSite_ShareContent
    @userId INT,
    @articleId INT,
    @userComment NTEXT
AS
BEGIN
    INSERT INTO NewsSite_SharedContent (UserId, ArticleId, UserComment)
    VALUES (@userId, @articleId, @userComment);
    
    -- Log the sharing activity
    INSERT INTO NewsSite_UserActivity (UserId, ActivityType, ActivityDate)
    VALUES (@userId, 'content_shared', GETDATE());
    
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
        
        -- Log the reporting activity
        INSERT INTO NewsSite_UserActivity (UserId, ActivityType, ActivityDate)
        VALUES (@reporterId, 'content_reported', GETDATE());
        
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
    -- Remove any existing dislike from this user for this content
    DELETE FROM NewsSite_ContentDislikes WHERE ContentId = @contentId AND UserId = @userId;
    
    -- Add like if not already liked
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

-- Dislike content
CREATE PROCEDURE SP_NewsSite_DislikeContent
    @contentId INT,
    @userId INT
AS
BEGIN
    -- Remove any existing like from this user for this content
    DELETE FROM NewsSite_ContentLikes WHERE ContentId = @contentId AND UserId = @userId;
    
    -- Add dislike if not already disliked
    IF NOT EXISTS (SELECT 1 FROM NewsSite_ContentDislikes WHERE ContentId = @contentId AND UserId = @userId)
    BEGIN
        INSERT INTO NewsSite_ContentDislikes (ContentId, UserId) VALUES (@contentId, @userId);
        SELECT 1 AS Success;
    END
    ELSE
    BEGIN
        SELECT 0 AS Success;
    END
END
GO

-- Remove dislike from content
CREATE PROCEDURE SP_NewsSite_UndislikeContent
    @contentId INT,
    @userId INT
AS
BEGIN
    DELETE FROM NewsSite_ContentDislikes WHERE ContentId = @contentId AND UserId = @userId;
    SELECT @@ROWCOUNT AS Success;
END
GO


-- Get all users
CREATE PROCEDURE SP_NewsSite_GetUsers
AS
BEGIN
    SELECT Id, Name, Email, [Password], IsAdmin, IsEnabled, CreatedAt
    FROM NewsSite_Users 
    ORDER BY CreatedAt DESC;
END

-- Get user settings (blocked users)
CREATE PROCEDURE SP_NewsSite_GetUserSettings
    @userId INT
AS
BEGIN
    SELECT UserId, BlockedUserId, UpdatedAt
    FROM NewsSite_UserSettings 
    WHERE UserId = @userId;
END
GO

-- Block user (add a row)
CREATE PROCEDURE SP_NewsSite_BlockUser
    @userId INT,
    @userToBlockId INT
AS
BEGIN
    -- Check if the blocking relationship already exists
    IF NOT EXISTS (SELECT 1 FROM NewsSite_UserSettings WHERE UserId = @userId AND BlockedUserId = @userToBlockId)
    BEGIN
        INSERT INTO NewsSite_UserSettings (UserId, BlockedUserId, UpdatedAt)
        VALUES (@userId, @userToBlockId, GETDATE());
    END
    
    SELECT 1 AS Success;
END
GO

-- Unblock user (delete a row)
CREATE PROCEDURE SP_NewsSite_UnblockUser
    @userId INT,
    @userToUnblockId INT
AS
BEGIN
    DELETE FROM NewsSite_UserSettings 
    WHERE UserId = @userId AND BlockedUserId = @userToUnblockId;
    
    SELECT @@ROWCOUNT AS Success;
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
        sc.Id, sc.UserId, u.Name AS UserName, 
        a.Title AS ArticleTitle,
        a.Url AS ArticleUrl,
        a.Description AS ArticleDescription,
        a.UrlToImage AS ArticleImageUrl,
        a.PublishedAt AS ArticlePublishedAt,
        a.SourceName AS ArticleSource,
        sc.UserComment, sc.SharedAt, sc.IsReported,
        (SELECT COUNT(*) FROM NewsSite_ContentLikes WHERE ContentId = sc.Id) AS LikesCount,
        (SELECT COUNT(*) FROM NewsSite_ContentDislikes WHERE ContentId = sc.Id) AS DislikesCount
    FROM NewsSite_SharedContent sc
    INNER JOIN NewsSite_Users u ON sc.UserId = u.Id
    INNER JOIN NewsSite_Articles a ON sc.ArticleId = a.Id
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

-- Add article (or get existing article ID if URL already exists)
CREATE PROCEDURE SP_NewsSite_AddArticle
    @title NVARCHAR(500),
    @description NTEXT,
    @url NVARCHAR(1000),
    @urlToImage NVARCHAR(1000),
    @publishedAt DATETIME,
    @sourceName NVARCHAR(200)
AS
BEGIN
    DECLARE @articleId INT;
    
    -- Check if article already exists by URL
    SELECT @articleId = Id 
    FROM NewsSite_Articles 
    WHERE Url = @url;
    
    -- If article doesn't exist, insert it
    IF @articleId IS NULL
    BEGIN
        INSERT INTO NewsSite_Articles (Title, Description, Url, UrlToImage, PublishedAt, SourceName)
        VALUES (@title, @description, @url, @urlToImage, @publishedAt, @sourceName);
        
        SET @articleId = SCOPE_IDENTITY();
    END
    
    -- Return the article ID (either existing or newly created)
    SELECT @articleId AS ArticleId;
END
GO

-- Get recent activity for admin dashboard
CREATE PROCEDURE SP_NewsSite_GetRecentActivity
AS
BEGIN
    SELECT TOP 20
        ua.ActivityType,
        u.Name AS UserName,
        ua.ActivityDate AS Timestamp,
        '' AS Details
    FROM NewsSite_UserActivity ua
    INNER JOIN NewsSite_Users u ON ua.UserId = u.Id
    ORDER BY ua.ActivityDate DESC;
END
GO

-- =============================================
-- Create Indexes for Performance
-- =============================================

CREATE INDEX IX_NewsSite_SavedArticles_UserId ON NewsSite_SavedArticles(UserId);
CREATE INDEX IX_NewsSite_SavedArticles_ArticleId ON NewsSite_SavedArticles(ArticleId);
CREATE INDEX IX_NewsSite_SharedContent_UserId ON NewsSite_SharedContent(UserId);
CREATE INDEX IX_NewsSite_SharedContent_ArticleId ON NewsSite_SharedContent(ArticleId);
CREATE INDEX IX_NewsSite_SharedContent_SharedAt ON NewsSite_SharedContent(SharedAt);
CREATE INDEX IX_NewsSite_ContentLikes_ContentId ON NewsSite_ContentLikes(ContentId);
CREATE INDEX IX_NewsSite_UserActivity_UserId_Date ON NewsSite_UserActivity(UserId, ActivityDate);
CREATE INDEX IX_NewsSite_UserActivity_Type_Date ON NewsSite_UserActivity(ActivityType, ActivityDate);
CREATE INDEX IX_NewsSite_Articles_Title ON NewsSite_Articles(Title);
CREATE INDEX IX_NewsSite_Articles_SourceName ON NewsSite_Articles(SourceName);
CREATE INDEX IX_NewsSite_ContentDislikes_ContentId ON NewsSite_ContentDislikes(ContentId);
CREATE INDEX IX_NewsSite_ContentDislikes_UserId ON NewsSite_ContentDislikes(UserId);
