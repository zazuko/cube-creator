#!/usr/bin/env bash

curl -fsSL -o /tmp/lando-latest.deb https://github.com/lando/lando/releases/download/v3.6.2/lando-x64-v3.6.2.deb
sudo dpkg -i /tmp/lando-latest.deb
lando version
