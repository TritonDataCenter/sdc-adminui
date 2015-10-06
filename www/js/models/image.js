/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var _ = require('underscore');
var Model = require('./model');
var Job = require('./job');
var $ = require('jquery');


var Img = Model.extend({
    urlRoot: '/api/images',

    idAttribute: 'uuid',

    defaults: {},

    nameWithVersion: function() {
        return _.str.sprintf('%s %s', this.get('name'), this.get('version'));
    },

    activate: function(cb) {
        $.post(this.url() + "?action=activate", cb);
    },
    addAcl: function(acl) {
        var url = this.url() + '/acl?action=add';
        var ajax = $.ajax(url, {
            data: JSON.stringify(acl),
            contentType: 'application/json',
            type: 'POST'
        });
        return ajax;
    },
    removeAcl: function(acl) {
        var url = this.url() + '/acl?action=remove';
        var ajax = $.ajax(url, {
            data: JSON.stringify(acl),
            contentType: 'application/json',
            type: 'POST'
        });
        return ajax;
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

    adminImportRemote: function(callback) {
        var source = this.collection.params.repository;
        $.ajax({
            url: _.str.sprintf('/api/images/%s?action=importRemote', this.get('uuid')),
            data: { source: source },
            type: 'POST',
            timeout: 180000 // 3 mins
        }).done(function(data) {
            var job = new Job({ uuid: data.job_uuid });
            callback(null, job);
        }).fail(function(xhr, statusText, b) {
            var error = JSON.parse(xhr.responseText);
            callback(error);
        });
    },

    toJSON: function() {
        var attrs = this.attributes;
        var type = attrs.type;
        attrs.virt = type === 'docker' ? type : type === 'zvol' ? 'kvm' : 'container';
        attrs.files = _.map(attrs.files, function(f) {
            if (f.size) {
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



module.exports = Img;
