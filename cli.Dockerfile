# First step: build the assets
FROM node:18-alpine AS builder

WORKDIR /app
ADD package.json yarn.lock ./
ADD ./cli/package.json ./cli/
ADD ./packages/core/package.json ./packages/core/
ADD ./packages/model/package.json ./packages/model/
ADD ./packages/testing/package.json ./packages/testing/

# for every new package foo add:
# ADD ./packages/foo/package.json ./packages/foo/

# install and build backend
RUN yarn install --frozen-lockfile

COPY . .
RUN rm -rf ./ui
RUN rm -rf ./apis
RUN rm -rf ./cli/test
RUN rm -rf ./packages/model/test
RUN rm -rf ./packages/testing
RUN rm -rf ./packages/express
RUN rm -rf ./packages/express-rdf-request
RUN rm -rf ./packages/shacl-middleware

RUN yarn tsc --outDir dist --module CommonJS

FROM node:18-alpine

WORKDIR /app

ADD package.json yarn.lock ./
ADD ./cli/package.json ./cli/
COPY ./cli/*.ttl ./cli/
ADD ./cli/pipelines ./cli/pipelines/
ADD ./packages/core/package.json ./packages/core/
ADD ./packages/model/package.json ./packages/model/
ADD ./packages/testing/package.json ./packages/testing/

# for every new package foo add
#ADD ./packages/foo/package.json ./packages/foo/

RUN yarn install --production --frozen-lockfile
COPY --from=builder /app/dist/cli ./cli/
COPY --from=builder /app/dist/packages/ ./packages/

# build with `docker build --build-arg COMMIT=$(git rev-parse HEAD)`
ARG COMMIT
ENV SENTRY_RELEASE=cube-creator-cli@$COMMIT

ENTRYPOINT ["node", "--unhandled-rejections=strict", "cli/index.js"]
