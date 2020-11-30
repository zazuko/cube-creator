> # Cube Creator CLI

Dockerized runner of Cube Creator projects

## Running

The general syntax of the runner to transform:

```
Usage: docker run --rm zazuko/cube-creator-cli transform [options]

Transforms source files to RDF

Options:
  --to <targetName>            Target to write triples (built-in: 'stdout', 'filesystem', 'graph-store')
  --job <job>                  URL of a Data Cube Curation project job
  --debug                      Print diagnostic information to standard output
  -h, --help                   output usage information
```

The possible options and their arguments are described below. Each argument is
provided by the `-v, --variable` option. For example

```
docker run --rm zazuko/cube-creator-cli transform --job URI -v targetFile=./converted.nt
```

### `--to stdout`

Streams transformed triples to standard output

### `--to filesystem`

Streams transformed triples as n-triples to a single file

#### Arguments

* `targetFile`
  * default: `/output/transformed.nt`

### `--to graph-store`

Streams transformed triples to a store using the graph protocol.

Does not require additional configuration, in which case will save to a graph provided by the Cube Project resource.

#### Arguments

* `graph-store-endpoint`
* `graph-store-user`
* `graph-store-password`

Can also be configured with env variables. Check `.test.env` for example.

## Running locally

To run an OIDC secret must be added to `.env` as

```
AUTH_CLIENT_SECRET=foo-bar
```

It is obtained from [keycloak](https://keycloak.zazukoians.org/admin/master/console/#/realms/zazuko-dev/clients/64f92868-71e3-48e1-9d8b-7bfaf5fac2bd/credentials)


### from locally-built image

Here's an example of converting local files using a locally-built image:

1. Place source csv files in directory `~/packages/cli/input`
1. (optionally) Ensure a fresh container is built

    ```
    docker-composer build cli
    ```
1. Run with docker-compose

    ```
    docker-compose run --rm cli transform \ 
        --to filesystem \
        --job <URI>
        --debug
    ```

### from sources

If it is necessary to debug, the CLI can be started directly from sources. The `package.json` has a `transform` script which loads environment variables from a [`.env`](https://npm.im/dotenv) file (you have to create it locally as it is not committed).

The script is missing the output parameter so that it can be provided from the command line. For example to print the result to the standard output run

```
yarn transform --to stdout 
```

or

```
npm run transform -- --to stdout
```

Note the additional double dash which `npm` needs.
Also note that `yarn` has to be installed on the system in both cases.
