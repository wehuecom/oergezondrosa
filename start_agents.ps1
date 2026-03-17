# Oergezond Agents — opstarten
# Dubbelklik dit bestand of run in PowerShell: .\start_agents.ps1

Write-Host "Agents opstarten..." -ForegroundColor Cyan

# Start Amy via PM2 (blijft draaien ook als dit venster sluit)
pm2 start "C:\Users\rosav\OneDrive\Desktop\LIO_OS\customer-support\amy\amy.js" --name "amy" 2>$null
pm2 save

Write-Host "Amy draait op de achtergrond." -ForegroundColor Green
Write-Host "Stoppen: pm2 stop amy" -ForegroundColor Gray
Write-Host "Status:  pm2 status" -ForegroundColor Gray
