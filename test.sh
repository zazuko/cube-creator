#!/bin/bash

OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://otel.cube-creator.lndo.site/v1/traces
OTEL_EXPORTER_OTLP_METRICS_ENDPOINT=http://otel.cube-creator.lndo.site/v1/metrics

npx barnard59 run -vv \
  --pipeline urn:pipeline:cube-creator#Main \
  --variable="GRAPH_QUERY_ENDPOINT=https://stardog-test.cluster.ldbar.ch/cube-creator/query" \
  --variable GRAPH_STORE_PASSWORD \
  --variable="GRAPH_STORE_USER=cube-creator" \
  --variable="PUBLISH_GRAPH_STORE_ENDPOINT=http://localhost:3030/test/data" \
  --variable="PUBLISH_GRAPH_STORE_USER=admin" \
  --variable="PUBLISH_GRAPH_STORE_PASSWORD=password" \
  --otel-traces-exporter otlp \
  --otel-metrics-exporter otlp \
  "$@"
