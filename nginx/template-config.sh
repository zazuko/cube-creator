#!/bin/sh

set -eu

OUTPUT="$WEB_ROOT/config.js"
TEMPLATE="$WEB_ROOT/config.js.template"

: "$AUTH_ISSUER"
: "$AUTH_CLIENT_ID"
: "$API_CORE_BASE"
: "$SENTRY_DSN"
: "$SENTRY_ENVIRONMENT"

envsubst < $TEMPLATE > $OUTPUT
