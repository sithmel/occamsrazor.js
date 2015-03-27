module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    qunit: {
      files: ['tests/**/*.html']
    },
    release: {
      options: {
        additionalFiles: ['bower.json']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-release');

  grunt.registerTask('test', ['qunit']);

};
