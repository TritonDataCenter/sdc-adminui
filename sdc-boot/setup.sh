#!/usr/bin/bash
#
# Copyright (c) 2013 Joyent Inc., All rights reserved.
#

export PS4='[\D{%FT%TZ}] ${BASH_SOURCE}:${LINENO}: ${FUNCNAME[0]:+${FUNCNAME[0]}(): }'
set -o xtrace

PATH=/opt/local/bin:/opt/local/sbin:/usr/bin:/usr/sbin

role=adminui
app_name=$role

CONFIG_AGENT_LOCAL_MANIFESTS_DIRS=/opt/smartdc/$role

# Include common utility functions (then run the boilerplate)
source /opt/smartdc/sdc-boot/lib/util.sh
sdc_common_setup

# Identify this as a smartdc zone
mkdir -p /var/smartdc/adminui
mkdir -p /opt/smartdc/adminui

# Location for ssl cert
mkdir -p /opt/smartdc/adminui/etc/ssl

# We need to generate our own self signed certificate for Nginx:
echo "Generating SSL Certificate"
/opt/local/bin/openssl req -x509 -nodes -subj '/CN=*' \
  -newkey rsa:4096 -days 365 \
    -keyout /opt/smartdc/adminui/etc/ssl/default.pem \
    -out /opt/smartdc/adminui/etc/ssl/default.pem

# Add node_modules/bin to PATH
echo -e "\nexport PATH=\$PATH:/opt/smartdc/adminui/node_modules/.bin:/opt/smartdc/adminui/build/node/bin" >> /root/.bashrc

echo "Adding log rotation"
logadm -w adminui -C 48 -s 100m -p 1h \
    /var/svc/log/smartdc-application-adminui:default.log

# All done, run boilerplate end-of-setup
sdc_setup_complete

exit 0
