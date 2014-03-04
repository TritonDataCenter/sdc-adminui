/** @jsx React.DOM **/
var React = require('react');
var Notes = require('../models/notes');

/*
    item_uuid: { type: "string", unique: false },
    owner_uuid: { type: "string", unique: false },
    note: { type: "string", unique: false },
    created: { type: "string", unique: false },
    archived: { type: "string", unique: false }
*/

var Note = require('../models/note');
var moment = require('moment');

var User = require('../models/user');
var UserLink = React.createClass({
    getInitialState: function() {
        return {
            user: {},
            loaded: false
        };
    },
    componentDidMount: function() {
        var user = this.user = new User({uuid: this.props.uuid});
        var self = this;
        var req = this.user.fetch();
        req.done(function() {
            self.setState({user: user, loaded: true});
        });
    },
    handleClick: function() {
        if (this.props.handleClick) {
            this.props.handleClick(this.state.user);
        }
    },
    render: function() {
        if (this.state.loaded) {
            var user = this.state.user.toJSON();
            return <a onClick={this.handleClick} href={"/users/" + this.props.uuid}>{user.cn}</a>
        } else {
            return <a className="loading" onClick={this.handleClick} href={"/users/" + this.props.uuid}>Loading</a>
        }
    }
});


var NotesPanel = React.createClass({
    handleSubmit: function(e) {
        e.preventDefault();
        var value = this.refs.input.getDOMNode().value;
        this.props.handleSave({note: value});
        this.refs.input.getDOMNode().value = '';
    },
    focus: function() {
        $(this.refs.input.getDOMNode()).focus();
    },
    render: function() {
        var nodes;
        if (this.props.notes.length === 0) {
            nodes = [<li>There are no notes to display.</li>]
        } else {
            nodes = _.map(this.props.notes, function(note) {
                return <li key={note.uuid}>
                <div className="meta">
                    <div className="author"><UserLink uuid={note.owner_uuid} /></div>
                    <div className="date">{moment(note.created).utc().format("LLL")}</div>
                </div>
                <div className="note">{note.note}</div>
                </li>
            });
        }

        return <div className="notes-panel">
            <ul className="notes-list">{nodes}</ul>
            <form onSubmit={this.handleSubmit}>
                <textarea ref="input" type="text"></textarea>
                <button type="submit" className="btn btn-primary"><i className="icon-comment"></i></button>
            </form>
        </div>
    }
});

module.exports = React.createClass({
    getInitialState: function() {
        return { notes: [] };
    },
    propTypes: {
        item: React.PropTypes.string
    },
    handleSave: function(item) {
        var note = new Note({
            item_uuid: this.props.item,
            note: item.note
        });
        var self = this;

        note.save(null, {
            success: function() {
                self.fetchNotes();
            }
        });
    },
    componentDidMount: function() {
        this.fetchNotes();
    },
    repositionDropdown: function() {
        var $counts = $(this.refs.counts.getDOMNode());
        var $panel = $(this.refs.panel.getDOMNode());

        var drop = this.props.drop || 'left';

        if (drop === 'left') {
            $panel.offset({
                top: $counts.offset().top + $counts.outerHeight(),
                left: $counts.offset().left - $panel.outerWidth() + $counts.outerWidth()
            });
        } else if (drop === 'right') {
            $panel.offset({
                top: $counts.offset().top + $counts.outerHeight(),
                left: $counts.offset().left
            });
        }
    },
    componentDidUpdate: function() {
        if (this.state.dropdown) {
            this.repositionDropdown()
            this.refs.panel.focus();
        }
    },
    fetchNotes: function() {
        var self = this;
        var collection = new Notes();
        collection.item_uuid = this.props.item;
        var req = collection.fetch();
        req.done(function(notes) {
            self.setState({notes: notes});
        });
    },
    toggleDropdown: function() {
        var dropdown = !this.state.dropdown;
        this.setState({dropdown: dropdown});
    },
    render: function() {
        var classNames = ["notes-count"];
        var count = this.state.notes.length;

        if (count > 0) {
            classNames.push('has-notes');
        }
        if (this.state.dropdown) {
            classNames.push('open');
        }
        return (
            <div>
                <a onClick={this.toggleDropdown} ref="counts" className={classNames.join(" ")}><i className="icon-comment"></i>{count}</a>
                {
                    this.state.dropdown ?
                    <NotesPanel handleSave={this.handleSave} ref="panel" notes={this.state.notes} />
                    : ''
                }
            </div>
        );
    }
});
