# Stage 1
FROM alpine AS builder
WORKDIR /app
COPY index.html .
COPY style.css .
COPY script.js .

# Stage 2
FROM nginx:stable-alpine
COPY --from=builder /app /usr/share/nginx/html
ARG PORT=80
EXPOSE ${PORT}
