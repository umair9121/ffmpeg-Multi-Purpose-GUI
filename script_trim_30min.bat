#!/bin/bash

# Directory containing the m4a files
DIR="CHANGE TO YOUR DIRECTORY"

# Loop over each m4a file in the directory
for FILE in "$DIR"/*.m4a
do
  # Get the base name of the file (without path and extension)
  BASENAME=$(basename "$FILE" .m4a)

  # Output file name (appends "_trimmed" to original file name)
  OUTPUT="$DIR/${BASENAME}_trimmed.m4a"

  # Use ffmpeg to trim the audio to the first 30 minutes
  ffmpeg -i "$FILE" -t 00:30:00 -c copy "$OUTPUT"
done
