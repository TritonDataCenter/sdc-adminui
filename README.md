<!--
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at http://mozilla.org/MPL/2.0/.
-->

<!--
    Copyright 2019 Joyent, Inc.
    Copyright 2024 MNX Cloud, Inc.
-->

# sdc-adminui

This repository is part of the Triton Data Center project. See the [contribution
guidelines](https://github.com/TritonDataCenter/triton/blob/master/CONTRIBUTING.md)
and general documentation at the main
[Triton project](https://github.com/TritonDataCenter/triton) page.

AdminUI is the Operations Portal for Triton -- the web frontend that provides an
interface to the internal APIs. There is some functionality of Triton that is
not available in AdminUI and has to be executed through the appropriate API.


# Development

You can build sdc-adminui locally on a Mac (or SmartOS) and run it against
services running in
[CoaL](https://github.com/TritonDataCenter/triton/blob/master/docs/glossary.md#coal):

- first-time setup:
    ```
    git clone git@github.com:TritonDataCenter/sdc-adminui.git
    cd sdc-adminui

    make dev

    cp etc/config.json.in etc/config.json
    # Modify etc/config.json if you don't use the default coal answers file

    # Generate key file
    openssl req -x509 -nodes -subj '/CN=*' -newkey rsa:4096 -sha256 -days 365 \
      -keyout etc/ssl/default.pem -out etc/ssl/default.pem
    ```

- building:
    ```
    make check

    make devrun
    # devrun rebuilds client-side assets and runs server
    ```

- testing:

    Open https://localhost:4443 on the browser to access your AdminUI.

# development zone in CoaL w/ sdc-admin:master

1) ssh to head node
```bash
ssh root@10.88.88.200
```

2) get headnode uuid:
```bash
$ sysinfo | json UUID
564db874-1cca-8c84-7bfd-2602014520f9
```

3) get adminui service uuid:
```bash
$ sapiadm showapp sdc | grep adminui
adminui    be5e7c5d-0906-4cf5-9e87-f8ec2f85d919  2
```

4) update adminui service, add parameter server_uuid (where new instance will be provisioned):
```bash
sapiadm update be5e7c5d-0906-4cf5-9e87-f8ec2f85d919 params.server_uuid=564db874-1cca-8c84-7bfd-2602014520f9
```

5) provision adminui through sapi service:
```bash
$ sapiadm provision be5e7c5d-0906-4cf5-9e87-f8ec2f85d919
Provisioned instance 17950378-09d2-475d-9f21-67df4761a36a successfully
```

6) add external nic to instance:
```bash
/usbkey/scripts/add_external_nic.sh 17950378-09d2-475d-9f21-67df4761a36a
```

5) zlogin to the instance and check networks:
```bash
$ zlogin 17950378-09d2-475d-9f21-67df4761a36a
```

6) update adminui source:
```bash
cd /opt/smartdc/adminui/
rm -rf www/ less/ lib/
curl -ksS https://codeload.github.com/joyent/sdc-adminui/tar.gz/master | tar --strip-components=1 -xzvf -
```

7) optionally update etc/config.js if needed and / or create new keys with:
```bash
$ /opt/local/bin/openssl req -x509 -nodes -subj '/CN=*' \
    -newkey rsa:4096 -sha256 -days 365 \
    -keyout /opt/smartdc/adminui/etc/ssl/default.pem \
    -out /opt/smartdc/adminui/etc/ssl/default.pem
```

8) build and then leave the zone
```bash
build/node/bin/node tools/build-js
```

new adminui available on https://<IP ADDRESS>
where <IP ADDRESS> is net0 or net1 inet address:
```bash
$ ifconfig -a
lo0: flags=2001000849<UP,LOOPBACK,RUNNING,MULTICAST,IPv4,VIRTUAL> mtu 8232 index 1
        inet 127.0.0.1 netmask ff000000
net0: flags=40001000843<UP,BROADCAST,RUNNING,MULTICAST,IPv4,L3PROTECT> mtu 1500 index 3
        inet 10.99.99.56 netmask ffffff00 broadcast 10.99.99.255
        ether 90:b8:d0:71:dc:70
net1: flags=40001000843<UP,BROADCAST,RUNNING,MULTICAST,IPv4,L3PROTECT> mtu 1500 index 2
        inet 10.88.88.14 netmask ffffff00 broadcast 10.88.88.255
        ether 90:b8:d0:b0:c3:f8
```

# License

MPL v. 2. See [LICENSE](./LICENSE).
