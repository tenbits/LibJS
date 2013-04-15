include.routes({
	component: '/script/{0}/{1}.js',
	vendor: '/.reference/libjs/vendor-lib/{0}/{1}.js',
	script: '/script/{0}.js'
}) //
.instance().js({
	ruqq: ['dom/jquery', 'utils', 'arr', 'es5shim'],
	lib: ['mask', 'ranimate', 'mask.animation'],
	component: ['preview', 'tabs', 'dropdownMenu', 'shortend-dialog'],
	compo: ['datePicker'],
	vendor: 'keymaster',
	script: ['presets', 'urlcode']
}) //
.ready(function(resp) {


	var App = Compo({
		attr: {
			template: document.getElementById('layout').innerHTML
		},
		compos: {
			preview: 'compo: preview',
			tabs: 'compo: tabs',
			ddMenu: 'compo: dropdownMenu',
			btnSetLink: '$: #setLink',
			btnShortend: '$: #getShortend'
		}
	});

	window.app = Compo.initialize(App, {
		presets: resp.presets
	}, document.body);


	window.editors = {};

	function createEditor(type, highlight) {
		editors[type] = ace.edit('editor-' + type);
		editors[type].setTheme("ace/theme/monokai");
		editors[type].getSession().setMode("ace/mode/" + (highlight || type));
	}

	createEditor('mask', 'javascript');
	createEditor('model', 'javascript');
	createEditor('javascript');
	createEditor('style', 'css');

	/** SETUP */

	(function() {



		var editors = window.editors,
			preview = app.compos.preview,
			deferredTimer,
			types;

		function getSource(type) {
			return editors[type].getValue();
		}

		function collectSource(){
			var source = {};
			for(var type in editors){
				source[type] = editors[type].getValue();
			}
			return source;
		}

		////function deferUpdate() {
		////	clearTimeout(deferredTimer);
		////	deferredTimer = setTimeout(update, 400);
		////}

		function deferUpdate(type){
			if (types && !types.push){
				debugger;
			}

			types = types ? types.concat([type]) : [type];

			cancelAnimationFrame(deferredTimer);
			deferredTimer = requestAnimationFrame(update);
		}

		function update() {
			if (types == null){
				return;
			}

			var source = {};
			for(var i = 0, x, length = types.length; i < length; i++){
				x = types[i];
				source[x] = getSource(x);
			}
			types = null;
			preview.update(source);
		}


		function setValues(source, keepOnEmpty){
			for (var key in editors) {
				if (!source[key] && keepOnEmpty){
					continue;
				}
				editors[key].setValue(source[key], 1);
			}
			editors[app.compos.tabs.current()].focus();
		}

		function getPreset(name) {
			return ruqq.arr.first(resp.presets, function(x){
				return x.title.toLowerCase() === name.toLowerCase();
			});
		}

		var command = {
			name: "nextTab",
			bindKey: {
				mac: "Shift-Tab",
				win: "Shift-Tab"
			},
			exec: app.compos.tabs.next
		};

		for (var x in editors) {
			editors[x].on('change', deferUpdate.bind(this, x));
			editors[x].commands.addCommand(command);
			editors[x].setHighlightActiveLine(false);
			editors[x].setShowPrintMargin(false);
		}

		key('shift+tab', function(e) {
			app.compos.tabs.next();
			e.preventDefault();
			return false;
		});

		app.compos.ddMenu.$.on('selected', function(event, id) {
			setValues(ruqq.arr.first(resp.presets, 'id', '==', id));
		});

		var code = UrlCode.parse();

		if (code && code.preset) {
			code = getPreset(code.preset);
		}

		if (code){
			setValues(code);
		}else{
			setValues(resp.presets[2]);
		}

		app.compos.btnSetLink.on('click', function(){
			UrlCode.set(collectSource());
		});

		app.compos.btnShortend.on('click', function(){
			UrlCode.set(collectSource());
			window.compo.shortendDialog.show().process(window.location.toString());
		});

	}());

	window.app = app;
});
