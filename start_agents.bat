@echo off
powershell.exe -Command "pm2 resurrect; pm2 start 'C:\Users\rosav\OneDrive\Desktop\LIO_OS\customer-support\amy\amy.js' --name 'amy' 2>$null; pm2 save; Write-Host 'Amy draait.' -ForegroundColor Green; Start-Sleep 2"
