include.routes({
	component: '/script/{0}/{1}.js',
	vendor: '/.reference/libjs/vendor-lib/{0}/{1}.js',
	script: '/script/{0}.js'
}) //
.instance().js({
	ruqq: ['dom/jquery', 'utils', 'arr', 'es5shim'],
	lib: ['mask', 'compo','ranimate', 'mask/formatter'],
	component: ['preview', 'tabs', 'dropdownMenu', 'shortend-dialog'],
	vendor: 'keymaster',
	script: ['urlcode']
}) //
.ready(function(resp) {


	var App = Compo({
		attr: {
			template: document.getElementById('layout').innerHTML
		},
		compos: {
			preview: 'compo: preview',
			tabs: 'compo: tabs',
			/////ddMenu: 'compo: dropdownMenu',
			btnSetLink: '$: #setLink',
			btnShortend: '$: #getShortend'
		}
	});

	window.app = Compo.initialize(App,{
		presets: resp.presets
	}, null, document.body);


	window.editors = {};

	function createEditor(type, highlight) {
		editors[type] = ace.edit('editor-' + type);
		editors[type].setTheme("ace/theme/monokai");
		editors[type].getSession().setMode("ace/mode/" + (highlight || type));
	}

	createEditor('html');

	/** SETUP */

	(function() {



		var editors = window.editors,
			preview = app.compos.preview,
			deferredTimer,
			types;

		function getSource(type) {
			return editors[type].getValue();
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
			preview.update(source.html);
		}

		////function setValue(editor, string) {
		////	var doc = new(editor.getSession().getDocument().constructor)(string);
		////
		////	editor.setSession(doc);
		////}

		function setValues(source){
			for (var key in editors) {
				if (!source[key]){
					continue;
				}
				editors[key].setValue(source[key], 1);
			}
			editors[app.compos.tabs.current()].focus();
		}

		var command = {
			name: "nextTab",
			bindKey: {
				mac: "Shift-Tab",
				win: "Shift-Tab"
			},
			exec: app.compos.tabs.next
		}

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

		//app.compos.ddMenu.$.on('selected', function(event, id) {
		//	setValues(ruqq.arr.first(resp.presets, 'id', '==', id));
		//});

		var code = UrlCode.parse();
		if (code){
			setValues(code);
		}

		app.compos.btnSetLink.on('click', function(){
			UrlCode.set(getSource('html'));
		});

		app.compos.btnShortend.on('click', function(){
			UrlCode.set(getSource('html'));
			window.compo.shortendDialog.show().process(window.location.toString());
		});

	}());

	window.app = app;
});
