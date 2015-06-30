/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

/** @jsx React.DOM */

var React = require('react');
var BB = require('../../bb.jsx');

var Vms = require('../../../models/vms');

var VmsList = require('../../../components/vms-list');
var VmsFilter = require('../../../views/user-vms-filter');

var UserVmsComponent = React.createClass({
    componentWillMount: function() {
        this.vms = new Vms(null, {
            params: {
                owner_uuid: this.props.uuid,
                state: 'active',
                sort: 'create_timestamp.desc'
            },
            perPage: 20
        });

        this.vmsList = new VmsList({collection: this.vms });
        this.vmsFilter = new VmsFilter();
        this.vmsFilter.on('query', this._onVmsFilter, this);
        this.vms.fetch();
    },
    componentWillUnmount: function() {
        this.vmsFilter.off('query');
    },
    _onVmsFilter: function(params) {
        this.vms.fetch({params: params});
    },
    render: function() {
        var vmsFilter = this.vmsFilter;

        return <div className="row">
            <div className="col-md-12">
                <h3>Containers</h3>
                <div className="vms-filter-region"><BB key="filter" view={vmsFilter} /></div>
                <div className="vms-region"><VmsList collection={this.vms} /></div>
            </div>
        </div>;
    }
});

module.exports = UserVmsComponent;
