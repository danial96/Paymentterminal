@echo off
cd /d C:\xampp\htdocs\softcube-crm
npx tsx scripts\sync-sheet.ts >> logs\sync.log 2>&1
