
# High-level system architecture

The following diagram shows the main components of the application. Black arrows
show communication between components and blue dotted arrows show the flow of
the data from CSV to publication.

![High-level system architecture](high-level-architecture.svg)

## 1. User Interface

SPA (Single Page Application) built with [vue.js](https://vuejs.org)

Code: [ui](../ui)

## 2. API

[Hydra](https://www.hydra-cg.com/) HTTP API

Code: [apis](../apis)

All communication between the User Interface and the stores and the Job Runner
and the stores go through the API.

### 2.1 Core API

Main entrypoint of the HTTP API.

Code: [apis/core](../apis/core)

### 2.2 Shared Dimensions API

Sub-API that handles everything related to Shared Dimensions. The entrypoint
of this API is provided through the Core API.

Code: [apis/shared-dimensions](../apis/shared-dimensions)

## 3. Job Runner

Runs data processing pipelines built with [barnard59](https://github.com/zazuko/barnard59)

Code: [cli](../cli)

## 4. Stores

Cube Creator reads/writes from/to multiple RDF triplestores.

### 4.1 Cube Creator Store

Contains data that is specific to Cube Creator. Requires the ability to create/delete named graphs.

### 4.2 Publication Store

Published Cubes are sent to the Publication Store, in a specified named graph.

### 4.3 Shared Dimensions Store

Contains data about Shared Dimensions.

### 4.4 CSV files storage

CSV files are stored in an S3-compatible storage.

## 5. Authentication Service

The User Interface, the API and the Job Runner authenticate user requests
through an external Authentication Service using the
[OIDC (OpenID Connect)](https://openid.net/connect/) protocol.
