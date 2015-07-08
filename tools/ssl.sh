#!/bin/sh
echo "Generating SSL Certificate"
$1 req -x509 -nodes -subj '/CN=*' \
    -newkey rsa:4096 -sha256 -days 365 \
    -keyout $2 \
    -out $2