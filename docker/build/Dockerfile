FROM node:20-bookworm-slim AS frontend-builder
WORKDIR /src/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM golang:1.25-bookworm AS backend-builder
WORKDIR /src/backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/server ./cmd/server

FROM debian:bookworm-slim
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN useradd -r -u 10001 -m -d /app -s /usr/sbin/nologin appuser

COPY --from=backend-builder /out/server /app/server
COPY --from=frontend-builder /src/frontend/dist /app/static
COPY backend/plugins /app/backend/plugins
COPY docker/build/start.sh /app/start.sh

RUN chmod +x /app/start.sh \
  && mkdir -p /app/uploads /app/data /app/backend/plugins \
  && chown -R appuser:appuser /app

EXPOSE 8080
USER appuser
CMD ["/app/start.sh"]
