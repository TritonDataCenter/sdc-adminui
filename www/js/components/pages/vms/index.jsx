/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

"use strict";

/**
 * ./vms.js
 */


var React = require('react');
var app = require('../../../adminui');

var VmsListComponent = require('../../vms-list');
var utils = require('../../../lib/utils');
var FilterForm = require('./filter-form');

var Vms = require('../../../models/vms');
var REQUEST_TIMEOUT = 120 * 1000;

var VmsPage = React.createClass({
    statics: {
        sidebar: 'vms',
        url: function () {
            var url = 'vms';
            return location.pathname === '/vms' ? (url + location.search || '') : url;
        }
    },
    componentWillMount: function () {
        this.collection = new Vms(null, {perPage: 20});
        this.query(this.props.params);
        app.vent.trigger('settitle', 'vms');
    },
    render: function () {
        return (
            <div className="page" id="page-vms">
                <div className="page-header">
                  <h1>Virtual Machines
                    { app.user.role('operators') ?
                        <div className="actions">
                          <button onClick={this.provision} className="provision-button btn btn-info"><i className="fa fa-plus"></i> Provision Virtual Machine</button>
                        </div> : null
                    }
                  </h1>
                </div>

                <div className="row">
                    <div className="col-md-12">
                        <section className="filter-form">
                            <FilterForm initialParams={this.props.params} handleSearch={this.query} />
                        </section>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-12">
                        <div className="list-region">
                            <VmsListComponent collection={this.collection} />
                        </div>
                    </div>
                </div>
            </div>
        );
    },

    provision: function () {
        app.vent.trigger('showview', 'provision', {});
    },
    query: function (params) {
        this.collection.params = utils.getVmSearchParams(params);
        this.collection.firstPage();
        this.collection.fetch({
            reset: true,
            timeout: REQUEST_TIMEOUT
        });
    },
    onMoreVms: function () {
        this.next();
    },
    next: function () {
        if (this.collection.hasNext()) {
            this.collection.next();
            this.collection.fetch({
                remove: false,
                timeout: REQUEST_TIMEOUT
            });
        }
    }
});


module.exports = VmsPage;
