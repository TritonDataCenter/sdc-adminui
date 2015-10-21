/** @jsx React.DOM */

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

'use strict';
var React = require('react');
var Bloodhound = require('bloodhound');
var adminui = require('../adminui');
var $ = require('jquery');
var Servers = require('../models/servers');
var ServerTypeaheadTpl = require('../tpl/typeahead-server.hbs');
var bloodhound;

var ServerTypeahead = React.createClass({
    getInitialState: function () {
        return {
            servers: []
        };
    },
    componentWillMount: function () {
        var servers = new Servers();
        servers.fetch().done(function () {
            this.initializeBloodhound(servers.toJSON());
        }.bind(this));
    },
    initializeBloodhound: function (servers) {
        var $field = $(React.findDOMNode(this.refs.serverFilter));
        var isInFocus = $field.is(':focus');

        bloodhound = new Bloodhound({
            name: 'servers',
            local: servers.map(function (server) {
                return {
                    model: server,
                    uuid: server.uuid,
                    tokens: [server.hostname, server.uuid],
                    hostname: server.hostname
                };
            }),
            datumTokenizer: function (datum) {
                return datum.tokens;
            },
            queryTokenizer: function (query) {
                return Bloodhound.tokenizers.whitespace(query);
            },
            limit: 8
        });
        
        $field.typeahead({
            name: 'servers',
            minLength: 1,
            highlight: true,
        },
        {
            displayKey: 'uuid',
            name: 'servers',
            source: bloodhound.ttAdapter(),
            templates: {
                suggestion: ServerTypeaheadTpl
            }
        });

        bloodhound.initialize();

        if (isInFocus) {
            $field.focus();
            $field.typeahead('open');
            var value = $field.val();
            if (value) {
                $field.typeahead('val', '');
                $field.typeahead('val', value);
            }
        }

        $field.bind('typeahead:selected', this.handleChange);
    },
    handleChange: function (e, datum) {
        if (this.props.onChange) {
            this.props.onChange(datum ? datum.uuid : '');
        }
    },
    render: function () {
        return (
            <input 
                className={"typeahead " + (this.props.className || '')}
                type="text"
                placeholder="Enter UUID or search by hostname"
                ref="serverFilter"
                name="server"
                onChange={this.handleChange} />
        );
    }
});

module.exports = ServerTypeahead;
