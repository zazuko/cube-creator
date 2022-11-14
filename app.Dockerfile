# First step: build the assets
FROM node:16-alpine AS builder

# Do not install Cypress
ENV CYPRESS_INSTALL_BINARY=0

# Mitigate a heap-size issue
ENV NODE_OPTIONS="--max-old-space-size=5120"

WORKDIR /app
ADD package.json yarn.lock ./
ADD ./ui/package.json ./ui/
ADD ./packages/core/package.json ./packages/core/
ADD ./packages/model/package.json ./packages/model/
ADD ./packages/testing/package.json ./packages/testing/
ADD ./typings ./

# for every new package foo add:
# ADD ./packages/foo/package.json ./packages/foo/

# install and build backend
RUN yarn install --frozen-lockfile

COPY . .

WORKDIR /app/ui

# This arg allows setting the public path at build time
# e.g. `docker build --build-arg PUBLIC_PATH=/app/`
ARG PUBLIC_PATH=/

# build with `docker build --build-arg COMMIT=$(git rev-parse HEAD)`
ARG COMMIT

ENV PUBLIC_PATH=$PUBLIC_PATH
ENV NODE_ENV=production
ENV VUE_APP_COMMIT=$COMMIT
ENV VUE_APP_SENTRY_RELEASE=cube-creator-app@$COMMIT
RUN yarn build

FROM nginx:1.19.0-alpine
HEALTHCHECK --timeout=1s --retries=99 \
        CMD wget -q --spider http://127.0.0.1:80/ \
         || exit 1

ARG PUBLIC_PATH

ADD ./nginx/default.conf /etc/nginx/conf.d/default.conf
ADD ./nginx/template-config.sh /docker-entrypoint.d/50-template-config.sh
COPY --from=builder /app/ui/dist /usr/share/nginx/html$PUBLIC_PATH

# Have the index.html at the root of the web directory to have the "catch-all"
# fallback working, regardless of the PUBLIC_PATH
COPY --from=builder /app/ui/dist/index.html /usr/share/nginx/html/index.html

# This variable is used by the `template-config.sh` script to know where to put
# the templated `config.js`
ENV WEB_ROOT=/usr/share/nginx/html$PUBLIC_PATH
