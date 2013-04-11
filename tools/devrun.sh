#!/bin/sh
echo "***** Supervising public/js files for changes"
supervisor -q -w public/js/ -n exit tools/build-js &

port=$(cat `pwd`/etc/config.json | json sslport)
echo "***** Starting adminui server on port $port"
node-dev server.js | bunyan &

while true; do
	: # Do nothing
done