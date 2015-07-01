/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var React = require('react');
var Modal = require('../../modal');
var Chosen = require('react-chosen');
var Images = require('../../../models/images');
var Vm = require('../../../models/vm');

var ReprovisionVm = React.createClass({
    propTypes: {
        uuid: React.PropTypes.string.isRequired,
        onJobCreated: React.PropTypes.func.isRequired,
        onReprovisionCancel: React.PropTypes.func.isRequired
    },
    getInitialState: function() {
        return {
            images: [],
            show: true
        };
    },

    componentWillMount: function() {
        var self = this;
        var images =  new Images();
        images.fetch().done(function(images) {
            self.setState({images: images});
        });
    },

    onSelectImage: function(e, c) {
        var image = e.target.value;
        this.setState({selectedImage: image });
    },

    onSubmit: function() {
        var vm = new Vm({uuid: this.props.uuid});
        var self = this;
        vm.reprovision(this.state.selectedImage, function(err, job) {
            if (job) {
                self.setState({show: false});
                self.props.onJobCreated(job);
            } else {
                alert('Error reprovisioning Container: ' + JSON.stringify(err));
            }
        });
    },

    isValid: function() {
        return this.state.selectedImage && this.state.selectedImage.length && this.state.confirmed;
    },

    onChangeConfirmText: function(e) {
        if (e.target.value.toLowerCase() === 'reprovision') {
            this.setState({confirmed: true});
        } else {
            this.setState({confirmed: false});
        }
    },

    render: function() {
        if (this.state.show === false) {
            return null;
        }
        var node = <Modal onRequestHide={this.props.onReprovisionCancel} {...this.props} title="Reprovision Container" ref="modal">
            <div className="modal-body">
                <form onSubmit={this.onSubmit}>
                    <div className="form-group">
                        <div className="alert alert-danger">
                            <p><strong>WARNING:</strong></p>
                            <p>This feature will destroy all data on this Container. This operation cannot be undone.</p>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Select an image</label>
                        <Chosen data-placeholder="Select an Image" value={this.state.selectedImage} onChange={this.onSelectImage}>
                            <option value=""></option>
                        {
                            this.state.images.map(function(i) {
                                return <option key={i.uuid} value={i.uuid}>{i.name} - {i.version}</option>;
                            })
                        }
                        </Chosen>
                    </div>

                    <div className="form-group">
                        <p className="text-danger"><strong>Confirm</strong> you want to proceed by typing &laquo;<strong>REPROVISION</strong>&raquo; in the box below: </p>
                        <p><input type="text" placeholder="type: reprovision  to confirm" className="form-control" onChange={this.onChangeConfirmText} /></p>
                    </div>
                </form>
            </div>
            <div className="modal-footer">
                <button type="button" onClick={this.props.onReprovisionCancel} className="btn btn-link">Close</button>
                <button type="submit" disabled={ this.isValid() ? '': 'disabled' } onClick={this.onSubmit} className="btn btn-primary">Reprovision</button>
            </div>
        </Modal>;

        return node;
    }
});

module.exports = ReprovisionVm;
