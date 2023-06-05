#!/bin/sh
#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#

#
# Copyright (c) 2017, Joyent, Inc.
# Copyright 2023 MNX Cloud, Inc.
#

port=$(cat `pwd`/etc/config.json | json sslport)

echo "***** Bundling client-side assets"
build/node/bin/node tools/bundle.js | ./node_modules/bunyan/bin/bunyan
echo "***** Starting server on port $port"
build/node/bin/node server.js | ./node_modules/.bin/bunyan
