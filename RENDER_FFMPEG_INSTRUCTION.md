IMPORTANT: You must ensure FFmpeg is installed on your Render instance. Add the following to your Render build script or environment settings:

# For Render, you might need a build script that installs ffmpeg:
# Example build.sh:
# apt-get update && apt-get install -y ffmpeg

# Or ensure your Dockerfile (if using) includes:
# RUN apt-get update && apt-get install -y ffmpeg

