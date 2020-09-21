# First step: build the assets
FROM node:lts-alpine AS builder

WORKDIR /app
ADD package.json yarn.lock ./
ADD ./ui/package.json ./ui/
# install and build backend
RUN yarn install --ci

COPY . .

WORKDIR /app/ui

ENV NODE_ENV=production
ENV VUE_APP_API_URL=/
ENV BASE_URL=/app/
RUN yarn build

FROM nginx:1.16.0-alpine
HEALTHCHECK --timeout=1s --retries=99 \
        CMD wget -q --spider http://127.0.0.1:80/ \
         || exit 1

ADD ./nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/ui/dist /usr/share/nginx/html
