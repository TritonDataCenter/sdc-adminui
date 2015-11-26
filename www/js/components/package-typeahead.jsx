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
var PackagesCollection = require('../models/packages');
var PackageTypeaheadTpl = require('../tpl/typeahead-package.hbs');
var bloodhound;

var TypeaheadPackage = React.createClass({
    getInitialState: function () {
        return {
            packages: []
        };
    },
    componentWillMount: function () {
        var packages = new PackagesCollection();
        packages.fetch().done(function () {
            this.initializeBloodhound(packages.toJSON());
        }.bind(this));
    },
    initializeBloodhound: function (packages) {
        var $field = $(React.findDOMNode(this.refs.packageFilter));
        var isInFocus = $field.is(':focus');

        bloodhound = new Bloodhound({
            name: 'packages',
            local: packages.map(function (pkg) {
                return {
                    model: pkg,
                    uuid: pkg.uuid,
                    tokens: [pkg.name, pkg.uuid],
                    version: pkg.version,
                    name: pkg.name
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
            name: 'packages',
            minLength: 1,
            highlight: true,
        },
        {
            displayKey: 'uuid',
            name: 'packages',
            source: bloodhound.ttAdapter(),
            templates: {
                suggestion: PackageTypeaheadTpl
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
        if (this.props.value) {
            $field.typeahead('val', this.props.value);
            $field.blur();
        }
        $field.bind('typeahead:selected', this.handleChange);
    },
    handleChange: function (e, datum) {
        if (this.props.onChange) {
            this.props.onChange(datum ? datum.uuid : e.target.value);
        }
    },
    render: function () {
        return (
            <input 
                className={"typeahead " + (this.props.className || '')}
                type="text"
                placeholder="Enter UUID or search by name"
                ref="packageFilter"
                name="package"
                onChange={this.handleChange} />
        );
    }
});

module.exports = TypeaheadPackage;
