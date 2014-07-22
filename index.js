var fs = require('fs'),
    path = require('path'),
    stream = require('stream'),
    through2 = require('through2'),
    sass = require('node-sass'),
    matchers = {
        mixin: /(^\s*)=(\s*)/,
        include: /(^\s*)\+(\s*)/,
        indent: /^[\s\t]+/,
        whitespace: /^[\n\s]*$/
    },
    spliceContent,
    toSCSS;

spliceContent = function (content, src, delimiter) {
    var parts = src.split(delimiter);
    parts[0] = parts[0] + content;
    return parts.join(delimiter);
};

toSCSS = function (sassSrc) {
    var lines = sassSrc.split('\n').filter(function (line) {
        return !(matchers.whitespace.test(line));
    }).map(function (line) {
        var indent = line.match(matchers.indent);

        line = line.replace(matchers.include, function (_, before, after) {
            return before + '@include' + (after ? after : ' ');
        }).replace(matchers.mixin, function (_, before, after) {
            return before + '@mixin' + (after ? after : ' ');
        });

        return {
            indent: indent ? indent[0].length : 0,
            src: line
        };
    });

    return lines.map(function (line, i) {
        var _i = i + 1,
            _line = lines[_i],
            blockEndI;

        while (line && _line && _line.indent > line.indent) {
            blockEndI = _i++;
            _line = lines[_i];
        }

        if (blockEndI) {
            line.src = spliceContent(' {', line.src, '//');
            lines[blockEndI].src = spliceContent('\n} ', lines[blockEndI].src, '//');
        } else {
            line.src = spliceContent(';', line.src, '\n}');
        }

        return line.src;
    }).join('\n');
};

module.exports = function (opts) {
    var scssFiles = [],
        fileMap = {},
        proxy = new stream.PassThrough(),
        compileOpts = opts.compileOptions || {},
        transform;

    transform = through2.obj(function (file, enc, cb) {
        var moduleName, scss;

        // Handle single-file input, e.g. fs.createReadStream
        if (file instanceof Buffer) {
            file = {
                contents: file
            };
        }

        if (!file || file.contents == null) {
            this.push(file);
            return cb();
        }

        if (file instanceof stream.Stream) {
            console.error('Streams are not supported as source files.');
            return cb();
        }

        // Extract sass module name to use in resolving dependency graph
        if (file.base && path.extname(file.relative) === '.sass') {

            if (!opts.sassRoot) {
                console.error('sassRoot must be provided when compiling sass source.');
            }

            moduleName = path.resolve(file.base, file.relative)
                .split(path.delimiter(file.base))
                .slice(opts.sassRoot.split(path.delimiter(opts.sassRoot)).length)
                .join(path.delimiter(file.base))
                .split('.')
                .shift();

            scss = toSCSS(file.contents.toString())

            fileMap[moduleName] = 

        }

        scssFiles.push(toSCSS(file.contents.toString()));
        cb();

    }, function (cb) {
        var scss = scssFiles.join('\n'),
            css;

        if (opts.compile === false) {
            proxy.end(scss);
        } else {
            compileOpts.data = scss;
            css = sass.renderSync(compileOpts);

            if (opts.output) {
                fs.createWriteStream(opts.output).end(css);
            }
            proxy.end(css);
        }
    });

    transform.pipe = function () {
        return proxy.pipe.apply(proxy, arguments);
    };

    return transform;
}