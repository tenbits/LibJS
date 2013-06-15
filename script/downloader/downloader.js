include //
.js('Libraries.js') //
.load('downloader.mask::Template') //
.css('downloader.css') //
.done(function(resp){

	var Libraries = resp.Libraries,
		Singleton;

	mask.registerHandler(':downloader', Compo({
		template: resp.load.Template,

		constructor: function(){
			Singleton = this;
		},
		compos: {
			download: 'a#download-link'
		},
		
		slots: {
			download: function(event){
				//event.preventDefault();
				//event.stopPropagation();
				
				this.slotState('download', false);
				this.download();
			}
		},
		//pipes: {
		//
		//},
		//constructor: function(){
		//
		//},

        onRenderStart: function(model, cntx, container){
            this.model = Libraries;
			
			
        },
        onRenderEnd: function(elements, cntx, container){
            
        },
		
		download: function(){
			
			
			var source = this.source.generate(this);
			
			this.compos.download.href = 'data:application/octet-stream;charset=utf-8,' + encodeURIComponent(source);
			this.compos.download.click();
			
			this.slotState('download', true);
		},
		
		initialize: function(){
			if (this.source) {
				return;
			}
			
			window.app.find(':pageActivity').show();
			
			this.$.hide();
			this.source = new Source().load().done(function(){
				
				window.app.find(':pageActivity').hide();
				stats(this);
				
				this.$.show();
				
				observe_enabledStatus();
				Object.observe(this.model, 'env', stats);
				Object.observe(Libraries, 'compression', stats);
			}.bind(this));
				
			
		}
	}));

	var Source = Class({
		Extends: Class.Deferred,
		load: function(libs){
			
			var array = getPaths();
			
			array.push('/libs/wrapper.js::Wrapper');
			array.push('/libs/exports-globals.js::ExpGlobals');
			array.push('/libs/exports-namespace.js::ExpNamespace');
			array.push('/libs/exports-common.js::ExpCommon');
			
			include.instance().load(array).done(function(resp){
				this.libs = resp.load;
				this.resolve(this.libs);
			}.bind(this));
			
			return this;
		},
		
		generate: function($controller){
			var wrapper = this.libs.Wrapper,
				exports;
				
			if ($controller.$.find('#exports-globals').is(':checked')) {
				exports = this.libs.ExpGlobals;
			}
			if (!exports && $controller.$.find('#exports-namespace').is(':checked')) {
				exports = this.libs.ExpNamespace;
			}
			if (!exports && $controller.$.find('#exports-common').is(':checked')) {
				exports = this.libs.ExpCommon;
			}
			
			
			
			var	Min = Libraries.compression === 'min' ? 'Min' : '',
				libs = ruqq.arr.aggr(getLibs(), [], function(lib, aggr){
				
					var source = this.libs[lib.name + Min];
					
					if (!source) {
						debugger;
					}
					
					aggr.push(source);
				}.bind(this)).join('\n\n');
			
			
			wrapper = wrapper.replace('%EXPORTS%', exports)
			
			if (exports === this.libs.ExpNamespace) {
				wrapper = wrapper.replace('%NAMESPACE%', Libraries.namespace);
			}
			
			wrapper = wrapper.replace('%LIBS%', function(){ return libs } );
			
			return wrapper;
		}
		
	});
	
	
	function getLibs(libs) {
		return ruqq.arr.aggr(libs || Libraries.libs, [], function(lib, aggr){
			
			if (lib.env !== Libraries.env && lib.env !== 'both' ) 
				return aggr;
			
			if (lib.enabled === false) 
				return aggr;
			
			aggr.push(lib);
			
			if (lib.modules) 
				return aggr.concat(getLibs(lib.modules));
			
			return aggr;
		});
	}
	
	function getPaths(libs) {
		return ruqq.arr.aggr(libs || Libraries.libs, [], function(x, aggr){
			var lib = '/libs/' + x.file + '::' + x.name,
				libmin = '/libs/' + x.file.replace('.js', '.min.js') + '::' + x.name + 'Min';
				
			
			
			if (x.modules) {
				aggr = aggr.concat(getPaths(x.modules));
			}
				
			return aggr.concat([lib, libmin]);
		});
	}
	
	
	function observe_enabledStatus(libs) {
		ruqq.arr.each(libs || Libraries.libs, function(lib){
			Object.observe(lib, 'enabled', stats);
			
			if (lib.modules)
				observe_enabledStatus(lib.modules);
		});
	}
	
	
	function stats(){
		var libs = Singleton.source.libs,
			size = 0,
			Min = Libraries.compression === 'min' ? 'Min' : '';
		
		ruqq.arr.each(getLibs(), function(lib){
			size += libs[lib.name + Min].length;
		});
		
		
		Libraries.size = size / 1024 << 0;
	};
	

	
});
