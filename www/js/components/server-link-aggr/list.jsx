/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var React = require('react');

var LinkAggregationsList =  React.createClass({
    propTypes: {
        linkAggregations: React.PropTypes.array.isRequired,
        nics: React.PropTypes.array,
        onEdit: React.PropTypes.func,
        onDelete: React.PropTypes.func
    },
    render: function () {
        var nics = this.props.nics;
        var nicsMacAddresses = {};
        if (nics && nics.length) {
            nics.forEach(function (nic) {
                nicsMacAddresses[nic.mac] = {
                    nicTag: nic.nic_tag || '',
                    ifname: nic.ifname || ''
                };
            });
        }
        return (<div className="link-aggr-list">
        {
            this.props.linkAggregations.length === 0 ? (
                <div className="empty">There are no Aggregated Links on this node</div>
            )
            : (
                this.props.linkAggregations.map(function (link) {
                    return <div key={link.id} className="link-aggr">
                        <div className="link-aggr-name">{link.name}</div>
                        <div className="link-aggr-interfaces">
                        {
                            link.macs.map(function (mac) {
                                return <div key={mac} className="link-aggr-interface">
                                    <span className="link-aggr-ifname">{nicsMacAddresses[mac].ifname}</span>
                                    <span className="link-aggr-mac">{mac}</span>
                                    <span className="link-aggr-nictag">{nicsMacAddresses[mac].nicTag}</span>
                                </div>;
                            }, this)
                        }
                        </div>
                        <div className="actions pull-right">
                            <button onClick={this.props.onEdit.bind(null, link)} className="btn btn-link btn-edit"><i className="fa fa-pencil"></i> Edit</button>
                            <button onClick={this.props.onDelete.bind(null, link)} className="btn btn-link btn-delete"><i className="fa fa-trash-o"></i> Delete</button>
                        </div>
                    </div>;
                }, this)
            )
        }
        </div>);
    }
});

module.exports = LinkAggregationsList;
