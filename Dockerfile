FROM node:22-slim

ENV COREPACK_INTEGRITY_KEYS=0
RUN corepack enable

WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile

EXPOSE 3000
CMD ["pnpm", "dev"]
