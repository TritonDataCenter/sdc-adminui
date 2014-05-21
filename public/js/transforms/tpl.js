var through = require('through');
var Handlebars = require("handlebars");
var underscore = require("underscore");

module.exports = function(file) {
    if (/\.hbs/.test(file)) return _hbs(file);
    if (/\.html/.test(file)) return _underscore(file);

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
