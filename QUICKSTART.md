# NewsSite Quick Start Guide

## Prerequisites

- .NET 6.0 SDK installed
- SQL Server (LocalDB will work)
- NewsAPI key (free from https://newsapi.org)

## Quick Setup (5 minutes)

### 1. Database Setup

```sql
-- Create database in SQL Server Management Studio or run:
CREATE DATABASE NewsSite;
-- Then execute the Database/NewsSite_Schema.sql script
```

### 2. Configure API Key

Edit `Server/appsettings.json`:

```json
{
  "NewsApi": {
    "ApiKey": "YOUR_NEWSAPI_KEY_HERE"
  },
  "ConnectionStrings": {
    "myProjDB": "Server=(localdb)\\mssqllocaldb;Database=NewsSite;Trusted_Connection=true;"
  }
}
```

### 3. Run the Server

```bash
cd Server
dotnet restore
dotnet run
```

Server will start on https://localhost:7259

### 4. Open the Website

- Open `website/index.html` in a browser
- Or use Live Server extension in VS Code
- Or serve the website folder with any web server

### 5. Test the Application

- Use the built-in API tester: `website/api-tester.html`
- Register a new user or login with:
  - Admin: admin@example.com / admin123
  - Regular user: user@example.com / user123

## Quick Test Checklist

- [ ] Server starts without errors
- [ ] News headlines load on homepage
- [ ] User registration works
- [ ] User login works
- [ ] Save article functionality
- [ ] Share article functionality
- [ ] Admin dashboard accessible (admin users only)

## Common Issues

### Database Connection Issues

- Ensure SQL Server is running
- Check connection string in appsettings.json
- Verify database exists and schema is applied

### NewsAPI Issues

- Verify API key is correct
- Check internet connection
- Ensure API key has sufficient quota

### CORS Issues (if using different ports)

- Server already configured to allow all origins
- If issues persist, check browser console for specific errors

## Development URLs

- Backend API: https://localhost:7259
- API Documentation: https://localhost:7259/swagger
- Frontend: http://localhost:3000 (if using Live Server)

## Next Steps

1. Explore all features using the navigation menu
2. Test admin functionality (requires admin account)
3. Use the API tester to validate all endpoints
4. Customize the UI and add your own features

For detailed documentation, see the main README.md file.
