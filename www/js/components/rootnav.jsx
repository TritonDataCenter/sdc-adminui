var React = require('react/addons');
var AlarmsMenu = require('./alarms-menu.jsx');
var cx = React.addons.classSet;

var Rootnav = React.createClass({
    propTypes: {
        currentDatacenter: React.PropTypes.string,
        user: React.PropTypes.object.isRequired,
        active: React.PropTypes.string,

        // handleMenuSelect(view)
        handleMenuSelect: React.PropTypes.func,

        // handleSelectCurrentUser(userUuid)
        handleSelectCurrentUser: React.PropTypes.func
    },
    classesFor: function(view) {
        var attrs = {};
        view.split(" ").forEach(function(v) {
            attrs[v] = true;
            if (this.props.active === v) {
                attrs.active = true;
            }
        }.bind(this));

        return cx(attrs);
    },

    _clickedMenuItem: function(e) {
        e.preventDefault();
        var view = e.currentTarget.getAttribute('data-view');
        this.props.handleMenuSelect(view);
    },

    componentDidMount: function() {
        this.props.user.fetch().done(function() {
            this.forceUpdate();
        }.bind(this));
    },

    render: function() {
        return (
            <div id="rootnav">
                <div className="navbar navbar-default">
                    <div className="container-fluid">
                        <div className="col-xs-2">
                            <div className="navbar-brand">
                                <h1 className="branding">
                                <span className="product">SDC</span>
                                <span className="ops-portal">Operations Portal</span>
                                </h1>
                            </div>
                        </div>
                        <div className="col-xs-7">
                            <ul className="nav navbar-nav main-nav">

                                <li onClick={this._clickedMenuItem} data-view="dashboard" className={this.classesFor('datacenter dashboard')}>
                                    <a href="/dashboard" className="datacenter-name">
                                        <small>Datacenter</small> {this.props.currentDatacenter}
                                    </a>
                                </li>

                                <li className="fishbulb"><a title="Cloud Analytics" href="/fishbulb" target="fishbulb">
                                <i className="fa fa-bar-chart-o fa-fw"></i> Analytics</a></li>

                                <li onClick={this._clickedMenuItem} className={this.classesFor('users')} data-view="users">
                                    <a href="/users"><i className="fa fa-users fa-fw"></i> Users</a>
                                </li>
                            </ul>

                            <ul className="nav navbar-nav main-nav navbar-right">
                                <li className="alarms">
                                    <AlarmsMenu user={this.props.user.get('adminUuid')} />
                                </li>
                                {
                                    !this.props.readonly &&
                                    <li onClick={this._clickedMenuItem} className={this.classesFor('settings')}  data-view="settings">
                                    <a href="/settings"><i className="fa fa-gear fa-fw"></i></a>
                                    </li>
                                }
                            </ul>
                        </div>
                        <div className="acc-controls navbar-text navbar-right">
                            <a className={this.classesFor('current-user')}
                                onClick={this.props.handleSelectCurrentUser.bind(null, this.props.user)}
                                href={'/users/'+this.props.user.get('uuid')}>
                                <div className="user-icon" style={{
                                    background: 'url(https://www.gravatar.com/avatar/'+this.props.user.get('emailhash') + '?d=identicon&s=32)'
                                }} />
                                <div className="name">
                                    <span className="cn">{this.props.user.get('cn')}</span>
                                    <span className="login-name">{this.props.user.get('login')}</span>
                                </div>
                            </a>
                            <a onClick={this.props.handleSignout} className="signout"> <i className="fa fa-sign-out fa-fw"></i></a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
});


module.exports = Rootnav;
