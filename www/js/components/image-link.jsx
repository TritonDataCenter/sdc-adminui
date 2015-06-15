/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

"use strict";

var React = require('react');
var request = require('../request');
var _ = require('underscore');
var Promise = require('promise');

var _getImagesPromise = {};

function getImage(imageUuid) {
    var url = _.str.sprintf('/api/images/%s', imageUuid);
    if (_getImagesPromise[imageUuid]) {
        return _getImagesPromise[imageUuid].p;
    } else {
        var r, p;
        p = new Promise(function(resolve, reject) {
            r = request.get(url).end(function(res) {
                if (res.ok) {
                    resolve(res.body);
                } else {
                    reject(res.body);
                }
            });
        });
        _getImagesPromise[imageUuid] = {p: p, r: r};
        return _getImagesPromise[imageUuid].p;
    }
}


var ImageLink = React.createClass({
    displayName: 'ImageLink',
    getInitialState: function() {
        return {
            loading: true
        };
    },
    componentDidMount: function() {
        getImage(this.props.imageUuid).done(function(img) {
            this.setState({image: img, loading: false});
        }.bind(this));
    },
    render: function() {
        if (this.state.loading) {
            return null;
        }
        var image = this.state.image;
        return <div className="image-link">
            <i className="fa fa-picture-o fa-fw"></i> <a className="image-name" href={"/images/"+image.uuid}>{image.name + ' ' + image.version}</a>
        </div>;
    }
});

module.exports = ImageLink;
