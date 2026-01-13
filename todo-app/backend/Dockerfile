# Stage 1
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Stahe 2
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/. .
ARG PORT=5000
EXPOSE ${PORT}
CMD ["node", "server.js"]
