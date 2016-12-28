#!/usr/bin/env node
var uncss   = require('../lib/uncss.js'),
    program = require('commander'),
    fs      = require('fs'),

    options,
    callback;

/* Parse command line options */

program
  .version('0.1.0')
  .usage('[options] <file.html file.css ...>')
  .option('-m, --minify', 'Minify css output')
  .option('-o, --outfile <file>', 'Redirect output to <file>')
  .parse(process.argv);

if (program.args.length === 0) {
  program.help();
}

options = {
  minify: program.minify
};

if (program.outfile) {
  callback = (uncss)=> {
    fs.writeFile(options.outfile, uncss, (err)=> {
      if (err) {
        throw err;
      }
      console.log('uncss: wrote %s', options.outfile);
    });

  };

} else {
  callback = (uncss)=> {
    console.log(uncss)
  }
}

// uncss(css_files, html_files, options, callback);
uncss(program.args, options, callback);