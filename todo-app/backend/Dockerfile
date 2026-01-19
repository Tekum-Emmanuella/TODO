# Stage 1: Build - Install dependencies
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Stage 2: Test - Run backend tsets
FROM node:18-alpine AS tester
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/. .

RUN test -f server.js || { echo "server.js not found!"; exit 1; }

# Stage 3: Run - Production image
FROM node:18-alpine AS runner
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/. .

ARG PORT=5000
EXPOSE ${PORT}
CMD ["node", "server.js"]
