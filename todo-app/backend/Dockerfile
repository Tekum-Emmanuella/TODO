FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

FROM node:18-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm install --production

FROM node:18-alpine AS runner

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

COPY --from=deps /app/node_modules ./

COPY --from=builder /app/. .

EXPOSE 5000

CMD ["node", "server.js"]
