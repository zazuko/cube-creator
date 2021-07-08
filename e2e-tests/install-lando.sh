#!/usr/bin/env bash

curl -fsSL -o /tmp/lando-latest.deb https://github.com/lando/lando/releases/download/v3.1.4/lando-v3.1.4.deb
sudo dpkg -i /tmp/lando-latest.deb
lando version
