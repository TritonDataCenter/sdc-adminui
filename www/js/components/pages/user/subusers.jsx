var React = require('react');
var PropTypes = React.PropTypes;
var api = require('../../../request');
var adminui = require('../../../adminui');

var UserForm = require('../../../views/user-form');

var UserSubusers = React.createClass({
    propTypes: {
        'account': PropTypes.string.isRequired
    },
    getInitialState: function() {
        return {
            users: []
        };
    },
    gotoUser: function(u) {
        adminui.vent.trigger('showcomponent', 'user', {
            user: u.uuid,
            account: u.account,
            tab: 'profile'
        });
    },
    _fetchUsers: function() {
        var account = this.props.account;

        api.get('/api/users').query({account: account}).end(function(res) {
            if (res.ok) {
                this.setState({users: res.body});
            }
        }.bind(this));
    },
    componentWillMount: function() {
        this._fetchUsers();
    },
    componentDidReceiveProps: function(props) {
        this._fetchUsers();
    },
    renderUserRow: function(u) {
        /*
        {
            "account":"930896af-bf8c-48d4-885c-6573a94b1853",
            "approved_for_provisioning":"false",
            "cn":"John Doe",
            "company":"Joyent",
            "email":"subuser@joyent.com",
            "givenname":"John",
            "objectclass":"sdcperson",
            "phone":"7788558522",
            "registered_developer":"false",
            "sn":"Doe",
            "userpassword":"35d1074d307f9e46b3f153f6f14fe70123605b8a",
            "uuid":"c53f6bff-856d-49ec-a3db-9d3cfa54675c",
            "pwdchangedtime":"1402651364603",
            "created_at":"1402651364603",
            "updated_at":"1402651364603",
            "pwdendtime":"253406291851364600",
            "alias":"subuser1",
            "login":"930896af-bf8c-48d4-885c-6573a94b1853/subuser1",
            "emailhash":"c4ed941d0afbb504ba8cf17dd54cd1c3"
        }
        */
        var userIconUrl;
        if (u.emailhash) {
            userIconUrl = _.str.sprintf('url(https://www.gravatar.com/avatar/%s?d=identicon&s=48)', u.emailhash);
        } else {
            userIconUrl = '';
        }
        var userIconStyle = { 'background-image': userIconUrl };


        return <div className="subuser panel">
            <div className="panel-body">
                <div className="subuser-icon" style={userIconStyle}></div>
                <div className="subuser-details">
                    <a onClick={this.gotoUser.bind(null, u)} className="alias">{u.alias}</a>
                    <div className="cn">{u.cn}</div>
                </div>
                <div className="subuser-email">
                    <a href={'mailto:' + u.email}><i className="fa fa-email"></i> {u.email}</a>
                </div>
            </div>
        </div>;
    },

    showUserForm: function() {
        var createView = new UserForm({account: this.props.account});
        createView.render();
        createView.on('user:saved', function(user) {
            this._fetchUsers();

            adminui.vent.trigger('notification', {
                level: 'success',
                message: _.str.sprintf('User <strong>%s</strong> saved under this account.', user.get('login'))
            });
        }, this);
    },
    render: function() {
        return (<div className="user-subusers">
            <h3>Account Users
                <div className="actions">
                    <button onClick={this.showUserForm} className="btn btn-info"><i className="fa fa-plus" /> Create User</button>
                </div>
            </h3>

            <div class="subusers-list">
            { this.state.users.map(this.renderUserRow, this)}
            </div>
        </div>);
    }
});

module.exports = UserSubusers;
