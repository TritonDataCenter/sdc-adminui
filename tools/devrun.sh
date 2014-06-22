#!/bin/sh
port=$(cat `pwd`/etc/config.json | json sslport)

echo "Will rebundle when needed";
WATCH=true tools/build-js | ./node_modules/bunyan/bin/bunyan &
echo "***** Starting adminui server on port $port"
./node_modules/.bin/node-dev server.js NODE=$(which node) | ./node_modules/.bin/bunyan
