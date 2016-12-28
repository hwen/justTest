(function () {
  "use strict";
  var compressor = require('csso'),
    fs = require('fs'),
    htmlparser = require('htmlparser'),
    parse_css = require('css-parse'),
    soupselect = require('soupselect').select,

    /* Member variables */
    callback,
    options,
    parsed_css;

  function rule_to_css(decl) {
    return decl.map(function (d) {
      return '\t' + d.property + ': ' + d.value + ';';
    }).join('\n') + '\n';
  }

  function on_htmlparse_complete(error, dom) {
    if (error) {
      throw error;
    } else {

      var i,
        minify,
        uncss = '',
        used_rules = parsed_css.stylesheet.rules.map((rule) => {

          if (rule.selectors) {
            var used_selectors = rule.selectors.filter((selector) => {
              return soupselect(dom, selector).length > 0;
            });

            if (used_selectors.length > 0) {
              //if have a selector
              return {
                'selectors': used_selectors,
                'declarations': rule.declarations
              };

            }
          }

          // selector is empty array or selector isn't a selector array (eg. a comment)
          return {};

        }).filter((rule) => {
          return rule.selectors !== undefined;
        });

      for (i = 0; i < used_rules.length; i++) {
        uncss += `${used_rules[i].selectors.join(', ')} {\n${rule_to_css(used_rules[i].declarations)}}\n`
      }

      // Compress css
      minify = options.minify || false;
      if (minify) {
        uncss = compressor.minify(uncss).css;
      }

      callback(uncss);
    }
  }

  module.exports = (files, opt, cb) => {

    var css_files,
        html_files,
        parser,
        parser_handler;    

    if (typeof opt === 'function') {
      options = {};
      callback = opt;
    } else if (typeof opt === 'object' && typeof cb === 'function') {
      options = opt;
      callback = cb;
    } else {
      throw 'TypeError: expected a callback';
    }

    /*
    * Replace the files with thier contents
    * first filter non-html/css files
    * then map the filename to its contents
    **/

    css_files = files.filter((file)=> {
      return (/\.css$/).test(file);
    }).map((file)=> {
      if (fs.existsSync(file)) {
        return fs.readFileSync(file);
      }

      throw `Error: Couldn't open ${file}`;
    });

    html_files = files.filter((file)=> {
      return (/\.html$/).test(file);
    }).map((file)=> {
      if (fs.existsSync(file)) {
        return fs.readFileSync(file);
      }

      throw `Error: Couldn't open ${file}`;
    });

    /* Concatenate all the stylesheets, and pass them to the css parser*/
    parsed_css = parse_css(css_files.join('\n'));

    /*Init the html parser, and feed it the concatenated html files (it works event if it isn't valid html) */
    parser_handler = new htmlparser.DefaultHandler(on_htmlparse_complete);
    parser = new htmlparser.Parser(parser_handler);
    parser.parseComplete(html_files.join('\n'));

  }

})();