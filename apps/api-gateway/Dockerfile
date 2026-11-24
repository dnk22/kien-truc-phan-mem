FROM node:22.22.2-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install --global pnpm@10.32.1
WORKDIR /workspace
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @minimart/api-gateway... build
ENV NODE_ENV=production
WORKDIR /workspace/apps/api-gateway
USER node
EXPOSE 8080
CMD ["sh", "-c", "node dist/main.js"]
