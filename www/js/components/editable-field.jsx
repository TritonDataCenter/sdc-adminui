/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

'use strict';
var React = require('react');
var app = require('../adminui');

var EditableField = React.createClass({
    getInitialState: function () {
        return {
            edit: false,
            openedEditField: false,
            tooltipText: 'Press ENTER to <i class="fa fa-check"></i> Save<br/>Press ESC to <i class="fa fa-undo"></i> Cancel'
        };
    },
    componentDidMount: function () {
        this.setState({
            value: this.props.value,
            title: this.props.title
        });
    },
    componentDidUpdate: function () {
        var self = this;
        if (this.state.edit && !this.state.openedEditField) {
            var field = React.findDOMNode(this.refs.textField);
            
            var showTooltip = function (value, tooltipText) {
                self.setState({openedEditField: true});
                field.value = value;
                field.focus();
                $(field).tooltip({html: true})
                    .tooltip('fixTitle')
                    .attr('data-original-title', tooltipText)
                    .tooltip('show');
            };

            var listener = function (e) {
                var intKey = window.Event ? e.which : e.keyCode;
                if (intKey === 13) {
                    self.props.onSave(field.value, self.props.params, function (res) {
                        if (res.error) {
                            var errors = res.body.errors;
                            var errorMessage = errors && errors.length &&
                                errors.map(function (err) { return err.message; }) || res.error;
                            showTooltip(field.value, errorMessage);
                        } else {
                            field.offsetParent.removeEventListener('keyup', listener);
                            self.editDone();
                            self.setState({
                                value: field.value
                            });
                        }
                    });
                } else if (intKey === 27) {
                    field.offsetParent.removeEventListener('keyup', listener);
                    self.editDone();
                }
            }.bind(this);
            field.offsetParent.addEventListener('keyup', listener);
            showTooltip(this.state.value, this.state.tooltipText);
        }
    },
    clickEdit: function () {
        if (!this.state.openedEditField) {
            this.setState({
                edit: true
            });
        }
    },
    editDone: function () {
        this.setState({edit: false, openedEditField: false});
    },
    render: function () {
        var self = this;
        var value = this.state.value;
        var title = this.state.title;

        return (
            <li>
                <strong>{title}</strong>
                {this.state.edit ? <input type='text' 
                    ref="textField" 
                    data-toggle="tooltip" 
                    data-placement="top" 
                    onBlur={self.editDone} /> : <div className="value selectable">{value}</div>}
                {app.user.role('operators') && <a onClick={self.clickEdit} className="edit-mtu">{'Edit ' + title + ' '}
                    <i className="fa fa-pencil"></i></a>}
            </li>
        )
    }
});

module.exports = EditableField;