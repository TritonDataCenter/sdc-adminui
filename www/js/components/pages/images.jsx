/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var IMAGE_FETCH_SIZE = 25;

var app = require('../../adminui');
var React = require('react');
var BackboneMixin = require('../_backbone-mixin');
var moment = require('moment');
var _ = require('underscore');

var ImagesList = React.createClass({
    mixins: [BackboneMixin],
    getBackboneModels: function() {
        return [this.props.images];
    },
    _onClickImageName: function(i) {
        app.vent.trigger('showview', 'image', {image: i});
        return false;
    },

    renderItem: function(i) {
        var img = i.toJSON();
        var href = "/images/" + img.uuid;
        var publish_date = moment(img.published_at).format("MM/DD/YYYY");

        return <tr key={img.uuid}>
            <td className="state">
                <span className={img.state}>{img.state}</span>
            </td>
            <td className="name">
                <a data-uuid={img.uuid} onClick={this._onClickImageName.bind(null, i)} className="image-name" href={href}>
                    {img.name} <span className="version">{img.version}</span>
                </a>
                <br />
                <span className="uuid selectable">{img.uuid}</span>
            </td>
            <td className="published">
                {publish_date}
            </td>
            <td>{img.os}</td>
            <td className="visibility">
                { img.public ?
                  <span className="public">public</span>
                  :
                  <span className="private">owner</span>
                }

                { img.acl &&
                <span className="acl">and <a>{img.acl.length} others</a></span>
                }
            </td>
        </tr>;
    },
    render: function() {
        if (this.props.images.length === 0) {
            return <div className="zero-state">No Images Found matching search criteria</div>;
        }

        return <table className="images-list">
                <thead>
                <tr>
                    <th className="state"></th>
                    <th className="name">Name</th>
                    <th className="published">Published</th>
                    <th className="os">OS</th>
                    <th className="visibility">Visibility</th>
                </tr>
                </thead>
            <tbody>
                { this.props.images.map(this.renderItem) }
            </tbody>
            </table>;
    }
});


var ImagesCollection = require('../../models/images');
var ImagesView = React.createClass({
    statics: {
        url: 'images',
        sidebar: 'images'
    },
    getInitialState: function() {
        return {hasMore: false, loaded: false};
    },
    _onSync: function(collection, objs) {
        this.setState({loaded: true});
        if (IMAGE_FETCH_SIZE === objs.length) {
            var newMarker = objs[objs.length-1].uuid;
            var oldMarker = this.images.params.marker;
            if (typeof(oldMarker) === 'undefined' || newMarker !== oldMarker) {
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
        this.images.params = {limit: IMAGE_FETCH_SIZE};
        this._requests.push(this.images.fetch());
    },
    componentDidMount: function() {
        this.refs.searchInput.getDOMNode().focus();
    },
    componentWillUmount: function() {
        this.images.off('fetch');
        this._requests.forEach(function (r) {
            r.abort();
        });
    },
    _searchImage: function(e) {
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
        this._requests.push(this.images.fetch());
    },
    _loadMore: function() {
        this.images.params.marker = this.images.at(this.images.length-1).get('uuid');
        this._requests.push(this.images.fetch({remove: false}));
    },
    onChangeSearchInput: function(e) {
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
                        onBlur={this._searchImage}
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
        app.vent.trigger('showview', 'image-import');
    }
});

module.exports = ImagesView;

