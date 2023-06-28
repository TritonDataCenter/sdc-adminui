/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 * Copyright 2023 MNX Cloud, Inc.
 */

var Backbone = require('backbone');

// Sort by os, then platform image version
function sortPlatforms (a, b) {
    if (a.os === b.os) {
        return a.version > b.version ? -1 : 1;
    }
    return a.os > b.os ? -1 : 1;
}

var Platforms = Backbone.Collection.extend({
    url: '/api/platforms',
    parse: function (platforms) {
        var results = [];

        // `true` if this collection is intended to be shown for a server
        var server = this.params && this.params.for_server &&
            this.params.server && this.params.server.attributes;

        Object.keys(platforms).forEach(function(version) {
            var platform = platforms[version];

            // If server is already setup, skip platforms intended for other
            // operating systems
            if (server && server.setup &&
                server.current_platform_os.toLowerCase() !== platform.os) {
                return;
            }

            results.push({
                version: version,
                latest: platform.latest,
                label: platform.latest ?
                    'latest (' + version + ')' : version,
                os: platform.os
            });

        });

        return results.sort(sortPlatforms);
    }
});

module.exports = Platforms;
