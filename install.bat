@echo off
call npm uninstall -g grunt
for /f "delims=" %%i in ('npm ls grunt-cli --global') do @set s=%%i
echo %s%|findstr /r "grunt-cli@" >nul:
if %errorlevel%==1 call npm install -g grunt-cli
call npm install
if exist imagemin.js move /Y imagemin.js node_modules/grunt-contrib-imagemin/tasks
pause
