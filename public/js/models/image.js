var Backbone = require('backbone');
var _ = require('underscore');
var Model = require('./model');


var Img = module.exports = Model.extend({
    urlRoot: '/_/images',

    idAttribute: 'uuid',

    defaults: {},

    nameWithVersion: function() {
        return _.str.sprintf('%s %s', this.get('name'), this.get('version'));
    },

    activate: function(cb) {
        $.post(this.url() + "?action=activate", cb);
    },

    disable: function(cb) {
        $.post(this.url() + "?action=disable", cb);
    },

    enable: function(cb) {
        $.post(this.url() + "?action=enable", cb);
    },

    adminImport: function() {
        var url = this.url() + '?action=import';
        var ajax = $.ajax(url, {
            data: JSON.stringify(this.attributes),
            contentType: 'application/json',
            type: 'POST'
        });

        return ajax;
    },

    adminImportRemote: function() {
        var self = this;
        var source = this.collection.params.repository;
        $.ajax({
            url: _.str.sprintf('/_/images/%s?action=importRemote', this.get('uuid')),
            data: { source: source },
            type: 'POST',
            timeout: 180000 // 3 mins
        }).done(function(data) {
            var img = new Img(data);
            self.trigger('import:done', img);
        }).fail(function(xhr, statusText, b) {
            if (statusText === 'timeout') {
                self.trigger('import:error', { message: 'timeout'});
            } else {
                var error = JSON.parse(xhr.responseText);
                self.trigger('import:error', error);
            }
        });
    },

    toJSON: function() {
        var attrs = this.attributes;
        attrs.files = _.map(attrs.files, function(f) {
            if(f.size) {
                f.size_in_mb = _sizeToMB(f.size);
            }
            return f;
        });
        return attrs;
    }
});

function _sizeToMB(size) {
    return _.str.sprintf('%0.1f', size / 1024 / 1024);
}

