FROM node:22-alpine

RUN npm install -g pnpm@10.33.4

WORKDIR /app

COPY . .

RUN pnpm install

RUN pnpm --filter @cloudcart/shared build

RUN pnpm --filter @cloudcart/auth build

EXPOSE 4001

CMD ["pnpm","--filter","@cloudcart/auth","start"]