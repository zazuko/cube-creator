# First step: build the assets
FROM node:lts-alpine AS builder

WORKDIR /app
ADD package.json yarn.lock ./
ADD ./apis/core/package.json ./apis/core/
ADD ./packages/core/package.json ./packages/core/

# for every new package foo add
#ADD ./packages/foo/package.json ./packages/foo/

# install and build backend
RUN yarn install --frozen-lockfile

COPY . .
RUN rm -rf ./ui

RUN yarn tsc --outDir dist

FROM node:14-alpine

WORKDIR /app

ADD package.json yarn.lock ./
ADD ./apis/core/package.json ./apis/core/
ADD ./packages/core/package.json ./packages/core/

# for every new package foo add
#ADD ./packages/foo/package.json ./packages/foo/

RUN yarn install --production --frozen-lockfile
COPY --from=builder /app/dist/apis ./apis/
COPY --from=builder /app/dist/packages/ ./packages/

RUN apk add --no-cache tini
ENTRYPOINT ["tini", "--", "node"]

EXPOSE 45670
USER nobody

WORKDIR /app/apis
CMD ["core"]
