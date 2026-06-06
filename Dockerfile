# Stage 1: build web assets
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY web/package.json web/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Stage 2: runtime
FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY web/package.json web/
RUN pnpm install --frozen-lockfile --prod
COPY shared/ shared/
COPY server/ server/
COPY --from=builder /app/web/dist web/dist
VOLUME ["/app/server/data"]
EXPOSE 3000
ENV DATA_SOURCE=api
CMD ["pnpm", "start"]
