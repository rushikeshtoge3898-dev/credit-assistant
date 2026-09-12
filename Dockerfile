# Multi-stage / lightweight Python 3.13 production runtime
FROM python:3.13-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Set working directory
WORKDIR /app

# Install system dependencies (build tools for bcrypt/cryptography if needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source code
COPY . .

# Ensure data directory exists for persistent SQLite volumes
RUN mkdir -p /app/data

# Expose API port
EXPOSE 8000

# Run uvicorn server binding to 0.0.0.0 and PORT environment variable
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
