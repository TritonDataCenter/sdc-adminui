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
        var modal = <div ref="modal" {...this.props}
            onClick={this.props.backdrop ? this.handleBackdropClick : null}
            className="modal in" style={{display: 'block'}}>
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

        if (this.props.backdrop) {
            return <div>
                <div className="modal-backdrop in" ref="backdrop" onClick={this.handleBackdropClick}></div>
                {modal}
            </div>;
        } else {
            return modal;
        }

    }
});

module.exports = Modal;
