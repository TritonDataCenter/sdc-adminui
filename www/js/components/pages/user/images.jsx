/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var React = require('react');
var ImagesCollection = require('../../../models/images');
var ImagesList = require('../images/list');
var BB = require('../../bb');
var PaginationView = require('../../../views/pagination');

var UserImagesList = React.createClass({
    getInitialState: function () {
        return {
            images: []
        };
    },
    _onSync: function (collection) {
        this.setState({images: collection});
    },
    componentWillMount: function () {
        var images = new ImagesCollection(null, {
            params: {owner: this.props.user}
        });
        this.setState({images: images});

        images.fetch();
        images.on('sync', this._onSync);
        images.on('reset', this._onSync);
    },
    render: function () {
        return (<div className="user-images-list">
            <h3>Images owned by this user</h3>
            <ImagesList images={this.state.images} />
            <BB view={new PaginationView({collection: this.state.images})} />
        </div>);
    }
});


module.exports = UserImagesList;
