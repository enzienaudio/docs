module.exports = function(grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    copy: {
      build: {
        cwd: 'static/',
        src: ['**/*'],
        dest: 'build/',
        expand: true
      }
    },

    browserify: {
      dev: {
        files : {
          'build/js/main.min.js' : ['src/js/**/*.js']
        }
      }
    },

    uglify: {
      options: {
        sourceMap : true
      },
      build: {
        src: "build/js/main.min.js",
        dest: "build/js/main.min.js"
      }
    },

    sass: {
      compile: {
        options: {
          style: 'compressed'
        },
        files: {
          'build/css/main.min.css' : 'src/scss/style.scss'
        }
      }
    },

    assemble: {
      options: {
        plugins: ['assemble-markdown-pages'],
        layout: 'src/content/layout.hbs',
        markdownPages: {
          src: ['src/content/docs/*.md'],
          dest: 'build/docs/'
        }
      },
      build: {
        cwd: 'src/content/root/',
        expand: true,
        src: '*.hbs',
        dest: 'build/'
      }
    },

    execute: {
      buildIndex: {
        options : {
          args : ['src=/build/docs', 'dest=/build/index.html', 'index_template=src/index/index.hbs']
        },
        src : "buildIndex.js"
      }
    },

    'http-server': {
      dev: {
        root: 'build/',
        port: 8080,
        host: "0.0.0.0",
        showDir: true,
        ext: "html",
        runInBackground: true
      }
    },

    open: {
      all: {
        path: 'http://localhost:8080/'
      }
    },

    watch: {
      static: {
        files: ['static/*.*'],
        tasks: ['copy'],
      },
      templates: {
        files: ['src/**/*.hbs'],
        tasks: ['build'],
      },
      markdown: {
        files: ['src/content/docs/*.md'],
        tasks: ['build'],
      },
      js: {
        files: ['src/js/**/*.*'],
        tasks: ['browserify']
      },
      sass: {
        files: ['src/scss/**/*.*'],
        tasks: ['sass']
      },
      options: {
        livereload: true
      }
    },

    clean: {
      src: ['build/']
    }

  });

  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  grunt.registerTask('default', ['build']);
  grunt.registerTask('build', ['clean', 'copy', 'assemble', 'buildIndex', 'browserify', 'uglify', 'sass']);
  grunt.registerTask('buildIndex', ['execute:buildIndex']);
  grunt.registerTask('serve', ['http-server', 'open', 'watch']);
}