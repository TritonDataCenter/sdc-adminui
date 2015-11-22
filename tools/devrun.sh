#!/bin/sh
#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#

#
# Copyright (c) 2014, Joyent, Inc.
#

port=$(cat `pwd`/etc/config.json | json sslport)
export PATH="$(pwd)/build/node/bin:$PATH"

echo "Will rebundle when needed";
WATCH=true tools/build-js | ./node_modules/bunyan/bin/bunyan &
echo "***** Starting adminui server on port $port"
./node_modules/.bin/node-dev server.js NODE=$(which node) | ./node_modules/.bin/bunyan
