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
            return <a className="user-link-component" onClick={this.handleClick} href={"/users/" + this.props.uuid}>{user.cn}</a>
        } else {
            return <a className="user-link-component loading" onClick={this.handleClick} href={"/users/" + this.props.uuid}>Loading</a>
        }
    }
});

var NotesPanelNode = React.createClass({
    propTypes: {
        note: React.PropTypes.object.required
    },
    handleArchive: function() {
        this.props.onArchive(this.props.note);
    },
    handleUnarchive: function() {
        this.props.onUnarchive(this.props.note);
    },
    render: function() {
        var note = this.props.note;
        return (
            <li className={note.archived ? 'archived': ''} key={note.uuid}>
                <div className="meta">
                    <div className="author"><UserLink uuid={note.owner_uuid} /></div>
                    <div className="date">{moment(note.created).utc().format("LLL")}</div>
                    <div className="actions">
                    {
                        (note.archived) ?
                        <a onClick={this.handleUnarchive} data-uuid={note.uuid} className="unarchive"><i className="icon-undo"></i></a>
                        :
                        <a onClick={this.handleArchive} data-uuid={note.uuid} className="archive"><i className="icon-trash"></i></a>
                    }
                    </div>
                </div>
                <div className="note">{note.note}</div>
            </li>
        );
    }
});

var NotesPanel = React.createClass({
    getInitialState: function() {
        return {
            disableButton: true
        };
    },
    handleSubmit: function(e) {
        e.preventDefault();
        var value = this.refs.input.getDOMNode().value;
        this.props.handleSave({note: value});
        this.refs.input.getDOMNode().value = '';
    },
    handleArchive: function(note) {
        console.log('NotesPanel', 'handleArchive', note);
        this.props.handleArchive(note);
    },
    handleUnarchive: function(note) {
        console.log('NotesPanel', 'handleUnarchive', note);
        this.props.handleUnarchive(note);
    },
    focus: function() {
        $(this.refs.input.getDOMNode()).focus();
    },
    onInput: function(e) {
        if (e.target.value && e.target.value.length > 0) {
            this.setState({disableButton: false});
        } else {
            this.setState({disableButton: true});
        }
    },
    render: function() {
        var nodes;
        if (this.props.notes.length === 0) {
            nodes = [<li>There are no notes to display.</li>];
        } else {
            nodes = _.map(this.props.notes, function(note) {
                return <NotesPanelNode
                    onArchive={this.handleArchive}
                    onUnarchive={this.handleUnarchive}
                    note={note} />
            }, this);
        }

        return <div className="notes-panel">
            <ul className="notes-list">{nodes}</ul>
            <form onSubmit={this.handleSubmit}>
                <textarea onChange={this.onInput} placeholder="Write a note here..." ref="input" type="text"></textarea>
                <button type="submit" disabled={this.state.disableButton} className="btn">SAVE</button>
            </form>
        </div>
    }
});

module.exports = React.createClass({
    getInitialState: function() {
        return { notes: [] };
    },
    propTypes: {
        item: React.PropTypes.string.required
    },
    handleUnarchive: function(item) {
        var note = new Note(item);
        var req = note.save({archived: false});
        console.info('NotesComponent: unarchiving note', item.uuid);
        req.done(function() {
            console.info('NotesComponent: unarchiving note done', item.uuid);
            this.fetchNotes();
        }.bind(this));
    },
    handleArchive: function(item) {
        var note = new Note(item);
        var req = note.save({archived: true});
        console.info('NotesComponent: archiving note', item.uuid);
        req.done(function() {
            console.info('NotesComponent: archiving note done', item.uuid);
            this.fetchNotes();
        }.bind(this));
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
    panelDidOpen: function() {
        $("body").on('click.notes-component', function(evt) {
            var closest = $(evt.target).closest(this.getDOMNode());
            if (closest.length === 0) {
                this.setState({dropdown: false});
            }
        }.bind(this));
    },
    panelDidClose: function() {
        $("body").off('click.notes-component');
    },
    componentDidMount: function() {
        this.fetchNotes();
    },
    componentDidUnmount: function() {
        $("body").off('click.notes-component');
    },
    componentDidUpdate: function() {
        var body = $("body");
        if (this.state.dropdown) {
            this.repositionDropdown()
            this.refs.panel.focus();
        };
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

    fetchNotes: function() {
        console.info('NotesComponent: fetching notes', this.props.item);
        var self = this;
        var collection = new Notes();
        collection.item_uuid = this.props.item;
        var req = collection.fetch();
        req.done(function(notes) {
            console.info('NotesComponent: fetching notes done', notes);
            self.setState({notes: notes});
        });
    },
    toggleDropdown: function() {
        var dropdown = !this.state.dropdown;
        if (dropdown) {
            this.panelDidOpen();
        } else {
            this.panelDidClose();
        }
        this.setState({dropdown: dropdown});
    },
    render: function() {
        var classNames = ["notes-count"];
        var count = this.state.notes.length;
        console.info('NotesComponent: render', count);

        if (count > 0) {
            classNames.push('has-notes');
        }

        if (this.state.dropdown) {
            classNames.push('open');
        }

        return (
            <div className="notes-component">
                <a onClick={this.toggleDropdown} ref="counts" className={classNames.join(" ")}><i className="icon-comment"></i>{count}</a>
                {
                    this.state.dropdown ?
                    <NotesPanel
                        handleArchive={this.handleArchive}
                        handleUnarchive={this.handleUnarchive}
                        handleSave={this.handleSave}
                        ref="panel"
                        notes={this.state.notes} />
                    : ''
                }
            </div>
        );
    }
});
