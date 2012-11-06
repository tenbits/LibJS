include.js({
    'framework': 'animation'
}).done(function() {

    var Helper = {
        doSwitch: function($current, $next) {
            $current.removeClass('active');
            $next.addClass('active');
            
            var prfx = ruqq.info.cssprefix;
            ruqq.animate({
                element: $next,
                prop: prfx + 'transform',
                from: 'translate3d(0px, -110%, 0px)',
                to: 'translate3d(0px, 0px, 0px)',
                duration: 300,
                timing: 'cubic-bezier(.58,1.54,.59,.75)'
            });            
        }
    }

	
	var currentCompo;
    window.ViewsManager = Class({
        Base: Compo,
        Construct: function() {
            window.viewsManager = this;
        },
        render: function(values, container, cntx) {
            this.nodes = mask.compile('list value="views" > view;');
            this.tagName = 'div';
            Compo.prototype.render.call(this, values, container, cntx);
        },
        load: function(info) {
            
			var activity = Compo.findCompo(app, 'pageActivity').show(),
				name = info.view.replace('View', '');
            
			
            window.include.js({
                controller: name + '/' + name
            }).done(function() {
                
                this.append(name + 'View;',{});
				
                activity.hide();
                
                
                var compo = Compo.findCompo(this, info.view);
				if (compo == null) {
                    console.error('Cannt be loaded', info.view);                    
                    return;
                }
				
				this.performShow(compo, info);
				
            }.bind(this));
        },
        show: function(info) {			
			var compo = Compo.findCompo(this, info.view);
            if (compo == null) {
                this.load(info);
                return;
            }
			
			this.performShow(compo, info);
        },
		performShow: function(compo, info){
			
			compo.section(info);
			
			if (compo == currentCompo) return;
			
			currentCompo = compo;
            
			if (this.$) Helper.doSwitch(this.$.children('.active'), compo.$);
            compo.activate && compo.activate();
		}
    });

    mask.registerHandler('viewsManager', ViewsManager);

});