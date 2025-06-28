FROM node:20-alpine as base

WORKDIR /app

COPY package.json package-lock.json /app/

RUN --mount=type=cache,target=/root/.npm \
    npm install --frozen-lockfile

FROM base as production

ENV NODE_ENV=production

COPY . /app/

RUN npm build

CMD [ "node_modules/.bin/strapi", "start" ]
