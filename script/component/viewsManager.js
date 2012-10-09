include.lazy({
    'ruqq.animation': {
        framework: 'animation'
    }
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
        load: function(id) {
            
            var activity = Compo.findCompo(app, 'pageActivity');
			activity.show();
            
            
            var name = id.replace('View', '');
            
            
            window.include.js({
                controller: name + '/' + name
            }).done(function() {
                
                this.append('view;', {
                    id: id
                });
                
                activity.hide();
                
                
                var compo = Compo.findCompo(this, id);
                if (compo == null) {
                    console.error('Cannt be loaded', id);                    
                    return;
                }
                if (this.$) Helper.doSwitch(this.$.children('.active'), compo.$.parent());
    
                compo.activate && compo.activate();
            
                
            }.bind(this));
        },
        show: function(id) {
            var compo = Compo.findCompo(this, id);
            if (compo == null) {
                console.log('is null', this, id);
                this.load(id);
                return;
            }
            if (this.$) Helper.doSwitch(this.$.children('.active'), compo.$.parent());

            compo.activate && compo.activate();

        }
    });

    mask.registerHandler('viewsManager', ViewsManager);

});