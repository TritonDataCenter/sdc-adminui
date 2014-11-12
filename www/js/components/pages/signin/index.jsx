/**
 * @jsx React.DOM
 */
var $ = require('jquery');
var React = require('react');
var SigninComponent = React.createClass({
    propTypes: {
        userModel: React.PropTypes.object.isRequired
    },
    getInitialState: function() {
        return {
            errorMessage: false
        };
    },
    _onAuthenticate: function(e) {
        e.preventDefault();
        this.setState({
            signingIn: true,
            errorMessage: false
        });
        var username = this.refs.username.getDOMNode().value;
        var password = this.refs.password.getDOMNode().value;
        this.props.userModel.authenticate(username, password);
    },
    _onSigninError: function(err) {
        this.setState({
            errorMessage: err,
            signingIn: false
        });
    },
    componentDidMount: function() {
        this.centerSigninBox();
        this.focusFirstInput();
        this.props.userModel.on('error', this._onSigninError);
    },
    componentWillUnmount: function() {
        this.props.userModel.off('error', this._onSigninError);
    },
    centerSigninBox: function() {
        var $v = $(this.refs.view.getDOMNode());
        var w = $(window).width();
        var h = $(window).height();
        var x = (w/2)-$v.width()/2;
        var y = (h/2)-$v.height()/2;
        if (y < 0) { y = 0; }
        $v.css({
            left: x + 'px',
            top: y + 'px'
        });
    },
    focusFirstInput: function() {
        var $v = $(this.refs.view.getDOMNode());
        $v.find("input[value='']:not(:checkbox,:button):visible:first").focus();
    },
    render: function() {
        var login = this.props.userModel.get('login');
        var dc = this.props.userModel.getDatacenter();
        return (
            <div ref="view" id="signin">
                <h1 className="branding">
                    <span className="sdc">SDC</span> <span className="product">ADMINUI</span> <span className="datacenter">{dc}</span>
                </h1>

                { this.state.errorMessage ?
                <div className="alert alert-danger">
                    <span className="msg">{this.state.errorMessage}</span>
                </div> : null }

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
                        <button type="submit" disabled={this.state.signingIn} className="btn input-lg btn-block btn-info">
                        { this.state.signingIn ? 'Hold on, Signing in...' : 'Sign In to SmartDataCenter' }
                        </button>
                    </div>
                </form>
            </div>
        );
    }

});

module.exports = SigninComponent;
