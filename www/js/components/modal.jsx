/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var React = require('react');

var Modal =  React.createClass({
    propTypes: {
        onRequestHide: React.PropTypes.func.isRequired
    },
    componentDidMount: function() {
        var container = (this.props.container && this.props.container.getDOMNode()) || document.body;
        container.className += container.className.length ? ' modal-open' : 'modal-open';
    },
    componentWillUnmount: function() {
        var container = (this.props.container && this.props.container.getDOMNode()) || document.body;
        container.className = container.className.replace(/ ?modal-open/, '');
    },
    getDefaultProps: function() {
        return {
            backdrop: true
        };
    },
    handleBackdropClick: function (e) {
        if (e.target !== e.currentTarget) {
            return;
        }

        this.props.onRequestHide();
    },
    renderTitle: function() {
        return React.isValidElement(this.props.title) ? this.props.title : <h4 className="modal-title">{this.props.title}</h4>;
    },
    render: function() {
        var modal = <div ref="modal"
            tabIndex="-1"
            onClick={this.props.backdrop ? this.handleBackdropClick : null}
            className="modal in" style={{display: 'block'}} {...this.props}>
            { this.props.backdrop ?
                <div className="modal-backdrop in" ref="backdrop" onClick={this.handleBackdropClick}></div>
            : null }
            <div className="modal-dialog">
                <div className="modal-content">
                { this.props.title ?
                    <div className="modal-header">
                        <button type="button" className="close" aria-hidden="true" onClick={this.props.onRequestHide}>&times;</button>
                        {this.renderTitle()}
                    </div>
                : ''}
                    { this.props.children }
                </div>
            </div>
        </div>;

        return modal;
    }
});

module.exports = Modal;
