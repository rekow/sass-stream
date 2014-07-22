#sass-stream
Streaming interface for node-sass - supports `.sass` files.

##Installation
Add to your `devDependencies`:
```javascript
  "dependencies": {...},
  "devDependencies": {
    "sass-stream": "~0.1.2"
  },
  ...
```
or install directly:
```javascript
npm install --save-dev sass-stream
```

then import in your build script:
```javascript
var sass = require('sass-stream');
```

##Usage
As a simple streaming compiler:
```javascript
var sass = require('sass-stream'),
  fs = require('fs');

// As an intermediary step in a flow
fs.createReadStream('path/to/scss/src')
  .pipe(sass())
  .pipe(fs.createWriteStream('path/to/styles.css'));

// As the terminus in a flow
fs.createReadStream('path/to/sass/src')
  .pipe(sass({
    output: 'path/to/styles.css'
  }));
```

##Javascript API

```javascript
var writableStream = sass(options);
```
`options` is an optional object with four optional properties:
- `main` - pass a path relative
- `output` - a filename to additionally write output to.
- `compileOptions` - a map of options to pass to [node-sass](https://www.npmjs.org/package/node-sass).

Returns a `Writable` stream.

##Command Line API

```
node_modules/.bin/sass-stream path/to/sass/or/scss --main main.sass --output path/to/css/directory --outputStyle=compressed...
```
The main argument, the path to sass source, can be a directory or file. `--main` accepts a path (relative to the sass source path) to indicate the main sass file, while `--output` is the target compile directory.

For compilation options, pass `optionName=value` - these will be passed directly to node-sass. For options with array values (e.g. `includePaths`) pass each possibility as a value and they will be gathered: `--includePaths=path/to/includes/dir --includePaths=path/to/other/includes/dir`. See the [node-sass](https://www.npmjs.org/package/node-sass) docs for more details on compile-time options.

##TODO
Sourcemaps.