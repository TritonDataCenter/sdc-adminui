var Backbone = require('backbone');
var PaginationTpl = require('../tpl/pagination.hbs');
var _ = require('underscore');

module.exports = Backbone.Marionette.ItemView.extend({
    template: PaginationTpl,
    events: {
        'click a.next-page': 'nextResultPage',
        'click a.previous-page': 'previousResultPage',
        'click a.orderUpdate': 'updateSortBy',
        'click a.last-page': 'gotoLast',
        'click a.first-page': 'gotoFirst',
        'click a.page': 'gotoPage',
        'click .page-size a': 'changeCount'
    },
    initialize: function (options) {
        options = options || {};
        this.collection.on('reset', this.render, this);
        this.collection.on('change', this.render, this);
    },
    updateSortBy: function (e) {
        e.preventDefault();
        var currentSort = $('setSorting').val();
        this.collection.setSorting(currentSort);
    },
    nextResultPage: function (e) {
        e.preventDefault();
        this.collection.getNextPage();
    },
    previousResultPage: function (e) {
        e.preventDefault();
        this.collection.getPreviousPage();
    },
    gotoFirst: function (e) {
        e.preventDefault();
        this.collection.getFirstPage();
    },
    gotoLast: function (e) {
        e.preventDefault();
        this.collection.getLastPage();
    },
    gotoPage: function (e) {
        e.preventDefault();
        var page = $(e.target).text();
        this.collection.getPage(page);
    },
    changeCount: function (e) {
        e.preventDefault();
        var per = $(e.target).text();
        this.collection.setPageSize(parseInt(per, 10));
    },
    serializeData: function() {
        var data = Backbone.Marionette.ItemView.prototype.serializeData.apply(this, arguments);
        data = _.extend(data, this.collection.state);
        return data;
    }
});