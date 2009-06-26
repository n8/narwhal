/*global Jaxer */
/*jslint evil:true */
(function (evalGlobal) {
    var prefix = "/opt/narwhal"; // TODO: Make this configurable
    function read(path) { return Jaxer.File.read(path); }
    eval(read(prefix + "/narwhal.js"))({
        global: this,
        evalGlobal: evalGlobal,
        platform: 'jaxer',
        platforms: ['jaxer', 'default'],
        print: Jaxer.Log.info,
        evaluate: function (text, fileName) {
            // TODO maybe something better here:
            return Jaxer.Includer.evalOn(
                "(function(require,exports,module,system,print){" + text + "/**/\n})",
                this,
                fileName);
        },
        fs: {
            read: read,
            isFile: Jaxer.File.exists
        },
        prefix: prefix
    });
}).call(this, function () { return eval(arguments[0]); });
