var React = require('react/addons');
var AlarmsMenu = require('./alarms-menu.jsx');
var cx = React.addons.classSet;

var Topnav = React.createClass({
    propTypes: {
        currentDatacenter: React.PropTypes.string,
        user: React.PropTypes.object.isRequired,
        active: React.PropTypes.string,
        handleMenuSelect: React.PropTypes.func,
        handleClickCurrentUser: React.PropTypes.func
    },
    classesFor: function(view) {
        var attrs = {};
        view.split(" ").forEach(function(v) {
            attrs[v] = true;
            if (this.props.active === v) {
                attrs['active'] = true;
            }
        }.bind(this));

        return cx(attrs);
    },
    _clickedMenuItem: function(e) {
        e.preventDefault();
        var view = e.currentTarget.getAttribute('data-view');
        this.props.handleMenuSelect(view);
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
                        <div className="col-xs-8">
                            <ul className="nav navbar-nav main-nav">
                                <li  onClick={this._clickedMenuItem} data-view="dashboard" className={this.classesFor('datacenter dashboard')} ><a href="/dashboard" className="datacenter-name">{this.props.currentDatacenter}</a></li>
                                <li className="fishbulb"><a title="Cloud Analytics" href="/fishbulb" target="fishbulb"><i className="fa fa-bar-chart-o"></i> Analytics</a></li>
                                <li onClick={this._clickedMenuItem} className={this.classesFor('users')} data-view="users"><a href="/users"><i className="fa fa-users"></i> Users</a></li>
                            {
                                !this.props.readonly &&
                                <li onClick={this._clickedMenuItem} className={this.classesFor('settings')}  data-view="settings">
                                    <a href="/settings"><i className="fa fa-gear"></i> Settings</a>
                                </li>
                            }
                            </ul>
                            <ul className="nav navbar-nav main-nav navbar-right">
                                <li className="alarms">
                                    <AlarmsMenu user={this.props.user.get('adminUuid')} />
                                </li>
                            </ul>
                        </div>
                        <div className="acc-controls navbar-text navbar-right">
                            <a onClick={this.props.handleNavigateCurrentUser}
                                className="current-user"
                                href={'/users/'+this.props.user.get('uuid')}><i className="fa fa-user"></i> <span className="login-name">{this.props.user.get('login')}</span></a>
                            <a onClick={this.props.handleSignout} className="signout"> <i className="fa fa-sign-out"></i></a>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
});


module.exports = Topnav;
