FROM node:22.22.2-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install --global pnpm@10.32.1
WORKDIR /workspace
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @minimart/product-service... build
ENV NODE_ENV=production
WORKDIR /workspace/apps/product-service
USER node
EXPOSE 3002
CMD ["sh", "-c", "pnpm db:migrate && pnpm db:seed && node dist/main.js"]
