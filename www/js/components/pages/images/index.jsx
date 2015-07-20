/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var IMAGE_FETCH_SIZE = 25;

var React = require('react');
var _ = require('underscore');

var app = require('../../../adminui');
var ImagesList = require('./list');
var ImagesCollection = require('../../../models/images');

var ImagesView = React.createClass({
    statics: {
        url: function () {
            var url = 'images';
            return location.pathname === '/images' ? (url + location.search || '') : url;
        },
        sidebar: 'images'
    },
    getInitialState: function () {
        return {
            hasMore: false,
            loaded: false
        };
    },
    _onSync: function (collection, objs) {
        this.setState({loaded: true});
        if (IMAGE_FETCH_SIZE === objs.length) {
            var newMarker = objs[objs.length - 1].uuid;
            var oldMarker = this.images.params.marker;
            if (typeof oldMarker  === 'undefined' || newMarker !== oldMarker) {
                this.setState({hasMore: true});
            } else {
                this.setState({hasMore: false});
            }
        } else {
            this.setState({hasMore: false});
        }
    },
    componentWillMount: function() {
        this._requests = [];

        this.images = new ImagesCollection(null);
        this.images.on('sync', this._onSync, this);
        this.images.params = {
            sort: 'published_at.desc',
            limit: IMAGE_FETCH_SIZE
        };
        var query = this.props.q;
        if (query && query.length) {
            this.images.params.name = _.str.sprintf('~%s', query);
        }
        this._requests.push(this.images.fetch());
    },
    componentDidMount: function () {
        app.vent.trigger('settitle', 'images');
        this.refs.searchInput.getDOMNode().value = this.props.q || '';
        this.refs.searchInput.getDOMNode().focus();
    },
    componentWillUmount: function () {
        this.images.off('fetch');
        this._requests.forEach(function (request) {
            request.abort();
        });
    },
    _searchImage: function () {
        var value = this.refs.searchInput.getDOMNode().value;

        if (value && value.length) {
            if (value.length === 36) {
                this.images.params.uuid = value;
            } else {
                this.images.params.name = _.str.sprintf('~%s', value);
            }
        } else {
            delete this.images.params.uuid;
            delete this.images.params.name;
            
        }
        delete this.images.params.marker;
        this._requests.push(this.images.fetch().done(function () {
            var params = {};
            if (value && value.length) {
                params.q = value;
            }
            app.router.changeSearch(params);
        }));
    },
    _loadMore: function () {
        this.images.params.marker = this.images.at(this.images.length - 1).get('uuid');
        this._requests.push(this.images.fetch({remove: false}));
    },
    onChangeSearchInput: function (e) {
        if (e.key === 'Enter') {
            this._searchImage();
        }
    },
    render: function() {
        var page = <div id="page-images">
            <div className="page-header">
                <h1>Images
                    { app.user.role('operators') &&
                        <div className="actions">
                            <a onClick={this.onClickImportImage} className="btn btn-success import-image">Import Image</a>
                        </div>
                    }
                </h1>
            </div>
            <div className="row">
                <div className="col-sm-12">
                    <div className="input-group">
                    <input type="text" ref="searchInput" className="form-control"
                        onKeyPress={this.onChangeSearchInput}
                        placeholder="Search for images by exact name or UUID" />
                        <span className="input-group-btn">
                            <button onClick={this._searchImage} type="button" className="btn btn-info"><i className="fa fa-search"> </i> Search</button>
                        </span>
                    </div>
                </div>
            </div>
            { this.state.loaded && <ImagesList images={this.images} /> }
            { (this.state.hasMore) ? <button onClick={this._loadMore} className="btn btn-block btn-info load-more">Load More</button> : ''}
        </div>;

        return page;
    },
    onClickImportImage: function() {
        app.vent.trigger('showview', 'images-import');
    }
});

module.exports = ImagesView;

