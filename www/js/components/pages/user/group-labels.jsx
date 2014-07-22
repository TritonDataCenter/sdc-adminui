var User = require('../../../models/user');
var React = require('react');
var Promise = require('promise');

var _fetches = {};

function fetchUserGroups(userUuid) {
    console.log('fetchUserGroups', userUuid);
    if (_fetches[userUuid]) {
        return _fetches[userUuid];
    }

    var p = new Promise(function(resolve, reject) {
        var user = new User({uuid: userUuid});
        user.fetch().done(function() {
            console.log(user.toJSON().groups);
            resolve(user.toJSON().groups);
        });
    });

    _fetches[userUuid] = p;
    return p;
}

var UserGroupsLabels = React.createClass({
    propTypes: {
        userUuid: React.PropTypes.string.isRequired
    },
    getInitialState: function() {
        return {
            groups: []
        };
    },
    componentWillMount: function() {
        fetchUserGroups(this.props.userUuid).then(function(groups) {
            this.setState({groups: groups});
        }.bind(this));
    },
    render: function() {
        var groups = this.state.groups.map(function(g) {
            return <div key={g} className={'group ' + g}>{g}</div>;
        });
        return <div className="groups">{groups}</div>;
    }
});

module.exports = UserGroupsLabels;
