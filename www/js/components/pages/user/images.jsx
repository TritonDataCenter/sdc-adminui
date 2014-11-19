/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var React = require('react');
var ImagesCollection = require('../../../models/images');
var ImagesList = require('../images/list');


var UserImagesList = React.createClass({
    componentWillMount: function() {
        this.images = new ImagesCollection(null, {
            params: { owner: this.props.user }
        });
        this.images.fetch().done(function() {
            this.setState({images: this.images});
        }.bind(this));
    },
    render: function() {
        return (
            <div className="user-images-list">
                <h3>Images owned by this user</h3>
                <ImagesList images={this.images} />
            </div>
        );
    }
});


module.exports = UserImagesList;
