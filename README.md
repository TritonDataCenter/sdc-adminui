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


# License

MPL v. 2. See [LICENSE](./LICENSE).
