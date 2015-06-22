/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var React = require('react');

var UserGroupsLabels = React.createClass({
    propTypes: {
        user: React.PropTypes.object.isRequired
    },
    getInitialState: function () {
        return {
            groups: this.props.user.groups || []
        };
    },
    render: function () {
        var groups = this.state.groups.map(function (g) {
            return <div key={g} className={'group ' + g}>{g}</div>;
        });
        return <div className="groups">{groups}</div>;
    }
});

module.exports = UserGroupsLabels;
