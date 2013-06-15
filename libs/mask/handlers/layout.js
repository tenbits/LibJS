(function(root) {

	var mask = root.mask,
		tag_CONTENT = '@content',
		tag_PLACEHOLDER = '@placeholder',
		tag_PLACEHOLDER_ELSE = '@else',
		tag_layout_VIEW = 'layout:view',
		tag_layout_MASTER = 'layout:master',
		_masters = {};

	function Master() {}
	Master.prototype = {
		constructor: Master,
		render: function() {
			_masters[this.attr.id] = this;
		}
	};

	mask.registerHandler(tag_layout_MASTER, Master);


	function View() {}
	View.prototype = {
		constructor: View,
		renderStart: function() {
			var masterLayout = _masters[this.attr.master];

			// if DEBUG
			if (masterLayout == null) {
				console.error('Master Layout is not defined for', this);
				return;
			}
			// endif

			if (this.contents == null) {
				this.contents = view_getContents(this.nodes);

				// if DEBUG
				Object.keys && Object.keys(this.contents).length === 0 && console.warn('no contents: @content #someID');
				// endif
			}

			this.nodes = master_clone(masterLayout, this.contents).nodes;
		}
	};

	mask.registerHandler(tag_layout_VIEW, View);

	// UTILS >>

	/**
	 *	if placeholder has no ID attribute,
	 *	then can _defaultContent template inserted into that
	 *	placeholder
	 */
	function master_clone(node, contents, _defaultContent) {

		if (node instanceof Array) {
			var cloned = [];
			for(var i = 0, x, imax = node.length; i < imax; i++){
				x = master_clone(node[i], contents, _defaultContent);
				
				if (node[i].tagName === tag_PLACEHOLDER) {
					
					if (i < imax - 1 && node[i + 1].tagName === tag_PLACEHOLDER_ELSE) {
						i += 1;
						if (x == null) {
							x = master_clone(node[i].nodes, contents, _defaultContent);
						}
					}
					
				}

				if (x == null) {
					continue;
				}

				if (x instanceof Array) {
					cloned = cloned.concat(x);
					continue;
				}

				cloned.push(x);
			}
			return cloned;
		}

		if (node.content != null) {
			return {
				content: node.content,
				type: node.type
			};
		}

		if (node.tagName === tag_PLACEHOLDER) {
			var content = node.attr.id ? contents[node.attr.id] : _defaultContent;

			if (!content) {
				return null;
			}

			return node.nodes == null //
			? content //
			: master_clone(node.nodes, contents, content);
		}

		var outnode = {
			tagName: node.tagName || node.compoName,
			attr: node.attr,
			type: node.type,
			controller: node.controller
		};

		if (node.nodes) {
			outnode.nodes = master_clone(node.nodes, contents, _defaultContent);
		}

		return outnode;
	}

	function view_getContents(node, contents) {
		if (contents == null) {
			contents = {};
		}

		if (node instanceof Array) {
			var nodes = node;
			for (var i = 0, x, imax = nodes.length; i < imax; i++) {
				view_getContents(nodes[i], contents);
			}
			return contents;
		}

		var tagName = node.tagName;
		if (tagName != null && tagName === tag_CONTENT) {
			var id = node.attr.id;

			// if DEBUG
			!id && console.error('@content has no id specified', node);
			contents[id] && console.error('@content already exists', id);
			// endif

			contents[id] = view_wrapContentParents(node);
		}

		if (node.nodes != null) {
			view_getContents(node.nodes, contents);
		}

		return contents;
	}

	function view_wrapContentParents(content) {
		var parents, parent = content.parent;

		while (parent != null && parent.tagName !== tag_layout_VIEW) {
			// not a for..in | performance, as we know all keys
			var p = {
					type: parent.type,
					tagName: parent.tagName,
					attr: parent.attr,
					controller: parent.controller,
					nodes: null
				};

			if (parents == null) {
				parents = p;
				parents.nodes = content.nodes;
			}else{
				parents.nodes = [p];
			}

			parent = parent.parent;
		}

		if (parents != null) {
			return parents;
		}

		return content.nodes;
	}

}(this));
