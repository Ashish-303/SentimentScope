# Use official Python lightweight slim image
FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable buffering for logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory
WORKDIR /app

# Install system dependencies (build-essential needed for any compiled C dependencies)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file and install python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire workspace into the docker image
COPY . .

# Expose the Flask development/production port
EXPOSE 5000

# Set environment variables with defaults
ENV FLASK_APP=backend/app.py
ENV FLASK_ENV=production
ENV PORT=5000
ENV HOST=0.0.0.0

# Start the Flask web application using python
CMD ["python", "backend/app.py"]
