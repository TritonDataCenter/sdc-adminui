<!--
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at http://mozilla.org/MPL/2.0/.
-->

<!--
    Copyright (c) 2016, Joyent, Inc.
-->

# sdc-adminui

This repository is part of the Joyent Triton project. See the [contribution
guidelines](https://github.com/joyent/triton/blob/master/CONTRIBUTING.md) --
*Triton does not use GitHub PRs* -- and general documentation at the main
[Triton project](https://github.com/joyent/triton) page.

AdminUI is the Operations Portal for Triton -- the web frontend that provides an
interface to the internal APIs. There is some functionality of Triton that is
not available in AdminUI and has to be executed through the appropriate API.


# Development

You can build sdc-adminui locally on a Mac (or SmartOS) and run it against
services running in
[CoaL](https://github.com/joyent/triton/blob/master/docs/glossary.md#coal):

- first-time setup:
    ```
    git clone git@github.com:joyent/sdc-adminui.git
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
    # devrun automatically restarts node process and incrementally re-builds assets
    ```

- testing:

    Open https://localhost:4443 on the browser to access your AdminUI.


# License

MPL v. 2. See [LICENSE](./LICENSE).
