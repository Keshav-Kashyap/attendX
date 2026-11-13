@echo off
echo Initializing database tables and default data for FastAPI...

if exist ".\venv\Scripts\python.exe" (
    .\venv\Scripts\python.exe init_db.py
) else (
    py init_db.py
    if %ERRORLEVEL% NEQ 0 (
        python init_db.py
    )
)

echo.
echo Done!
pause