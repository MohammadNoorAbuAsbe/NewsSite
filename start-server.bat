@echo off
cd "c:\Users\MohammadPC\Documents\GitHub\NewsSite\Server"
echo Starting NewsSite Server...
echo Swagger UI will open automatically in your browser...

rem Start the server in background
start /B dotnet run

rem Wait for server to start (adjust delay as needed)
timeout /t 5 /nobreak >nul

rem Open Swagger UI in default browser
start https://localhost:7259/swagger/index.html

rem Keep the window open
echo.
echo Server is running with Swagger UI open in browser
echo Press any key to stop the server...
pause >nul
