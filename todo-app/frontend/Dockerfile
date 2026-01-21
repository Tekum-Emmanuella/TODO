FROM alpine:latest AS builder

WORKDIR /app

COPY index.html .
COPY style.css .
COPY script.js .

FROM nginx:stable-alpine AS runner

COPY --from=builder --chown=nginx:nginx /app /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
