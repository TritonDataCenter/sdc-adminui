/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var React = require('react');
var adminui = require('adminui');
var SettingsModel = require('../../models/settings');
var MultipleNicConfigComponent = require('../multi-nic-config');

var SettingsComponent = React.createClass({
    statics: {
        sidebar: 'settings',
        url: function() {
            return 'settings';
        }
    },
    componentDidMount: function() {
        this.fetchSettings();
    },
    fetchSettings: function() {
        var self = this;
        SettingsModel.fetch().done(function() {
            var settings = SettingsModel.toJSON();
            var networkPresets = settings['provision.preset_networks'] || [];
            if (networkPresets.length > 0) {
                networkPresets = networkPresets.map(function(n) {
                    if (typeof(n) === 'string') {
                        return {network_uuid: n};
                    } else {
                        return n;
                    }
                });
                settings['provision.preset_networks'] = networkPresets;
            }
            console.log('[settings] read', settings);
            self.setState(settings);
        });
    },
    getInitialState: function() {
        return {certForm: false};
    },
    onChangeCertFile: function(e) {
        var self = this;
        var reader = new FileReader();
        var f = e.target.files[0];
        reader.onload = function(e) {
            console.log(e.target.result);
            self.setState({'new_ssl_certificate': e.target.result});
        };

        reader.readAsText(f, 'ascii');
    },
    onChangeKeyFile: function(e) {
        var self = this;
        var reader = new FileReader();
        var f = e.target.files[0];
        reader.onload = function(e) {
            console.log(e.target.result);
            self.setState({'new_ssl_key': e.target.result});
        };

        reader.readAsText(f, 'ascii');
    },
    saveSettings: function() {
        var self = this;
        var networks = this.refs.networkConfigComponent.getValue();

        var values = { 'provision.preset_networks': networks };

        if (this.state.new_ssl_key && this.state.new_ssl_key.length &&
            this.state.new_ssl_certificate && this.state.new_ssl_certificate.length) {
            values.ssl_certificate = this.state.new_ssl_certificate;
            values.ssl_key = this.state.new_ssl_key;
        }

        console.log('[settings] save', values);
        SettingsModel.clear();
        SettingsModel.save(values).done(function() {
            self.hideAddCertForm();
            self.fetchSettings();
            adminui.vent.trigger('notification', {
                level: 'success',
                message: 'Settings saved successfully.'
            });
        });
    },
    showAddCertForm: function() {
        this.setState({
            new_ssl_key: null,
            new_ssl_cert: null,
            certForm: true
        });
    },
    hideAddCertForm: function() {
        this.setState({
            new_ssl_key: null,
            new_ssl_cert: null,
            certForm: false
        });
    },
    render: function() {
        adminui.vent.trigger('settitle', 'settings');

        var certButtonClasses = 'btn btn-default btn-file';
        var keyButtonClasses = 'btn btn-default btn-file';
        if (this.state.new_ssl_key) {
            keyButtonClasses = keyButtonClasses + ' btn-success';
        }
        if (this.state.new_ssl_certificate) {
            certButtonClasses = certButtonClasses + ' btn-success';
        }

        return <div id="page-settings">
            <div className="page-header">
                <h1>Operations Portal Settings</h1>
            </div>

            <div className="row">
                <div className="col-sm-12">
                    <div className="panel panel-info">
                        <div className="panel-heading">
                            SSL Certificate - Configure adminui to use a valid SSL certificate.
                        </div>

                        <div className="panel-body">
                            {
                                !this.state.certForm ?
                                    <div className="ssl row">
                                        <div className="col-sm-6">
                                            {
                                                (this.state.ssl_certificate && this.state.ssl_key) ?
                                                    <div className="text-success"><i className="fa fa-check"></i> SSL Certificate &amp; Key Installed</div>
                                                :
                                                    <div className="text-warning"><i className="fa fa-warn"></i> No SSL Certificate Installed. Using default self signed certificate.</div>
                                            }
                                        </div>
                                        <div className="col-sm-6">
                                            <a onClick={this.showAddCertForm} className="pull-right"><i className="fa fa-upload"></i> Install New Certificate</a>
                                        </div>
                                    </div> : null
                            }

                            { this.state.certForm ? <div className="ssl-form form-horizontal">
                                    <div className="alert alert-warning">
                                        Valid x509 SSL certificate and private key files in PEM format are required.
                                    </div>
                                    <div className="form-group">
                                        <label className="control-label col-sm-4">Certificate</label>
                                        <div className="controls col-sm-4">
                                            <span className={certButtonClasses}>
                                                <i className="fa fa-plus-circle"></i> Install SSL Certificate <input onChange={this.onChangeCertFile} className="input cert" type="file" />
                                            </span>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="control-label col-sm-4">Key</label>
                                        <div className="controls col-sm-4">
                                            <span className={keyButtonClasses}>
                                                <i className="fa fa-plus-circle"></i> Install SSL Key <input onChange={this.onChangeKeyFile} className="input key" type="file" />
                                            </span>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="control-label col-sm-4"></label>
                                        <div className="controls col-sm-4">
                                        <a onClick={this.hideAddCertForm} className="btn btn-link">Revert</a>
                                        </div>
                                    </div>
                                </div> : null }

                        </div>
                  </div>
                </div>
            </div>


            <div className="row">
                <div className="col-sm-12">
                    <div className="panel panel-info">
                        <div className="panel-heading">
                            Default Networks - Default network configuration to be selected when provisioning
                        </div>
                        <div className="panel-body">
                            <div className="form-group">
                                <div className="nic-selection-container">
                                    <MultipleNicConfigComponent 
                                        ref="networkConfigComponent"
                                        nics={this.state['provision.preset_networks']}
                                        networkFilters={{provisionable_by: adminui.user.get('uuid')}} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <button onClick={this.saveSettings} disabled={
                this.state.certForm && (!this.state.new_ssl_key || !this.state.new_ssl_certificate)
            } className="btn save btn-primary">Save Changes</button>
        </div>;
    }
});

module.exports = SettingsComponent;
