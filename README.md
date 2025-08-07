# NewsSite - News Portal

## Overview

NewsSite is a news portal application that allows users to browse, save, and share news articles. Built with ASP.NET Core backend and JavaScript frontend.

## Features

- **User Authentication** - Registration, login, and session management
- **News Browsing** - Real-time news via NewsAPI with category filtering
- **Article Management** - Save and search articles
- **Content Sharing** - Share articles with comments and community interactions
- **Interest Management** - Tag-based personalization
- **Admin Dashboard** - User management and analytics

## Technology Stack

- **Backend**: ASP.NET Core 6.0, SQL Server
- **Frontend**: JavaScript (ES6+), Bootstrap 4.4
- **External API**: NewsAPI

## Quick Start

### Prerequisites

- .NET 6.0 SDK
- SQL Server (LocalDB or full instance)
- NewsAPI key (free from newsapi.org)

### Setup

1. **Database**: Execute `Database/NewsSite_Schema.sql` in SQL Server
2. **Backend**:
   - Navigate to `Server/` directory
   - Update connection string and NewsAPI key in `appsettings.json`
   - Run `dotnet restore` and `dotnet run`
3. **Frontend**:
   - Update server URLs in `website/js/config.js`
   - Serve the `website/` directory with any web server

## Project Structure

```
NewsSite/
├── Server/                    # ASP.NET Core backend
│   ├── Controllers/           # API endpoints
│   ├── Models/               # Data models
│   ├── DAL/                  # Database services
│   └── appsettings.json      # Configuration
├── website/                  # Frontend application
│   ├── *.html               # Web pages
│   ├── js/                  # JavaScript modules
│   └── css/                 # Stylesheets
└── Database/                # SQL scripts
    └── NewsSite_Schema.sql  # Database schema
```

## License

This project is developed for educational purposes.
