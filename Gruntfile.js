module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		uglify: {
			options: {
				compress: {
					drop_console: true
				},
				banner: "(function() {",
				footer: "})()"
			},
			dist: {
				files: {
					"dist/ansi-min.js": [
						'src/ansi.js',
						'src/ansi_parser.js',
						'src/textmode.js',
						'src/characterset-cp437.js'
					]
				}
			}
		},
		concat: {
			dist: {
				src: [
					'src/ansi.js',
					'src/ansi_parser.js',
					'src/textmode.js',
					'src/characterset-cp437.js'
				],
				dest: 'dist/ansi.js',
				options: {
					banner: "(function() {\r\n",
					footer: "})()"
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');

}