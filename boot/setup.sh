#!/usr/bin/bash
#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#

#
# Copyright (c) 2018, Joyent, Inc.
#

PS4='[\D{%FT%TZ}] ${BASH_SOURCE}:${LINENO}: ${FUNCNAME[0]:+${FUNCNAME[0]}(): }'
export PS4
set -o xtrace

PATH='/opt/local/bin:/opt/local/sbin:/usr/bin:/usr/sbin'

role='adminui'
prefix="/opt/smartdc/$role"

#
# Include common utility functions, then run the boilerplate.
#
source /opt/smartdc/boot/lib/util.sh
CONFIG_AGENT_LOCAL_MANIFESTS_DIRS="$prefix"
sdc_common_setup

#
# Identify this as a smartdc zone:
#
mkdir -p "/var/smartdc/$role"
mkdir -p "$prefix"

#
# We need to generate our own self signed certificate for nginx.
#
mkdir -p "$prefix/etc/ssl"
echo "Generating SSL Certificate"
/opt/local/bin/openssl req -x509 -nodes -subj '/CN=*' \
    -newkey rsa:4096 -sha256 -days 365 \
    -keyout "$prefix/etc/ssl/default.pem" \
    -out "$prefix/etc/ssl/default.pem"

#
# Amend the PATH in the stock root user profile with the location of tools for
# this zone.
#
extra_path=(
    '$PATH'
    "$prefix/node_modules/.bin"
    "$prefix/build/node/bin"
)
printf '\nexport PATH="%s"\n' "$(IFS=':'; printf '%s' "${extra_path[*]}")" \
  >> /root/.bashrc

#
# Log rotation.
#
sdc_log_rotation_add amon-agent /var/svc/log/*amon-agent*.log 1g
sdc_log_rotation_add config-agent /var/svc/log/*config-agent*.log 1g
sdc_log_rotation_add registrar /var/svc/log/*registrar*.log 1g
sdc_log_rotation_add "$role" /var/svc/log/*$role*.log 1g
sdc_log_rotation_setup_end

#
# All done, run boilerplate end-of-setup:
#
sdc_setup_complete

#
# Process and import the SMF manifest:
#
manifest="$prefix/smf/manifests/$role.xml"

echo "Updating AdminUI service manifest"
/usr/bin/sed -i '' -e "s/@@PREFIX@@/${prefix//\//\\\/}/g" "$manifest"

echo "Importing AdminUI service manifest"
/usr/sbin/svccfg import "$manifest"

exit 0
