@echo off   

:: see http://superuser.com/questions/78496/variables-in-batch-file-not-being-set-when-inside-if
setlocal enabledelayedexpansion

:: It looks like CMD.EXE uses 1 for Standard Output and 2 for Standard Error.
:: http://goo.gl/GUrKk
echo %0 1>con
echo %2 1>con
echo %3 1>con
echo %4 1>con
echo %5 1>con
echo %6 1>con
echo ------VARIABLES END--------- 1>con

set CWD=%~dp0
:: switch to working directory(contain grunt and this .bat file)
cd %CWD%

echo cwd: %CWD% >con

:: Post-commit PATH DEPTH MESSAGEFILE REVISION ERROR CWD
:: Start-commit PATH MESSAGEFILE CWD
:: http://goo.gl/kQBm3
set _PATH=%1
set DEPTH=%2

if not [%6] == [] (
	echo Hook Post-commit >con
	set MESSAGEFILE=%3
	set REVISION=%4
	set Error=%5
	set BRANCH=%6
	call grunt hook:postcommit --branch=!BRANCH! --messagefile=!_PATH! --rev=!REVISION! --cwd=!CWD! 1>errorlog.txt 2>&1 >con
) else (
	if not x%%3:%CWD=% == x%%3% (
		echo Hook Start-commit >con
		set BRANCH=%3
		call grunt hook:startcommit --branch=!BRANCH! --cwd=!CWD! 1>errorlog.txt 2>&1 >con
	)
)

:: pause > con < con 
if %errorlevel% gtr 0 (goto err) else exit 0  

:err
pause > con < con
echo see errorlog.txt for more information 1>&2
exit 1