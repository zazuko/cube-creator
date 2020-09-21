#!/usr/bin/env bash

lando start
npx wait-on --timeout 30000 https://cube-creator.lndo.site/ping
