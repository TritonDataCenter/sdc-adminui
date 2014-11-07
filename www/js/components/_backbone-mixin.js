/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var BackboneMixin =  {
    componentDidMount: function() {
    // Whenever there may be a change in the Backbone data, trigger a reconcile.
        this.getBackboneModels().forEach(function(model) {
            model.on('add change remove', this.forceUpdate.bind(this, null), this);
        }, this);
    },

    componentWillUnmount: function() {
        // Ensure that we clean up any dangling references when the component is
        // destroyed.
        this.getBackboneModels().forEach(function(model) {
            model.off(null, null, this);
        }, this);
    }
};

module.exports = BackboneMixin;
