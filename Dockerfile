FROM node:20-alpine AS deps
WORKDIR /app

RUN corepack enable
COPY package.json yarn.lock .yarnrc.yml ./
RUN corepack prepare yarn@4.8.1 --activate \
  && yarn install --immutable

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=development

RUN corepack enable
RUN corepack prepare yarn@4.8.1 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3000
CMD ["yarn", "start:dev"]
