var Backbone = require('backbone');

// We are overriding the error handler so the error response from admin UI
// gets parsed and set to responseData
Backbone.ajax = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    var error = args[0].error;
    args[0].error = function(xhr) {
        var contentType = xhr.getResponseHeader('content-type');
        if (contentType === 'application/json') {
            console.log('parsing JSON response');
            xhr.responseData = jQuery.parseJSON(xhr.responseText);
        }
        if (error) error(model, xhr, options);
        model.trigger('error', model, xhr, options);
    };

    return Backbone.$.ajax.apply(Backbone.$, args);
};

module.exports = Backbone.Model;