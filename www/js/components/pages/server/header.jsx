/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var React = require('react');
var BackboneMixin = require('../../_backbone-mixin');

var ServerPageHeader = React.createClass({
    mixins: [BackboneMixin],
    getBackboneModels: function () {
        return [this.props.server];
    },
    render: function () {
        var server = this.props.server;
        return <div className="page-header">
            <div className="resource-status">
                {
                    server.get('setting_up') ?
                        server.get('setup_state') === 'running' ?
                            <span className="server-setting-up">Setting Up</span>
                            :
                            <span className="unknown">Setup Failed</span>
                    :
                    <span className={'server-state ' + server.get('status') }>{server.get('status')}</span>
                }
            </div>
            <h1>{server.get('hostname')}<small className="uuid selectable">{server.get('uuid')}</small></h1>
            {server.get('headnode') ? <span className="headnode">HEADNODE</span> : ''}
        </div>;
    }
});

module.exports = ServerPageHeader;
