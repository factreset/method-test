FROM oven/bun:latest

WORKDIR /app

COPY app/package.json ./

RUN bun install

COPY app/src ./src

EXPOSE 3000

CMD ["bun", "src/index.ts"]
