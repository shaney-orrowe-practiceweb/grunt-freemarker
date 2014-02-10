/*
 * grunt-freemarker
 * https://github.com/liyi_nad/grunt-freemarker
 *
 * Copyright (c) 2014 ijse
 * Licensed under the MIT license.
 */

'use strict';

var spawn = require('child_process').spawn;
var iconv = require("iconv-lite");
var path = require("path");

var jarFile = path.join(__dirname, "../jar/FMtoll-0.5.jar");

//
// args:
//  data - data model
//  settings - include `encoding` and `viewFolder`
//  ftlFile - template file name
var processTemplate = function(args) {
  var dataModel = JSON.stringify(args.data);
  var settings = JSON.stringify(args.settings);
  var resultData = "";

  var cmd = spawn('java', ["-jar", jarFile,
      settings,
      args.ftlFile,
      dataModel ]);

  if(args.callback) {
    cmd.stdout.on("data", function(data) {
      // args.callback(null, iconv.decode(data, 'gbk'));
      resultData += iconv.decode(data, 'gbk');
    });
    cmd.stderr.on("data", function(data) {
      // Print error message
      console.log(iconv.decode(data, 'gbk'));
    });
    cmd.stdout.on("end", function() {
      args.callback(null, resultData);
    });
  }
};

module.exports = function(grunt) {

  grunt.registerMultiTask('freemarker', 'Freemarker renderer plugin for grunt.', function() {

    var done = this.async();

    // Defaults options.
    var options = this.options({
      views: "views",
      encoding: "utf-8"
    });

    // Iterate over all specified file groups.
    this.files.forEach(function(f) {

        f.src.filter(function(filepath) {
          // Warn on and remove invalid source files (if nonull was set).
          if (!grunt.file.exists(filepath)) {
            grunt.log.warn('Mock file "' + filepath + '" not found.');
            return false;
          } else {
            return true;
          }
        }).map(function(filepath) {
          // Load the mock
          var tMock = require(path.resolve(filepath));

          // Get results
          processTemplate({
            data: tMock.data,
            settings: {
              encoding: options.encoding,
              viewFolder: path.resolve(options.views)
            },
            ftlFile: tMock.view,
            callback: function(err, result) {
              if(err) {
                grunt.log.warn('Process Mock file' + filepath + '" error!');
                done(false);
              }

              // Write to file
              grunt.file.write(f.dest, result);
              grunt.log.writeln('File "' + f.dest + '" created.');
              done(true);
            }
          });

        });

      });
  });

};
