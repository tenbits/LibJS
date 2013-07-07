
var Examples = (function(){
	
	
	function parse_Examples(src) {
		var regexp_Heading = /^[ ]*###/gm,
			examples = src.split(regexp_Heading);
		
		return ruqq.arr.aggr(examples, [], function(example, aggr){
			example = example.trim();
			
			if (example) 
				aggr.push(parse_Example(example));
		});
	}
	
	function parse_Example(example) {
		var group = {
			title: /[^\n\r]+/.exec(example)[0].trim()
		};
		
		var regexp_Group = /```([\w]+)(((?!```)(.|[\r\n]))*)/g,
			match,
			name, src;
			
		while ((match = regexp_Group.exec(example))) {
			name = (match[1] || '').trim();
			src = (match[2] || '').trim();
			
			if (!name || !src) 
				console.warn('Group has undefined parts', name, src);
			
			group[name] = src;
		}
		
		if (group.template && group.javascript) {
			try {
				var template = resutl.template;
				
				group.group = eval(group.javascript);
			} catch (e) {
				console.error('Example Evaluation Error', e, this.javascript);
			}
		}
		
		if (!group.name) 
			group.name = group.title.replace(/[^\w]/g, '').toLowerCase();
		
		return group;
	}

	includeLib.registerLoader('example', {
		process: function(source){
			return parse_Examples(source);
		}
	});
	
}());
	