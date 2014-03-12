/** @jsx React.DOM */

var React = require('react');
var Backbone = require('backbone');

var ServerNicsTemplate = require('../tpl/server-nics.hbs');
var ServerNicTemplate = require('../tpl/server-nic.hbs');

var ReactBackboneMixin = require('../components/_backbone-mixin');


var ServerNic = React.createClass({
    render: function() {
        var nic = this.props.nic.toJSON();
        return (
            <li key={nic.mac}>
                <div className={'link-status ' + nic.link_status}></div>
                <div className="name-container">
                <span className="name">{nic.name}</span>
                <span className="mac value">{nic.mac}</span>
                </div>
                <div className="ip-container">
                <span className="lbl">IP</span>
                <span className="ip value">{nic.ip}</span>
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
        )
    }
});

var ServerNicsList = React.createClass({
    mixins: [ReactBackboneMixin],
    getBackboneModels: function() {
        return [this.props.nics]
    },
    render: function() {
        var nodes = this.props.nics.map(function(nic) {
            return <ServerNic key={nic.mac} nic={nic} />;
        });
        return <ul className="unstyled">{nodes}</ul>
    }
});

var ServerNicsView = Backbone.Marionette.ItemView.extend({
    template: ServerNicsTemplate,
    initialize: function(options) {
        this.collection = options.nics;
    },
    onRender: function() {
        React.renderComponent(<ServerNicsList nics={this.collection} />, this.$('.server-nics').get(0));
    }
});

module.exports = ServerNicsView;
