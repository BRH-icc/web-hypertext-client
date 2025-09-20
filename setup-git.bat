@echo off
echo Setting up Git repository for Web Hypertext Client...
echo.

REM Initialize git repository
git init

REM Configure git (replace with your GitHub username and email)
echo Please configure Git with your GitHub credentials:
echo git config --global user.name "Your GitHub Username"
echo git config --global user.email "your.email@example.com"
echo.
pause

REM Add all files
git add .

REM Create initial commit
git commit -m "Initial commit: Complete Web Hypertext Client implementation

- Cross-platform Electron-based web browser
- Collaborative hypertext editor with ProseMirror
- Intelligent web crawler (Knowbot) with search capabilities
- Document export engine (PDF, LaTeX, HTML)
- Responsive UI with dark mode support
- Comprehensive documentation and project structure

Recreating the original vision of the collaborative web as conceived by Tim Berners-Lee at CERN."

REM Instructions for adding GitHub remote
echo.
echo ==========================================
echo NEXT STEPS:
echo ==========================================
echo 1. Go to https://github.com and create a new repository
echo 2. Name it: web-hypertext-client
echo 3. DO NOT initialize with README (we already have one)
echo 4. Copy the repository URL (should look like: https://github.com/yourusername/web-hypertext-client.git)
echo 5. Run these commands with your actual repository URL:
echo.
echo    git remote add origin https://github.com/yourusername/web-hypertext-client.git
echo    git branch -M main
echo    git push -u origin main
echo.
pause