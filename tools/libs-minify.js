include
.js({
	script: 'io/middleware/uglify::Uglify'
})
.load('../build.js')
.done(function(resp){
	
	
	function isCopied(filename, paths) {
		filename = filename.toLowerCase();
		
		return ruqq.arr.any(paths, function(x){
			return x.substring(x.length - filename.length).toLowerCase() === filename;
		});
	}
	
	include.exports = {
		process: function(config, done){
			
			eval(resp.load.build);
			
			var copied = Object.keys(global.config.libs[0].files);
			
			var files = new io.Directory().readFiles('/libs/*/**.js').files;
			
			
			files = files.filter(function(file){
				if (~file.uri.file.indexOf('.min.')){
					return false;
				}
				
				var _file = file.uri.file.replace('.js', '.min.js');
				
				
				return !isCopied(_file, copied);
			});
			
			
			
			
			files.forEach(function(file){
				console.warn(file.uri.file);
				
				file.read();
				
				resp.Uglify(file, { minify: true });
				
				file.uri.file = file.uri.file.replace('.js', '.min.js');
				file.write(file.content);
			});
			
			
			done();
		}
	};

});