#!/usr/bin/env bash

lando start
npx wait-on --timeout 30000 http://cube-creator.lndo.site
