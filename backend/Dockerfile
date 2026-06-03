FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV PATH="/opt/venv/bin:$PATH"

# Install uv package manager
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies using uv inside a virtual environment
COPY requirements.txt /app/
RUN uv venv /opt/venv && uv pip install --no-cache -r requirements.txt

# Copy project
COPY . /app/

# Expose port
EXPOSE 8000

# Run FastAPI app
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
