/** @jsx React.DOM */

var User = require('../models/user');
var React = require('react');

var UserTile = module.exports = React.createClass({
    propTypes: {
        uuid: React.PropTypes.string.isRequired,
        onUserDetails: React.PropTypes.func
    },
    getInitialState: function() {
        return {
            loading: true
        };
    },
    componentWillReceiveProps: function(props) {
        this._load(props.uuid);
    },
    _load: function(uuid) {
        console.info('[UserTile] Loading user info ', uuid);
        var user = new User({uuid: uuid });

        this.setState({loading: true});

        var req = user.fetch();
        req.done(function(data, x, y) {
            data.loading = false;
            this.setState(data);
        }.bind(this));

        req.error(function() {
            this.setState({
                loading: false,
                loadingFailed: true
            });
        }.bind(this));
    },
    componentDidMount: function() {
        this._load(this.props.uuid);
    },
    navigateToUser: function(e) {
        e.preventDefault();
        this.props.onUserDetails({uuid: this.props.uuid});
    },
    render: function() {
        var user = this.state;

        if (this.state.loading) {
            return <div className="user-tile loading" key={this.props.uuid}>
                Fetching User Information <span className="fa fa-spinner fa-spin"></span>
            </div>
        }

        if (this.state.loadingFailed) {
            return <div className="user-tile failed" key={this.props.uuid}>
                <div className="row">
                    <div className="col-md-1">&nbsp;</div>
                    <div className="col-md-11">
                        <span className="text-danger">Unable to fetch User Information.</span>
                        <span className="uuid selectable">{this.props.uuid}</span>
                    </div>
                </div>
            </div>
        }

        return (
            <div className="user-tile" key={this.props.uuid}>
                <div className="row">
                    <div className="col-md-12">
                        <div className="user-icon" style={{
                            background: 'url(https://www.gravatar.com/avatar/'+user.emailhash+'?d=identicon&s=100)'
                        }}>
                        </div>
                    </div>

                    <div className="col-md-12">
                        <a href={'/users/'+user.uuid}
                            onClick={this.navigateToUser}
                            className="login-link">
                            <span className="login">{user.login}
                            </span>
                        </a>
                        <p>
                        {user.cn} { user.company ? <div className="company">{user.company}</div> : '' }
                        </p>
                        <a className="email" href={"mailto:"+user.email}><i className="fa fa-envelope-o"></i> {user.email}</a>
                    </div>
                    <div className="col-md-12">
                        <span className="uuid selectable">{this.props.uuid}</span>
                    </div>
                </div>
            </div>
        );
    }
});
