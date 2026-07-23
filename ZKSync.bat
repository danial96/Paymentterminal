@echo off
title ZK Attendance Sync
echo [%date% %time%] ZK Sync started...
:loop
python "E:\projects\Softcube CRM\scripts\zk_auto_sync.py"
echo [%date% %time%] Next sync in 15 minutes...
timeout /t 900 /nobreak > nul
goto loop
