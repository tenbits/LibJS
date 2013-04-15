include //
//.load('preview.mask::Template') //
.css('preview.css') //
.done(function(resp) {

	var _window, _document, _body, _iframe, _style;

	var Window = (function() {

		return {
			init: function(iframe, preview) {
				if (({}).__proto__ != null && 0) {
					_window = iframe.contentWindow;
					_window.Function.prototype.apply.prototype = Function.prototype.apply.bind(Function);
					_window.Function.prototype.call = Function.prototype.call.bind(Function);

					Object.extend(_window, {
						Class: Class,
						Compo: Compo,
						mask: mask,
						include: include.instance(),
						ruqq: ruqq,
						Object: Object
					});
				} else {
					_window = window;

				}

				if (iframe) {
					_document = iframe.contentDocument || iframe.contentWindow.contentDocument;
					_document.open();
					_document.write('<html><head><style></style><style>body{font-family:sans-serif;}</style></head><body></body></html>');
					_document.close();
					_style = _document.getElementsByTagName('style')[0];
				} else {
					_document = {
						body: preview.$.find('#preview-container')[0]
					};
					_style = preview.$.find('style')[0]
				}

				window.D = _document;

			},

			eval: function(code) {
				_window.eval(code);
			},
			reload: function() {
				if (_window == window) {
					return;
				}
				_window.location = 'about:blank';
			},
			setStyle: function(preview, style) {
				if (preview._style == style && _window == window) {
					return;
				}

				_style.innerHTML = preview._style = style;
			},
			setCode: function(preview, code) {
				if (preview._code == code && _window == window) {
					return;
				}

				if (_window.dispose instanceof Function) {
					try {
						_window.dispose();
					} catch (error) {
						console.error('dispose:', error.toString());
					}
				}

				_window.eval(code);

				preview._code = code;
			},
			setTemplate: function(preview, template) {
				if (preview._compo) {
					preview._compo.remove();
				}

				preview._template = template;

				preview._compo = Compo.initialize(Compo({
					attr: {
						template: template
					}
				}), _window.model || {}, null, _document.body);
			},

			setHTML: function(preview, template) {


				var div = document.createElement('div');
				div.appendChild(mask.render(template, _window.model));

				_document.body.innerHTML = '<pre><code></code></pre>';

				var $code = _document.body.getElementsByTagName('code')[0],
					html = style_html(div.innerHTML);


				$code.textContent = html;

			},
			setModel: function(preview, model) {
				_window.model = _window.eval('(' + model + ')');
			}
		};

	}());



	mask.registerHandler('preview', Compo({
		constructor: function() {
			this.compos = {
				$notification: '$: .notification',
				$btnHTML: '$: #btnHTML'
			};
		},
		events: {
			'click: #btnHTML': function() {
				this.asHTML = this.compos.$btnHTML.toggleClass('active').hasClass('active');

				this.update({
					javascript: this._code,
					style: this._style,
					mask: this._template,
					model: this._model
				});
			}
		},
		slots: {
			domInsert: function(){
				Window.init(_iframe = this.$.find('iframe')[0], this);
			}
		},
		onRenderStart: function(model, cntx, container) {

			this.tagName = 'div';
			this.nodes = mask.compile('.notification; style type="text/css";div#preview-container; button#btnHTML > "HTML"');
		},
		onRenderEnd: function(){
			//Window.init(_iframe = this.$.find('iframe')[0], this);
		},
		prepair: function(code, style, template, callback) {

			if (_document) {

				if (code || template) {
					_document.body.innerHTML = '';
				}

				if (_window == window) {
					callback && callback();
					return;

				}

			}


			/**
			 *	This all is about reloading iframe for dropping all older javascript,
			 *	this is good to prevent any collisions with new code
			 */
			Window.reload();

			setTimeout(function() {
				Window.init(_iframe);
				callback && callback();
			});
		},
		resolveHTML: function() {

		},
		update: function(source) {

			var code = source.javascript,
				style = source.style,
				template = source.mask,
				model = source.model;

			this.prepair(code, style, template, function() {

				var error;

				try {


					if (template && this.asHTML) {
						code && Window.setCode(this, code);

						Window.setHTML(this, template);

						this._style = style;
						this._template = template;
						return;
					}


					if (model || code || template) {

						model && Window.setModel(this, model)
						code && Window.setCode(this, code);

						Window.setTemplate(this, template || this._template);

					}

					style && Window.setStyle(this, style);


				} catch (err) {
					error = err;
				}

				this.notify(error);
			}.bind(this));
		},

		notify: function(error) {
			error && console.error(error.toString());

			var klass = error ? 'red' : 'green',
				$notification = this.compos.$notification;

			clearTimeout(this.timeout);

			$notification.removeClass('red green').addClass(klass);


			this.timeout = setTimeout(function() {
				$notification.removeClass(klass);
			}, 1000);
		}
	}));



});
