/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var Backbone = require('backbone');
var Bloodhound = require('bloodhound');

var Image = require('../models/image');

var ImageTypeaheadTpl = require('../tpl/typeahead-image.hbs');
var ImageTypeaheadView = Backbone.Marionette.View.extend({
    events: {
        'typeahead:selected': 'onTypeaheadSelect',
        'typeahead:opened': 'onOpened',
        'typeahead:closed': 'onTypeaheadClosed'
    },

    template: ImageTypeaheadTpl,

    clearField: function () {
        process.nextTick(function () {
            this.trigger('selected', null);
            this.$el.val('');
        }.bind(this));
    },

    onOpened: function () {
        this.selectedImage = null;
        this.trigger('selected', null);
    },

    onTypeaheadSelect: function (e, datum) {
        console.debug('typeahead selected', e, datum);
        this.selectedImage = datum.model;
        this.$el.tooltip('destroy');
        this.trigger('selected', datum.model);
    },

    onTypeaheadClosed: function () {
        var $field = this.$el;

        if (this.selectedImage && $field.val() === this.selectedImage.get('uuid')) {
            return;
        }

        if ($field.val().length !== 36) {
            this.clearField();
        }
    },

    initializeEngine: function () {
        this.engine = new Bloodhound({
            name: 'images',
            remote: {
                url: '/api/images?q=%QUERY',
                ajax: {
                    beforeSend: function (xhr) {
                        var token = !this.headers['x-adminui-token'] && app.user && app.user.getToken();
                        if (token) {
                            xhr.setRequestHeader('x-adminui-token', token);
                        }
                    }
                },
                filter: function (images) {
                    var datums = images.fullCollection.map(function (img) {
                        var model = new Image(img);
                        var image = model.toJSON();
                        var tokens = [image.uuid, image.name];
                        if (image.billing_tags && Array.isArray(image.billing_tags)) {
                            image.billing_tags.forEach(function (tag) {
                                tokens.push(tag);
                            });
                        }
                        var tags = image.tags;
                        if (tags && typeof tags === 'object') {
                            Object.keys(tags).forEach(function (key) {
                                tokens.push(key + ':' + tags[key]);
                            });
                        }
                        return {
                            model: model,
                            uuid: image.uuid,
                            tokens: tokens,
                            name: image.name,
                            version: image.version,
                            tags: Object.keys(image.tags || {}).join(', '),
                            os: image.os,
                            virt: image.virt
                        };
                    });
                    return datums;
                }
            },
            datumTokenizer: function (datum) {
                return datum.tokens;
            },
            sorter: function (a, b) {
                return a.name.localeCompare(b.name) === 0 ? -a.version.localeCompare(b.version) : a.name.localeCompare(b.name);
            },
            queryTokenizer: function (query) {
                return Bloodhound.tokenizers.whitespace(query);
            },
            limit: 30
        });

        this.engine.initialize();
        this.renderInput();
    },

    showLoading: function () {
        if (this.$el.parent().parent().find('.tt-loading').length) {
            this.$el.parent().parent().find(".tt-loading").show();
        } else {
            this.$el.parent().after("<div class='tt-loading'>Loading</div>");
        }
    },

    hideLoading: function () {
        this.$el.parent().parent().find(".tt-loading").hide();
    },
    renderInput: function () {
        var self = this;
        var substringMatcher = function (strs, property) {
            return function findMatches(q, cb) {
                var matches = [];
                var substrRegex = new RegExp(q, 'i');
                strs.forEach(function (str) {
                    if (substrRegex.test(property ? str[property] : str.toString())) {
                        matches.push(str);
                    }
                });

                cb(matches.sort(self.engine.sorter).slice(0, self.engine.limit));
            };
        };

        this.$el.typeahead({
            name: 'images',
            minLength: 3,
            highlight: true
        },
        {
            displayKey: 'uuid',
            name: 'images',
            source: this.engine.ttAdapter(),
            templates: {
                suggestion: ImageTypeaheadTpl
            }
        });
    },

    render: function () {
        this.initializeEngine();
    }
});

module.exports = ImageTypeaheadView;
