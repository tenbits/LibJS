/**
 *  Component Class.
 *  Inherit from it to Implement Custom Component (Abstract Class)
 */
Class({

/**
 *  [events](name=events)  (optional)
 *  Events that should be delegated after DOMInsert,
 *  @event key - 'EventType: Selector', 'click' is @default,
 *                  if only 'Selector' specified
 */
events: {
    'touchStart: a': callbackFunction,
    // ..
},
/**
 *  [compo](name=compos)    (optional)
 *  Components/HTMLElements that will be searched for after DOMInsert,
 *  after that this.compo holds references to them in values instead
 *  of selector strings.
 *
 *  @type value - 'SelectorEngine: Selector'
 *      @argument SelectorEngine -
 *          '$' - Use Default DOM Manipulation Library,
 *          'compo' - Search for Component
 *          '' - Search with currentComponent.$.documentQuerySelector
 */

compo: {
    myContainer: '$: #container',
    // ...
},

/**
 *  [$](name=$) 
 *  After Compo is rendered, dollar sign contains the HTMLElement(s)
 *      selected with default DOM Manipulation Library
 */
$: null,
    
/**
 *  [Construct](name=Construct)
 *   @param  arg -
 *      1. {Object} - template model object, receive from mask.renderDom
 *      Custom Class Initialization:
 *      2. {String} - mask template
 *   @param cntx
 *      1. maskDOM context
 */
Construct: function(arg, cntx){},

/**
 *  [.render](name=render)
 *  Implements .render {Function} needed for MaskJS, @see MaskJS.registerHandler
 *  This Function renders Template into container.
 *
 *  (override example):
 *      render: function(){
 *          doSmtmBeforeRender();
 *          Compo.prototype.render.apply(this, arguments);
 *      }
 */
render: function(values, container, cntx){},

/**
 *  [.insert](name=insert)
 *  Insert Component into @parent
 *  'DOMInsert' Event will be emitted to all children-Components
 *
 *  @argument parent - HTMLElement container
 */  
insert: function(parent){},

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
append: function(template, values){},

/**
 *  [.on](name=on)
 *  @see @properties.events
 *  Adds Event Handler to this.events object
 */  
on: function(?type, selector, callback){},

/**
 *  [.remove](name=remove)
 *  Removes Component from DOM, and calls Compo.dispose
 */
remove: function(){},

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
    find: function(compo, selector, direction){},
    
    /**
     *  [.dispose](name=dispose)
     *  Go through all children and if some implements dispose function
     *      calls this.
     *  @argument compo - {Compo};
     */
    dispose: function(compo){},
    
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
         */
        setDOMLibrary: function(lib){ $ = lib;}
    }
}

});
	