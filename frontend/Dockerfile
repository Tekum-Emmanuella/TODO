# Stage 1: Builder
FROM alpine AS builder
WORKDIR /app
COPY index.html .
COPY style.css .
COPY script.js .

# Stage 2: Production
FROM nginx:stable-alpine
COPY --from=builder /app /usr/share/nginx/html
EXPOSE 80
