FROM otel/opentelemetry-collector:0.71.0 as otel
FROM alpine:3.13

COPY --from=otel / /otel

ENTRYPOINT /otel/otelcol
CMD []
