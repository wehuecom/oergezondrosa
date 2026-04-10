@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "C:\Users\rosav\OneDrive\Desktop\LIO_OS\content-scraper"
node scraper.js >> scraper.log 2>&1
