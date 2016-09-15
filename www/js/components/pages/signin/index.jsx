/**
 * @jsx React.DOM
 */
var $ = require('jquery');
var _ = require('underscore');
var React = require('react');
var cx = require('classnames');

var Pinger = require('../../../ping');
var SigninComponent = React.createClass({
    propTypes: {
        userModel: React.PropTypes.object.isRequired
    },
    getInitialState: function () {
        return {
            errorMessage: false
        };
    },
    _onAuthenticate: function (event) {
        event.preventDefault();
        this.setState({
            signingIn: true,
            errorMessage: false
        });
        var username = this.refs.username.getDOMNode().value;
        var password = this.refs.password.getDOMNode().value;
        this.props.userModel.authenticate(username, password);
    },
    _onSigninError: function (err) {
        this.setState({
            errorMessage: err,
            signingIn: false
        });
        this.refs.password.getDOMNode().value = '';
        this.focusFirstInput();
    },
    onPing: function(err, data) {
        if (_.values(data.services).indexOf(false) !== -1) {
            this.setState({
                disableSignin: true
            });
        } else {
            this.setState({
                disableSignin: false
            });
        }
    },
    onConnectionLost: function (err) {
        this.setState({disableSignin: true, signingIn: false});
    },
    componentDidMount: function () {
        this.pinger = new Pinger({interval: 5*1000});
        this.pinger.on('ping', this.onPing);
        this.pinger.on('connectionLost', this.onConnectionLost);
        this.pinger.start();
        this.centerSigninBox();
        this.focusFirstInput();
        this.props.userModel.on('error', this._onSigninError);
        $(window).on('resize', this.centerSigninBox);
    },
    componentWillUnmount: function () {
        this.pinger.stop();
        this.pinger.removeListener('ping', this.onPing);
        this.props.userModel.off('error', this._onSigninError);
        $(window).off('resize', this.centerSigninBox);
    },
    centerSigninBox: function () {
        var view = $(this.refs.view.getDOMNode());
        var windowWidth = $(window).width();
        var windowHeight = $(window).height();
        var abscissa = (windowWidth / 2) - view.width() / 2;
        var ordinate = (windowHeight / 2) - view.height() / 2;
        ordinate = ordinate < 0 ? 0 : ordinate;
        view.css({
            left: abscissa + 'px',
            top: ordinate + 'px'
        });
    },
    focusFirstInput: function () {
        var $v = $(this.refs.view.getDOMNode());
        $v.find("input[value='']:not(:checkbox,:button):visible:first").focus();
    },
    render: function () {
        var login = this.props.userModel.get('login') || '';
        var dc = this.props.userModel.getDatacenter();
        var buttonClasses = cx({
            'btn': true,
            'btn-block': true,
            'input-lg': true,
            'btn-info': !this.state.signingIn && !this.state.disableSignin
        });
        return (
            <div ref="view" id="signin">
                <h1 className="branding">
                    <span className="sdc">SDC</span> <span className="product">ADMINUI</span> <span className="datacenter">{dc}</span>
                </h1>

                {this.state.disableSignin ?
                <div className="alert alert-danger">
                    <span className="msg">
                        Services required for authentication are currently unavailable. Signin will be re-enabled when service is restored
                    </span>
                </div> : null}

                {this.state.errorMessage ?
                <div className="alert alert-danger">
                    <span className="msg">{this.state.errorMessage}</span>
                </div> : null}

                <form className="form" onSubmit={this._onAuthenticate}>
                    <div className="form-group">
                        <label className="control-label">Login</label>
                        <input className="form-control input-lg"
                            type="text" ref="username" defaultValue={login}
                            placeholder="Enter operator login name" autoComplete="off" name="username" />
                    </div>
                    <div className="form-group">
                        <label className="control-label">Password</label>
                        <input className="form-control input-lg" ref="password" defaultValue="" type="password" placeholder="Enter operator password" name="password" />
                    </div>
                    <div className="controls">
                        <button type="submit" disabled={this.state.disableSignin || this.state.signingIn} className={buttonClasses}>
                        {this.state.disableSignin ? 'Signin Disabled - Monitoring Service Availability' :
                            this.state.signingIn ? 'Hold on, Signing in...' : 'Sign In to SmartDataCenter'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }
});

module.exports = SigninComponent;
