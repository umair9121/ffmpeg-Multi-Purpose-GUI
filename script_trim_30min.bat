@echo off
setlocal enabledelayedexpansion

REM Directory containing the m4a files
set DIR="YOUR DIRECTORY"

REM Loop over each m4a file in the directory
for %%F in (%DIR%\*.m4a) do (
  REM Get the base name of the file (without path and extension)
  for %%A in ("%%~nF") do set "BASENAME=%%~A"

  REM Output file name (appends "_trimmed" to original file name)
  set OUTPUT="%DIR%\!BASENAME!_trimmed.m4a"

  REM Use ffmpeg to trim the audio to the first 30 minutes
  ffmpeg -i "%%F" -t 00:30:00 -c copy !OUTPUT!
)
endlocal
