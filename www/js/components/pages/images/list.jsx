var React = require('react');
var BackboneMixin = require('../../_backbone-mixin');
var app = require('../../../adminui');
var moment = require('moment');
var Image = require('../../../models/image');

var ImagesList = React.createClass({
    _onClick: function (img) {
        app.vent.trigger('showview', 'image', {image: img});
        return false;
    },

    renderItem: function (img) {
        var href = '/images/' + img.uuid;
        var model = new Image(img);
        var publishDate = moment(img.published_at).utc().format('MM/DD/YYYY');
        var os = img.type === 'zvol' ? ('HVM, ' + img.os) : img.os;

        return <tr key={img.uuid}>
            <td className="state">
                <span className={img.state}>{img.state}</span>
            </td>
            <td className="name">
                <a data-uuid={img.uuid} onClick={this._onClick.bind(null, model)} className="image-name" href={href}>
                    {img.name} <span className="version">{img.version}</span>
                </a>
                <br />
                <span className="uuid selectable">{img.uuid}</span>
            </td>
            <td className="published">
                {publishDate}
            </td>
            <td>{os}</td>
            <td className="visibility">
                { img.public ?
                  <span className="public">public</span>
                  :
                  <span className="private">owner</span>
                }

                { img.acl &&
                <span className="acl"> and {img.acl.length} others</span>
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


module.exports = ImagesList;
