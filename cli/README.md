> # Cube Creator CLI

Dockerized runner of Cube Creator projects

## Running

```
Usage: docker run --rm zazuko/cube-creator-cli [options] [command]

Options:
  -h, --help           output usage information

Commands:
  transform [options]  Transforms source files to RDF
  publish [options]    publish cube to store
```

### Command `transform`

```
Usage: docker run --rm zazuko/cube-creator-cli transform [options]

Transforms source files to RDF

Options:
  --to <targetName>               (required) Target to write triples (built-in: 'stdout', 'filesystem', 'graph-store')
  --job <job>                     (required) URL of a Cube Creator project job
  --execution-url <executionUrl>  Link to job execution
  -v, --variable <name=value>     Pipeline variables (default: {})
  --debug                         Print diagnostic information to standard output
  --enable-buffer-monitor         enable histogram of buffer usage
  --auth-param <name=value>       Additional variables to pass to the token endpoint (default: {})
  -h, --help                      output usage information
```

### Command `publish`

```
Usage: docker run --rm zazuko/cube-creator-cli publish [options]

Publish cube to store

Options:
  --job <job>                     (required) URL of a Cube Creator project job
  --execution-url <executionUrl>  Link to job execution
  -v, --variable <name=value>     Pipeline variables (default: {})
  --debug                         Print diagnostic information to standard output
  --enable-buffer-monitor         enable histogram of buffer usage
  --auth-param <name=value>       Additional variables to pass to the token endpoint (default: {})
  -h, --help                      output usage information
```

## Parameters

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

### from locally-built image

Here's an example of converting local files using a locally-built image:

1. Place source csv files in directory `~/packages/cli/input`
1. (optionally) Ensure a fresh container is built

    ```
    docker compose build cli
    ```
1. Run with `docker compose`

    ```
    docker compose run --rm cli transform \ 
        --to filesystem \
        --job <URI>
        --debug
    ```

### from sources

If it is necessary to debug, the CLI can be started directly from sources. The `package.json` has a `transform` and `publish` scripts which load environment variables from a [`.env`](https://npm.im/dotenv) file (you have to create it locally as it is not committed).

The `transform` script is missing the output parameter so that it can be provided from the command line. For example to print the result to the standard output run

```
npm run transform -- --to stdout
```

Note the additional double dash which `npm` needs.
