define({
    normalize: function(name, normalize) {
        return name;
    },
    load: function (name, req, load, config) {
        //req has the same API as require().
        var p = null;
        if (name.indexOf('.html') !== -1) {
            p = 'tpl/' + name;
        } else {
            p = 'tpl/' + name + '.html';
        }

        req(['text!' + p], function (value) {
            load(value);
        });
    }
});