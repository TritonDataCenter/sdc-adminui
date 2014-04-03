var adminui = require('../adminui');
var User = require('../models/user');

var UserTile = module.exports = React.createClass({
    propTypes: {
        uuid: React.PropTypes.string.isRequired
    },
    getInitialState: function() {
        return {
            loading: true
        }
    },
    componentDidMount: function() {
        var user = new User({uuid: this.props.uuid });
        var req = user.fetch();
        req.done(function(res, x, y) {
            this.setState({loading: false});
            this.setState(res);
        }.bind(this));

        req.error(function() {
            this.setState({
                loading: false,
                loadingFailed: true
            });
        }.bind(this));
    },
    navigateToUser: function(e) {
        e.preventDefault();
        adminui.vent.trigger('showview', 'user', {uuid: this.props.uuid });
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
                        {user.cn}
                        { user.company ? <div className="company">{user.company}</div> : '' }
                        </p>
                        <a className="email" href={"mailto:"+user.email}><i className="fa fa-envelope-o"></i> {user.email}</a>
                    </div>
                    <div className="col-md-12">
                        <span className="uuid">{this.props.uuid}</span>
                    </div>
                </div>
            </div>
        );
    }
});
