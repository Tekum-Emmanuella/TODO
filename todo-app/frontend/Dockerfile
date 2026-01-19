# Stage 1: Build - Prepare static files
FROM alpine AS builder
WORKDIR /app
COPY index.html .
COPY style.css .
COPY script.js .

# Stage 2: Test - Perform a basic check (e.g., verify index.html exists)
FROM alpine AS tester
WORKDIR /app
COPY --from=builder /app/index.html .
RUN test -f index.html || { echo "index.html not found!"; exit 1; }

# Stage 3: Run - Nginx serving files
FROM nginx:stable-alpine AS runner
COPY --from=builder /app /usr/share/nginx/html

# Expose the port Nginx listens on
ARG PORT=80
EXPOSE ${PORT}
CMD ["nginx", "-g", "daemon off;"]
