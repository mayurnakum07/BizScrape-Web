# BizScrape Python API - long-running FastAPI + Playwright scraper
#
# Build:  docker build -t bizscrape-api .
# Run:    docker run --rm -p 8000:8000 -v bizscrape-jobs:/data/jobs \
#           -e HOST=0.0.0.0 -e ALLOWED_ORIGINS=https://your-frontend.example \
#           bizscrape-api
#
# Requires a persistent volume for JOB_DATA_DIR when jobs should survive restarts.

FROM mcr.microsoft.com/playwright/python:v1.49.1-noble

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HOST=0.0.0.0 \
    PORT=8000 \
    JOB_DATA_DIR=/data/jobs \
    DEBUG=false \
    LOG_LEVEL=INFO

COPY pyproject.toml requirements.txt README.md LICENSE ./
COPY src ./src
COPY main.py ./

RUN pip install --no-cache-dir -e .

RUN playwright install chromium

VOLUME ["/data/jobs"]
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health')" || exit 1

CMD ["python", "-m", "bizscrape.api"]
