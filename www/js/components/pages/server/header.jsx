/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var React = require('react');
var BackboneMixin = require('../../_backbone-mixin');

var ServerPageHeader = React.createClass({
    mixins: [BackboneMixin],
    getBackboneModels: function() {
        return [this.props.server];
    },
    render: function() {
        var server = this.props.server;
        return <div className="page-header">
            <div className="resource-status">
                {
                    server.get('status') === 'setting_up' ?
                    <span className="server-setting-up">Setting Up</span>
                    :
                    <span className={'server-state ' + server.get('status') }>{server.get('status')}</span>
                }
            </div>
            <h1> { server.get('hostname') } <small className="uuid selectable">{server.get('uuid')}</small> </h1>
        </div>;
    }
});

module.exports = ServerPageHeader;
