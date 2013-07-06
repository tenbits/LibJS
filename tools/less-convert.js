include.exports = {
	process: function(config){

		var src = config.src,
			files = new io.Directory().readFiles(src).files;


		files.forEach(function(file){

			file.read();

			file.uri.file = file.uri.getName() + '.css';

			file.write();

			console.log('write to', file.uri.toLocalFile());
		});


	}
}