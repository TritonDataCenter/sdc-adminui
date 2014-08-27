/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

module('views/monitoring/config-log-scan');

var ConfigLogscanView = require('views/monitoring/config-log-scan');

var dom = $('<div/>');

var view = new ConfigLogscanView({el: dom});