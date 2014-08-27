/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

module.exports = {};
module.exports.OPERATING_SYSTEMS = [
    "any",
    "smartos",
    "linux",
    "windows",
    "bsd",
    "illumos",
    "other",
]

module.exports.DATACENTERS = [
    'eu-ams-1',
    'us-east-1',
    'us-sw-1',
    'us-west-1'
]


module.exports.BY_LABELS = {
    "ram": "MB RAM",
    "quota": "GB DISK",
    "machines": "Machines"
}
