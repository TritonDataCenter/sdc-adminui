#!/bin/bash
# -*- mode: shell-script; fill-column: 80; -*-
#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#

#
# Copyright (c) 2017, Joyent, Inc.
#

export PS4='[\D{%FT%TZ}] ${BASH_SOURCE}:${LINENO}: ${FUNCNAME[0]:+${FUNCNAME[0]}(): }'
set -o xtrace

echo "Updating adminui service manifest"
$(/usr/bin/sed -i"" \
  -e "s/@@PREFIX@@/\/opt\/smartdc\/adminui/g" \
  /opt/smartdc/adminui/smf/manifests/adminui.xml)

echo "Importing adminui service manifest"
svccfg import /opt/smartdc/adminui/smf/manifests/adminui.xml

exit 0
