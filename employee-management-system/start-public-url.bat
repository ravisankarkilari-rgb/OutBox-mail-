@echo off
title Outbox Mail - Public Live Tunnel
echo ========================================================
echo   Outbox Mail - Launching Live Public HTTPS URL
echo   Zero signup, zero credit cards, 100%% free!
echo ========================================================
echo.
echo Your current public IP for tunnel password is:
curl -s https://loca.lt/mytunnelpassword
echo.
echo Launching public tunnel on port 5000...
echo.
npx --yes localtunnel --port 5000
pause
