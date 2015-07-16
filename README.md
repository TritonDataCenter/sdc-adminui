<!--
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at http://mozilla.org/MPL/2.0/.
-->

<!--
    Copyright (c) 2014, Joyent, Inc.
-->

# sdc-adminui

This repository is part of the Joyent SmartDataCenter project (SDC).  For
contribution guidelines, issues, and general documentation, visit the main
[SDC](http://github.com/joyent/sdc) project page.

Adminui is a the SDC Operations Portal -- web frontend to SDC for managing many
aspects of an SDC installation.

Most recent docs: <https://docs.joyent.com/sdc7/operations-portal-walkthrough>
(Note that screenshots can get out of date.)


# Development

You can build adminui locally on a Mac (or SmartOS) and run it against
SDC services running in
[CoaL](https://github.com/joyent/sdc/blob/master/docs/glossary.md#coal):

    git clone git@github.com:joyent/sdc-adminui.git
    cd adminui

    make dev

    cp etc/config.json.in etc/config.json
    # Modify etc/config.json if you don't use the default coal answers file

    # run adminui with, devrun automatically restarts node process and
    # incrementally re-builds assets
    make devrun

    open https://localhost:4443

# development zone in CoaL w/ sdc-admin:master

1) ssh to head node
```bash
$ ssh root@10.88.88.200
```

2) create adminui_payload.json

```json
{
  "brand": "joyent-minimal",
  "owner_uuid": "930896af-bf8c-48d4-885c-6573a94b1853",
  "zfs_storage_pool_name": "zones",
  "archive_on_delete": true,
  "package_name": "sdc_2048",
  "image_uuid": "bed8190a-1b07-11e5-af52-ef1156e1b040",
  "maintain_resolvers": true,
  "networks": [
    "admin",
    "external"
  ],
  "tags": {
    "smartdc_role": "adminui",
    "smartdc_type": "core"
  },
  "cpu_shares": 2048,
  "cpu_cap": 400,
  "zfs_io_priority": 20,
  "max_lwps": 1000,
  "max_physical_memory": 2048,
  "max_locked_memory": 2048,
  "max_swap": 4096,
  "quota": "25",
  "package_version": "1.0.0",
  "billing_id": "8d205d81-3672-4297-b80f-7822eb6c998b",
  "customer_metadata": {
    "sapi-url": "http://10.99.99.32",
    "user-script": "#!/usr/bin/bash\n#\n# This Source Code Form is subject to the terms of the Mozilla Public\n# License, v. 2.0. If a copy of the MPL was not distributed with this\n# file, You can obtain one at http://mozilla.org/MPL/2.0/.\n#\n\n#\n# Copyright (c) 2014, Joyent, Inc.\n#\n\nexport PS4='[\\D{%FT%TZ}] ${BASH_SOURCE}:${LINENO}: ${FUNCNAME[0]:+${FUNCNAME[0]}(): }'\n\nset -o xtrace\nset -o errexit\nset -o pipefail\n\n#\n# The presence of the /var/svc/.ran-user-script file indicates that the\n# instance has already been setup (i.e. the instance has booted previously).\n#\n# Upon first boot, run the setup.sh script if present. On all boots including\n# the first one, run the configure.sh script if present.\n#\n\nSENTINEL=/var/svc/.ran-user-script\n\nDIR=/opt/smartdc/boot\n\nif [[ ! -e ${SENTINEL} ]]; then\n    if [[ -f ${DIR}/setup.sh ]]; then\n        ${DIR}/setup.sh 2>&1 | tee /var/svc/setup.log\n    fi\n\n    touch ${SENTINEL}\nfi\n\nif [[ ! -f ${DIR}/configure.sh ]]; then\n    echo \"Missing ${DIR}/configure.sh cannot configure.\"\n    exit 1\nfi\n\nexec ${DIR}/configure.sh\n",
    "assets-ip": "10.99.99.8"
  },
  "alias": "adminui-test",
  "nics": [
    {
      "ip": "10.99.99.41",
      "netmask": "255.255.255.0",
      "nic_tag": "admin",
      "vlan_id": 0,
      "interface": "net0",
      "primary": false
    },
    {
      "ip": "10.88.88.6",
      "netmask": "255.255.255.0",
      "nic_tag": "external",
      "vlan_id": 0,
      "interface": "net1",
      "gateway": "10.88.88.2",
      "primary": true
    }
  ],
  "resolvers": [
    "10.99.99.11",
    "8.8.8.8",
    "8.8.4.4"
  ]
}
```

where server_uuid:
```bash
$ sdc-server list | grep headnode
headnode             564de7fb-e36c-ad57-ab5c-f52f7037e8ce     7.0     true   running     4095  10.99.99.7
```

and image_uuid:
```bash
$ sdc-imgapi /images?name=adminui | json -H -ga uuid
36786922-1b96-11e5-9af2-43e75d0a43d0
```

and networks:
```bash
$ sdc-network list

NAME         UUID                                  VLAN           SUBNET          GATEWAY
admin        0dd6df88-a325-44dd-8bec-95d34c5c377f     0    10.99.99.0/24                -
external     77605452-fa18-4379-b454-45fe79520f60     0    10.88.88.0/24       10.88.88.2
```

and ip for nic with nic_tag "admin":
```bash
sdc-napi /networks/`sdc-napi /networks?name=admin | json -Ha uuid`/ips | json  -Hac 'this.free && !this.reserved' ip | head -n 1)
10.99.99.41

and ip for nic with nic_tag "external":
```bash
sdc-napi /networks/`sdc-napi /networks?name=external | json -Ha uuid`/ips | json  -Hac 'this.free && !this.reserved' ip | head -n 1)
10.88.88.6

3) create zone with

```bash
$ vmadm create -f adminui_payload.json
```

4) get adminui UUID and launch service
```bash
$ vmadm list | grep admin
b86cf459-f7d1-4d45-b8a9-6de503ab98f4  OS    2048     running           adminui0
e250ba9a-c718-449d-b69c-e23b48649585  OS    2048     running           adminui-test
```

then create json file adminui-service.json
```json
 {
   "uuid": "e250ba9a-c718-449d-b69c-e23b48649585",
   "service_uuid": "be5e7c5d-0906-4cf5-9e87-f8ec2f85d919",
   "params": {
     "alias": "adminui-test"
   },
   "metadata": {},
   "type": "vm"
 }
```
where service_uuid:
```bash
sdc-sapi /instances/b86cf459-f7d1-4d45-b8a9-6de503ab98f4 | grep service_uuid
```
and then
```bash
$ sdc-sapi /instances -XPOST -d@adminui-service.json
$ vmadm reboot e250ba9a-c718-449d-b69c-e23b48649585


```

5) zlogin to new adminui zone and check services
```bash
$ zlogin e250ba9a-c718-449d-b69c-e23b48649585
$ svcs
```
and check networks
```bash
$ netstat -rn

Routing Table: IPv4
  Destination           Gateway           Flags  Ref     Use     Interface
-------------------- -------------------- ----- ----- ---------- ---------
default              10.88.88.2           UG        2          2 net1
10.88.88.0           10.88.88.6           U         3          0 net1
10.99.99.0           10.99.99.41          U         4        781 net0
127.0.0.1            127.0.0.1            UH        2          0 lo0
```
if "default" doesn't be in table
```bash
$ route add default 10.88.88.2
```

6) download and unpack source
a) Simple variant
```bash
$ cd /opt/smartdc/adminui/
$ curl -ksS https://$(dig +short @8.8.8.8 codeload.github.com)/joyent/sdc-adminui/tar.gz/master -H'Host: codeload.github.com' | tar --strip-components=1 -xzvf -
```

if adminui doesn't start, try
```bash
$ boot/configure.sh
```
and setup keys if it needs
``bash
$ tools/ssl.sh /opt/local/bin/openssl etc/ssl/default.pem
```

If error happens remove service
```bash
$ svcadm disable svc:/smartdc/application/adminui:default
$ svccfg delete -f svc:/smartdc/application/adminui:default
$ rm -rf /opt/smartdc/adminui/
```
and try second variant

b) More complex
```bash
$ curl -ksS https://$(dig +short @8.8.8.8 codeload.github.com)/joyent/sdc-adminui/tar.gz/master -H'Host: codeload.github.com' >> sdc-adminui.tar.gz
$ tar xvfz sdc-adminui.tar.gz
$ cp -r sdc-adminui-master/* /opt/smartdc/adminui/
```
optionally create config
```bash
$ cp /opt/smartdc/adminui/etc/config.json.in /opt/smartdc/adminui/etc/config.json
```
configure and make keys
```bash
$ /opt/smartdc/adminui/boot/configure.sh
$ /opt/smartdc/adminui/tools/ssl.sh /opt/local/bin/openssl /opt/smartdc/adminui/etc/ssl/default.pem
```
and start with
```bash
$ svcadm enable svc:/smartdc/application/adminui:default
```

# License

MPL v. 2. See [LICENSE](./LICENSE).
