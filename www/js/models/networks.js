/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var PageableCollection = require('./pageableCollection');
var Collection = require('./collection');
var Network = require('./network');

module.exports = PageableCollection.extend({
    model: Network,
    url: '/api/networks',
    state: {
        pageSize: 10,
        pageSizes: [{size: 10}, {size: 25}, {size: 50}, {size: 100}],
        totalPages: null
    },
    mode: 'client',
    queryParams: {
        currentPage: 'current_page',
        pageSize: 'page_size',
        totalPages: 'total_pages'
    }
});
