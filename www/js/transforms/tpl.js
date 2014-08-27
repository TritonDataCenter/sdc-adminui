/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

"use strict";
var through = require('through');
var Handlebars = require("handlebars");
var underscore = require("underscore");

module.exports = function(file) {
    if (/\.hbs/.test(file)) {
        return _hbs(file);
    }
    if (/\.html/.test(file)) {
        return _underscore(file);
    }

    return through();
};

function _underscore(file) {
    var buffer = "";

    return through(
        function(chunk) {
            buffer += chunk.toString();
        },
        function() {
            var source = underscore.template(buffer).source;
            var compiled = "module.exports = " + source.toString() + ";\n";
            this.queue(compiled);
            this.queue(null);
        }
    );
}

function _hbs(file) {
    var buffer = "";

    return through(
        function(chunk) {
            buffer += chunk.toString();
        },
        function() {
            var js = Handlebars.precompile(buffer);
            // Compile only with the runtime dependency.
            var compiled = "var Handlebars = require('handlebars');\n";
            compiled += "module.exports = Handlebars.template(" + js.toString() + ");\n";
            this.queue(compiled);
            this.queue(null);
        }
    );
}
