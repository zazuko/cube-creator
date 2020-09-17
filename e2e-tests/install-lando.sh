#!/usr/bin/env bash

sudo apt-get -y update || true
sudo apt-get -y install cgroup-bin curl
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
curl -fsSL -o /tmp/lando-latest.deb https://github.com/lando/lando/releases/download/v3.0.11/lando-v3.0.11.deb
sudo dpkg -i /tmp/lando-latest.deb
lando version
