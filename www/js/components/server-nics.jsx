/** @jsx React.DOM */

"use strict";

var React = require('react');
var _ = require('underscore');

var ReactBackboneMixin = require('../components/_backbone-mixin');


var ServerNic = React.createClass({
    render: function() {
        var nic = this.props.nic;
        return (
            <li key={nic.mac}>
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
            {
                nic.nic_tags_provided ?
                <div className="nic-tags-provided-container">
                    <span className="lbl">NICTAGS-PROV</span>
                    <span className="nic-tags-provided value">{ nic.nic_tags_provided.join(' ') }</span>
                </div> : '' }
            </li>
        );
    }
});


function mergeSysinfo(sysinfo, napinics) {
    var nics = [];
    _.each(sysinfo['Network Interfaces'], function(el, i) {
        el.kind = "nic";
        var n = _.findWhere(napinics, {mac: el['MAC Address']});
        var nic = _.extend(el, n);
        nic.ifname = i;
        nics.push(nic);
    });
    _.each(sysinfo['Virtual Network Interfaces'], function(el, i) {
        el.kind = "vnic";
        var n = _.findWhere(napinics, {mac: el['MAC Address']});
        var nic = _.extend(el, n);
        nic.ifname = i;
        nics.push(nic);
    });
    _.each(sysinfo['Link Aggregations'], function(el, i) {
        el.kind = "aggr";
        var n = _.findWhere(napinics, {mac: el['MAC Address']});
        var nic = _.extend(el, n);
        nic.ifname = i;
        nics.push(nic);
    });

    return nics;
}

var ServerNicsList = React.createClass({
    mixins: [ReactBackboneMixin],

    getBackboneModels: function() {
        return [this.props.nics];
    },

    render: function() {
        var allnics = this.props.nics.toJSON();
        var sysinfo = this.props.sysinfo;

        var res = mergeSysinfo(sysinfo, allnics);

        var nics = res.filter(function(n) {
            return n.kind === 'nic';
        });
        var nicsNodes = nics.length ? nics.map(function(nic, ifname) {
            return <ServerNic key={nic.mac} nic={nic} />;
        }) : <li className="empty">No Network Interfaces Found</li>;

        var vnics = res.filter(function(n) {
            return n.kind === 'vnic';
        });
        var vnicsNodes = vnics.length ? vnics.map(function(nic, ifname) {
            return <ServerNic key={nic.mac} nic={nic} />;
        }) : <li className="empty">No Virtual Nics Found</li>;

        var aggrs = res.filter(function(n) {
            return n.kind === 'aggr';
        });

        var aggrsNodes = aggrs.length ? aggrs.map(function(nic) {
            return <ServerNic key={nic.mac} nic={nic} />;
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
