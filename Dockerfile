FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY server/package.json server/
COPY web/package.json web/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
VOLUME ["/app/server/data"]
EXPOSE 3000
ENV DATA_SOURCE=api
CMD ["pnpm", "start"]
