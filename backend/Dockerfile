# ── Stage 1: dependency installer ──────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /install

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --prefix=/runtime --no-cache-dir -r requirements.txt


# ── Stage 2: lean runtime ───────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

WORKDIR /srv

COPY --from=builder /runtime /usr/local

# Install ffmpeg for audio processing (STT)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# context is ./backend, so "." = backend/ contents land at /srv/
# giving us /srv/app/main.py, /srv/app/models/... etc.
COPY . .

RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Create tts_clips directory and grant write permissions to appuser
RUN mkdir -p /srv/tts_clips && chown -R appuser:appgroup /srv/tts_clips

USER appuser

EXPOSE 8000

CMD ["python3", "-m", "app.main"]