
/**
 *  [renderDom](#renderDom)
 *  Render DocumentFragment, or if @param container defined,
 *      than render template into that container
 *  (i) Use this fn in in-browser rendering,
 *      cause rendering of DocumentFragment is much more faster
 *      than rendering html-string and its insertion
 *      
 *  @param template - String Template, OR already compiled template,
 *                  @see mask.compile
 *  @param values - Template Values
 *  @param container - optional, Interface with appendChild function
 *  @param cntx - optional, context where to store all Custom Components
 *              and there Events
 *  @returns container
 */
mask.renderDom(template, ?values, ?container, ?cntx);

/**
 *  [renderHtml](#renderHtml)
 *  @see .renderDom, but HTML-String will be rendered
 *  @param container - here container is {Array}
 */
mask.renderHtml(template, ?values, ?container, ?cntx)

/**
 *  [registerHandler](#registerHandler)
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
 *  [gerHandler](#getHandler)
 *  Get Registered Handler Class
 *  @return handler - {Function}
 */
mask.getHandler(tagName);

/**
 *  [registerUtility](#registerUtility)
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
 *  [compile](#compile)
 *  Parse JSON-Template-Tree From {String} Template.
 *  
 *  @param template - {String}
 *  @return JSON-Template-Tree {Object|Array}
 */
mask.compile(template);

/**
 *  [serialize](#serialize)
 *  @see .compile, but some additional preparation are made,
 *  so that the JSON-Tree Template can be stored in localStorage,
 *  or sent over RESTFul service as JSON Data.
 *  @param template - {String}
 *  @return - Raw-JSON-Object
 */
mask.serialize(template);

/**
 * [deserialize](#deserialize)
 * Restore Serialized Object to Compiled Template
 */
mask.deserialize(json);