
/**
 *  [render](name=renderDom)
 *  Render DocumentFragment when running in Browser or HTML when running in nodejs
 *      
 *  @param template - String Template, OR already compiled template,
 *                  @see mask.compile
 *  @param values - Template Values
 *  @param container - optional, (Interface with appendChild function)
 *  @param cntx - optional, context where to store all Custom Components
 *              and there Events
 *  @returns container
 */
mask.render(template, ?values, ?container, ?cntx);


/**
 *  [registerHandler](name=registerHandler)
 *  Register Custom Tag Handler Class,
 *  This Class realization must implement .render(values, container, cntx)
 *  Function, that will be called while rendering template,
 *  where {values} - are JSON Data of the template and {container} -
 *  is the HTMLElement (OR Array in case of renderHTML).
 *  (example)
 *      function Wrapper(){};
 *      Wrapper.prototype.render = function(values, container){
 *          var div = document.createElement('div');
 *          div.setAttribute('class','wrapper');
 *          div.innerHTML = "<div class='container'></div>";
 *          container.appendChild(div);
 *      }
 *      mask.registerHandler('wrapper', Wrapper);
 * @param tagName - {String}, name of custom tag;
 * @param handler - {Function}, Handler Class
 */
mask.registerHandler(tagName, handler);

/**
 *  [getHandler](name=getHandler)
 *  Get Registered Handler Class
 *  @return handler - {Function}
 */
mask.getHandler(tagName);

/**
 *  [registerUtility](name=registerUtility)
 *  Register Custom Value Utility Function.
 *  If specified, this function will be called before inserting values,
 *  the Function receives current JSON Values and the line to handle.
 *  (example)
 *  mask.registerUtility('add10', function(values, line){
 *      return values[line] + 10
 *  });
 *  mask.renderDOM("p > 'data: #{add10:amount}'",{amount: 5})
 *  @result: "<p>data: 15</p>"
 *
 *  @param name - {String} Name of the "preprocessor"
 *  @param fn - {Function} "preprocessor", "utility" Function
 */
mask.registerUtility(name, fn);

/**
 *  [compile](name=compile)
 *  Parse JSON-Template-Tree From {String} Template.
 *  
 *  @param template - {String}
 *  @return JSON-Template-Tree {Object|Array}
 */
mask.compile(template);

/**
 *  [serialize](name=serialize)
 *  @see .compile, but some additional preparation are made,
 *  so that the JSON-Tree Template can be stored in localStorage,
 *  or sent over RESTFul service as JSON Data.
 *
 *  @todo check if the serialization approach will be faster @
        see http://jsperf.com/maskjs-vs-json
 *  
 *  @param template - {String}
 *  @return - Raw-JSON-Object
 */
mask.serialize(template);

/**
 * [deserialize](name=deserialize)
 * Restore Serialized Object to Compiled Template
 */
mask.deserialize(json);