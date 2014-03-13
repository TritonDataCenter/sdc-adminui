#!/bin/sh
echo "***** Supervising public/js files for changes"
SKIP_MINIFY=true ./node_modules/.bin/supervisor -w public/js/,tools/build-js -e 'js|jsx|hbs' -n exit tools/build-js &

port=$(cat `pwd`/etc/config.json | json sslport)

echo "***** Starting adminui server on port $port"
./node_modules/.bin/node-dev server.js NODE=$(which node) | ./node_modules/.bin/bunyan
