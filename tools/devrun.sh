#!/bin/sh
echo "***** Supervising public/js files for changes"
supervisor -w public/js/,tools/build-js -e 'js|hbs' -n exit tools/build-js &

port=$(cat `pwd`/etc/config.json | json sslport)
echo "***** Starting adminui server on port $port"
node-dev server.js NODE=$(which node) | bunyan &

while true; do
	: # Do nothing
done
