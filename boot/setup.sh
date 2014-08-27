#!/usr/bin/bash
# -*- mode: shell-script; fill-column: 80; -*-
#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#

#
# Copyright (c) 2014, Joyent, Inc.
#

export PS4='[\D{%FT%TZ}] ${BASH_SOURCE}:${LINENO}: ${FUNCNAME[0]:+${FUNCNAME[0]}(): }'
set -o xtrace

PATH=/opt/local/bin:/opt/local/sbin:/usr/bin:/usr/sbin

role=adminui

# Include common utility functions (then run the boilerplate)
source /opt/smartdc/boot/lib/util.sh
CONFIG_AGENT_LOCAL_MANIFESTS_DIRS=/opt/smartdc/$role
sdc_common_setup

# Identify this as a smartdc zone
mkdir -p /var/smartdc/adminui
mkdir -p /opt/smartdc/adminui

# We need to generate our own self signed certificate for Nginx.
mkdir -p /opt/smartdc/adminui/etc/ssl
echo "Generating SSL Certificate"
/opt/local/bin/openssl req -x509 -nodes -subj '/CN=*' \
    -newkey rsa:4096 -days 365 \
    -keyout /opt/smartdc/adminui/etc/ssl/default.pem \
    -out /opt/smartdc/adminui/etc/ssl/default.pem

# Extend the PATH for convenience.
echo -e "\nexport PATH=\$PATH:/opt/smartdc/adminui/node_modules/.bin:/opt/smartdc/adminui/build/node/bin" >> /root/.bashrc

# Log rotation.
sdc_log_rotation_add amon-agent /var/svc/log/*amon-agent*.log 1g
sdc_log_rotation_add config-agent /var/svc/log/*config-agent*.log 1g
sdc_log_rotation_add registrar /var/svc/log/*registrar*.log 1g
sdc_log_rotation_add $role /var/svc/log/*$role*.log 1g
sdc_log_rotation_setup_end

# All done, run boilerplate end-of-setup
sdc_setup_complete

exit 0
