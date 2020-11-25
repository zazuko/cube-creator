# First step: build the assets
FROM node:lts-alpine AS builder

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

RUN yarn tsc --outDir dist --module CommonJS

FROM node:14-alpine

WORKDIR /app

ADD package.json yarn.lock ./
ADD ./cli/package.json ./cli/
ADD ./cli/lib/toCubeShape ./cli/lib/toCubeShape/
ADD ./cli/pipelines ./cli/pipelines/
ADD ./packages/core/package.json ./packages/core/
ADD ./packages/model/package.json ./packages/model/
ADD ./packages/testing/package.json ./packages/testing/

# for every new package foo add
#ADD ./packages/foo/package.json ./packages/foo/

RUN yarn install --production --frozen-lockfile
COPY --from=builder /app/dist/cli ./cli/
COPY --from=builder /app/dist/packages/ ./packages/

ENTRYPOINT ["node", "cli/index.js"]
