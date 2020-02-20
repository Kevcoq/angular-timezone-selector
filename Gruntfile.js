'use strict'

var loader = require('csv-load-sync')

module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('./package.json'),
    'string-replace': {
      inline: {
        files: {
          'build/': 'angular-timezone-selector.js'
        }
      },
      options: {
        replacements: [
          {
            pattern: 'const zones = []',
            replacement: 'const zones = ' + JSON.stringify(loader('./data/zone.csv'))
          },
          {
            pattern: 'const codes = []',
            replacement: 'const codes = ' + JSON.stringify(loader('./data/cca2_to_country_name.csv'))
          }
        ]
      }
    },
    uglify: {
      dist: {
        files: {
          'dist/angular-timezone-selector.min.js': 'build/angular-timezone-selector.js'
        }
      }
    },
    less: {
      compileless: {
        options: {
          paths: ['./bower_components/bootstrap/less', './styling']
        },
        files: {
          './styling/angular-timezone-selector.css': './styling/bootstrap-chosen.less'
        }
      }
    },
    autoprefixer: {
      options: {
        browsers: ['last 3 versions', 'ie 8', 'ie 9', 'ie 10', 'ie 11']
      },
      prefix: {
        files: {
          './styling/angular-timezone-selector.css': './styling/angular-timezone-selector.css'
        }
      }
    },
    cssmin: {
      all: {
        expand: true,
        cwd: './styling/',
        src: ['*.css', '!*.min.css'],
        dest: './styling/',
        ext: '.min.css'
      }
    },

    copy: {
      dist: {
        src: 'build/angular-timezone-selector.js',
        dest: 'dist/angular-timezone-selector.js'
      },
      stylingCss: {
        expand: true,
        flatten: true,
        src: 'styling/*.css',
        dest: 'dist/'
      },
      stylingSprites: {
        expand: true,
        flatten: true,
        src: 'styling/*.png',
        dest: 'dist/'
      }
    }
  })

  grunt.loadNpmTasks('grunt-contrib-uglify-es')
  grunt.loadNpmTasks('grunt-contrib-copy')
  grunt.loadNpmTasks('grunt-string-replace')
  grunt.loadNpmTasks('grunt-contrib-cssmin')
  grunt.loadNpmTasks('grunt-contrib-less')
  grunt.loadNpmTasks('grunt-autoprefixer')
  grunt.registerTask('default', ['string-replace', 'uglify', 'less', 'autoprefixer', 'cssmin', 'copy'])
}
