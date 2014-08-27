/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var UserLimitsView = require('./views/user-limits');
var _ = require('underscore');

suite('UserLimits', function() {
    setup(function() {
        this.server = sinon.fakeServer.create();
        this.userUuid = '930896af-bf8c-48d4-885c-6573a94b1853';
        this.view = new UserLimitsView({ user: this.userUuid });
        this.view.render();
    });

    test('initialize', function() {
        assert.isObject(this.view, 'view is an object');
        assert.isObject(this.view.collection, 'view has a collection');
        assert.equal(this.view.collection.user, this.userUuid, 'view colleciton user uuid');
        assert.equal(this.view.collection.url(),
            _.str.sprintf('/_/users/%s/limits', this.userUuid), 'correct url');
    });

    test('renders limits on fetch', function() {
        var limits = [{
            'datacenter': 'us-west-1',
            'smartos': 5,
            'nodejs': 2,
            'ubuntu': 0
        },
        {
            'datacenter': 'us-east-1',
            'smartos': 1,
            'nodejs': 0,
            'ubuntu': 1
        }];

        this.server.respondWith('GET', this.view.collection.url(),
            [200, {'Content-Type': 'application/json'},
            JSON.stringify(limits) ]);

        this.view.collection.fetch();
        this.server.respond();

        assert.equal(this.view.$('li').length, 2);
        assert.equal(this.view.$('li .datacenter').html(), limits[0].datacenter);
    });

    teardown(function() {
        this.server.restore();
    });

});
