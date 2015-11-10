/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var React = require('react');
var BB = require('../../bb');

var adminui = require('../../../adminui');

var NetworksList = require('../networking/networks-list');
var NetworkPoolsList = require('../networking/network-pool-list');

var UserNetworksList = React.createClass({
    render: function() {
        var user = this.props.user;
        return <div className="user-networks">
            <h3>Networks</h3>
            <NetworksList
                params={{provisionable_by: user}}
                showActions={false} 
                pagination={true}/>
            <h3>Network Pools</h3>
            <div className="network-pools-list"><NetworkPoolsList params={{provisionable_by: user}} /></div>
        </div>;
    }
});


module.exports = UserNetworksList;
