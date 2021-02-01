
# Cube Creator

Cube Creator is a tool to create RDF data Cubes (based on
[rdf-cube-schema](https://github.com/zazuko/rdf-cube-schema)) out of CSV files.

## Technologies

The tool is built with [Typescript](https://www.typescriptlang.org/) and is
currently composed of two main parts: a Hydra API (built with
[hydra-box](https://github.com/zazuko/hydra-box)) and a [Vue.js](https://vuejs.org/)
user interface.

## Running locally

The easiest way it to start a local dockerized environment which will run the database, API and UI, and provide set up local HTTPS endpoints for them.

1. Download and install [lando](https://github.com/lando/lando/releases)
   * it will install docker desktop if necessary
2. Run `yarn` to install packages
3. Run `lando start` inside the repo
   * Docker daemon is also started automatically

Docker containers will start and the services will be available under the these URLs:

| Service | URL                                   |
| ------- | ------------------------------------- |
| API     | <https://cube-creator.lndo.site/>     |
| UI      | <https://app.cube-creator.lndo.site/> |
| Fuseki  | <https://db.cube-creator.lndo.site/>  |
| Minio   | <https://s3.cube-creator.lndo.site/>  |

Lando uses its own Certificate Authority and it won't be trusted by your system.
To trust the CA, follow the steps on <https://docs.lando.dev/config/security.html#trusting-the-ca>

## Workflow

This repository is using the [GitHub-Flow](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/github-flow). Hence all changes should be integrated using pull requests.

Commit messages usually follow the guidelines from [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#summary) with the types in lower case.

To submit a bug or a feature request please create an issue in this repository.

## E2E tests

There are two types of e2e tests:
- API (Hydra): e2e tests that take the API as entrypoint
- UI (Cypress): browser-based e2e tests

### API e2e tests

Running the E2E tests can be done using: `docker-compose run --rm e2e-tests`, and `docker-compose run --rm e2e-tests -- --grep pattern` lets you select which tests to run.

For brevity, use npm script `npm run test:e2e --grep pattern`

### UI e2e tests

We use Cypress to run UI e2e tests.

To simplify the tests, we circumvent authentication in the app. For that, the following variables need to be set in `.local.env` before running the UI:
```
VUE_APP_E2E=true
VUE_APP_X_USER=john-doe
VUE_APP_X_PERMISSION=pipelines:read,pipelines:write
```

We need a running instance of the app to test. The easiest way is to start lando: `lando start`

Then the following command can be used to run the tests interactively:

`yarn --cwd ui test:e2e --url https://app.cube-creator.lndo.site`

The `--headless` option allows running the tests without seeing the browser.
