/**
 *  Component
 */
Compo({

/**
 *  [events](name=events)  (optional)
 *  Events that should be delegated after DOMInsert,
 *  @event key - 'EventType: Selector'
 */
events: {
    'touchstart: a': callbackFunction,
    // ..
},

/**
 * [slots](name=slots)
 *
 * Slots for View signals,
 * 'this' of each function is current controller instance
 */
slots: {
	addUser: function(event) { /* .. */ },

	/** PREDEFINED SIGNALS */

	/**
	 * domInsert signal will be send after rendered template is inserted into live DOM
	 */
	domInsert: function(){
		// Define this slot, and make here some dom dependent calculations
	}
}


/**
 *  [compos](name=compos)    (optional)
 *  Components/HTMLElements that will be searched for after DOMInsert,
 *  after that this.compo holds references to them in values instead
 *  of selector strings.
 *
 *  @{String} value - 'SelectorEngine: Selector'
 *      @argument SelectorEngine -
 *          '$' - Use Default DOM Manipulation Library,
 *          'compo' - Search for Component
 *          '' - Search with currentComponent.$.documentQuerySelector
 *
 *  @{Array} ['SelectorEngine: Selector', {events object}]
 */

compos: {
    myContainer: '$: #container',
    somePanel: ['$: .somePanel', {
		'click': function(){ console.log('click'); },
		'click: .subPanel': function(){ console.log('sub-click'); },
	}]
},

/**
 *  [$](name=$)
 *  After Compo is rendered, dollar sign contains the HTMLElement(s)
 *      selected with default DOM Manipulation Library
 */
$: null,


/**
 * [parent](name=parent)
 * Parent Controller
 */
parent: /* Object Instace */

/**
 *  [Construct](name=Construct)
 *
 *	(optional) Define Controller Instance Contructor
 */
constructor: function(){ /* .. */ },

/**
 * [.onRenderStart](name=onRenderStart)
 *	(optional)
 * This method will be called before renderStarts.
 * To override used model, or child nodes or container:
 *   this.nodes = jmask('.container > "Overriden Template"');
 *   this.model = otherModel
 *   this.container = otherContainer;
 *
 */
onRenderStart: function(model, cntx, container){},

/**
 *  [.render](name=render)
 *  (optinal)
 *
 *	Override custom render flow. (renderEnd/renderStart is not called)
 *
 *  (override example):
 *      render: function(){
 *          doSmtmBeforeRender();
 *          Compo.prototype.render.apply(this, arguments);
 *      }
 */
render: function(values, container, cntx){},

/**
 * [.onRenderEnd](name=onRenderEnd)
 *(optional)
 * This method is called after render is finished.
 * this.$ - is here defined
 *
 * -elements(Array) are child nodes that were created during render
 */
onRenderEnd: function(elements, model, cntx, container){}



/**
 *  [.append](name=append)
 *  Append Mask Template to Current Component,
 *  if Component is already rendered to DOM, 'DOMInsert' Event is emitted
 *  to newly created child components (if any)
 *
 *  @argument template -
 *              {String} - Mask Template
 *              {Object|Array} - Compiled Mask Template
 *  @argument values - {Object} - Mask Template JSON Model
 */
append: function(template, values),

/**
 *  [.on](name=on)
 *  @see @properties.events
 *  Adds Event Handler to this.events object
 */
on: function(?type, selector, callback),

/** [.find](name=this.find)
 *
 * Look in deep and find child controller
 * (selector is only tagName/compoName, id(#someid) or class(.someclass))
 *
 */
find: function(selector),

/**
 * [.closest](name=this.closest)
 *
 * Look up the tree and find parent controller
 */
closest: function(selector),

/**
 *  [.remove](name=remove)
 *  Removes Component from DOM, and calls Compo.dispose
 *
 */
remove: function(),

/**
 * [.slotState](name=slotState)
 * Disable/Enable Slot - if is disabled, it will be not fired when signal is emitted,
 * and if no active slots are available for a signal, then
 * HTMLElement/-(s) responsable for signal transmitting will
 * become :disabled pseudo class
*/
slotState: function(slotName, isActive){},

/**
 * [.signalState](name=signalState)
 * Disables/Enables the signal completely - all slots in all controllers up in the tree
 * will be enabled/disabled as all HTMLElements with that signal
*/
signalState: function(signalName, isActive){},

/**
 * [.emitIn](name=emitIn)
 * Sends signal to itself and then DOWN in the controllers tree
*/
emitIn: function(signalName, event, args /* Array */) {},

/**
 * [.emitOut](name=emitOut)
 * Sends signal to itself and then UP in the controllers tree
*/
emitOut: function(signalName, event, args /* Array */) {},

Static: {
    /**
     *[.find](name=find)
     * Get Component
     *
     * @argument compo - {Compo} - Current Component to Star Search From.
     * @argument selector - {String} -
     *      .anyClassName - search for component with class attribut,
     *      #anyId - search for component with id attribute,
     *      anyString - search for component with compoName(tagName)
     *  @argument direction - {String} - use 'up' to search in parents,
     *                  @defaults empty - looks in child components.
     *
     *  @return found {Compo} or null
     */
    find: function(compo, selector){},

	/**
	 *[.closest](name=closest)
	 */
	closest: function(compo, selector){}


    config:{
        /**
         *  [.config.setDOMLibrary](name=config.setDOMLibrary)
         *  DOM Manipulation Library.
         *
         *  used functions:
         *      lib(Array[HTMLElement])
         *      .on(event, selector, callback) - binding event handlers
         *      .append(HTMLElement)
         *      .remove()
         *      .filter(selector)
         *      .find(selector)
         *
         *  So any Library can be used that implements that functions
         *
         *	@default: This Library uses $/jQuery/Zepto objects from globals
         *
         */
        setDOMLibrary: function(lib){ $ = lib;}
    },

	/**
	 * Initialize Component Instance,
	 * - mix (String|Function) - mix is a component constructor
	 * or component name (it will look in mask.getHandler() for a constructor)
	 */
	initialize: function(mix, model, cntx, container, ?parentController){}
}

});
