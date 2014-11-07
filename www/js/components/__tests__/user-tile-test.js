/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

/** @jsx: React.DOM */

jest.dontMock('../user-tile.jsx');

describe('UserTile', function() {

    it('renders user-tile', function() {
        var React = require('react/addons');
        var TestUtils = React.addons.TestUtils;
        var UserTile = require('../user-tile.jsx');

        var userTile = new Usertile({uuid: '12b2e590-e0ea-11e3-8b68-0800200c9a66'});
        TestUtils.renderIntoDocument(userTile);
        var tile = TestUtils.findRenderedDOMComponentWithTag(userTile, 'div');
        expect(tile.getDOMNode().class).toEqual('user-tile');
    });
});
