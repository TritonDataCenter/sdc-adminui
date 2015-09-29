var React = require('react');
var BackboneMixin = require('../../_backbone-mixin');
var app = require('../../../adminui');
var moment = require('moment');

var ImagesList = React.createClass({
    mixins: [BackboneMixin],
    getBackboneModels: function() {
        return [this.props.images];
    },
    _onClickImageName: function(i) {
        app.vent.trigger('showview', 'image', {image: i});
        return false;
    },

    renderItem: function (i) {
        var img = i.toJSON();
        var href = '/images/' + img.uuid;
        var publishDate = moment(img.published_at).format('MM/DD/YYYY');
        var os = img.type === 'zvol' ? ('KVM, ' + img.os) : img.os;

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
