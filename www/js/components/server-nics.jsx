/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2016, Joyent, Inc.
 */

/** @jsx React.DOM */

"use strict";

var React = require('react');
var _ = require('underscore');

var ReactBackboneMixin = require('../components/_backbone-mixin');


var ServerNicAggr = React.createClass({
    render: function () {
        var aggr = this.props.aggr;
        var linkStatusClass = ('aggr-link-status link-status ' + aggr['Link Status']);
        return (<li key={aggr.ifname}>
            <div className={linkStatusClass}></div>
            <div className="aggr-name-container">
                {aggr.ifname}
            </div>
            <div className="aggr-ips-container">
                IP
                <div className="ip">
                    {aggr['ip4addr']}
                </div>
            </div>
            <div className="aggr-nictags-container">
                NICTAGS
                <div className="nictags">
                {aggr['NIC Names'] ? aggr['NIC Names'].map(function (nicTag) {
                    return <span key={nicTag} className="nictag">{nicTag}</span>;
                }) : ''}
                </div>
            </div>
            <div className="lacp-container">
                LACP Mode
                <div className="lacp">
                    <span className={aggr["LACP mode"]}> {aggr['LACP mode']} </span>
                </div>
            </div>
            <div className="interfaces-container">
                Interfaces
                <div className="interfaces">
                {
                    aggr['Interfaces'].map(function (i) {
                        return <span key={i} className="interface">{i}</span>;
                    })
                }
                </div>
            </div>
        </li>);
    }
});

var ServerNic = React.createClass({
    render: function () {
        var nic = this.props.nic;
        return (<li key={nic.mac}>
            <div className={'link-status ' + nic['Link Status']}></div>
                <div className="name-container">
                <span className="name">{nic.ifname}</span>
                <span className="mac value">{nic['MAC Address']}</span>
            </div>
            <div className="ip-container">
                <span className="lbl">IP</span>
                <span className="ip value">{nic.ip4addr}</span>
            </div>
            <div className="netmask-container">
            <span className="lbl">NETMASK</span>
            <span className="netmask value">{nic.netmask}</span>
            </div>
            <div className="vlan-id-container">
            <span className="lbl">VLAN</span>
            <span className="vlan-id value">{nic.vlan_id}</span>
            </div>
            <div className="nic-tag-container">
            <span className="lbl">NICTAG</span>
            <span className="nic-tag value">{nic.nic_tag}</span>
            </div>
            {nic.nic_tags_provided ?
                <div className="nic-tags-provided-container">
                    <span className="lbl">NICTAGS PROVIDED</span>
                    <span className="nic-tags-provided value">{nic.nic_tags_provided.join(' ')}</span>
                </div> : ''}
        </li>);
    }
});

var ServerNicsList = React.createClass({
    render: function () {
        var interfaces = this.props.interfaces;
        var nics = this.props.nics;
        var pnics = interfaces.nic;
        var vnics = interfaces.vnic;
        var aggrs = interfaces.aggr;

        var nicsNodes = pnics.length ? pnics.map(function (pnic) {
            var extendNic = _.findWhere(nics, {'ifname': pnic.ifname}) || {};
            pnic = _.extend(pnic, extendNic);
            return <ServerNic key={'nic-' + pnic.ifname} nic={pnic} />;
        }) : <li className="empty">No Network Interfaces Found</li>;

        var vnicsNodes = vnics.length ? vnics.map(function (nic) {
            return <ServerNic key={'vnic-' + nic.ifname} nic={nic} />;
        }) : <li className="empty">No Virtual Nics Found</li>;

        var aggrsNodes = aggrs.length ? aggrs.map(function (aggr, ifname) {
            return <ServerNicAggr key={'aggr-' + ifname} aggr={aggr} />;
        }) : <li className="empty">No Link Aggregations Found</li>;

        return <div className="server-nics-list">
            <div className="title">Physical</div>
            <ul className="list-unstyled">{nicsNodes}</ul>

            <div className="title">Virtual</div>
            <ul className="list-unstyled">{vnicsNodes}</ul>

            <div className="title">Aggregates</div>
            <ul className="list-unstyled">{aggrsNodes}</ul>
        </div>;
    }
});

module.exports = ServerNicsList;
