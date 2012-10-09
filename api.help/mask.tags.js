/**
 *  [List](#list)
 *  List View Builder
 *
 *  @attribute values - property Name of an Array of Items
 *  (i) If Array is array of strings or numbers,
 *      to resolve this in Item Template use dot: #{.}
 *
 *  (example)
 *      js: var values = { arr: [{letter:A},{letter:B}] }
 *      mask: list values='arr' > span > '#{letter}'
 *      output: <span>A</span><span>B</span>
 */
list values='array' { /** Template */ }

/**
 *  [Visible](#visible)
 *  Conditional Rendering
 *
 *  @attribute check - assertion to check if sub-template should be rendered
 *      
 */
visible check='user=="admin"' { /** Template */ }

/**
 *  [Bind](#bind)
 *  Value Binder, uses __defineGetter__/__defineSetter__
 *
 *  @attribute value - name of the property. Its value will be retrieved
 *      from JSON Template Values  and set into HTMLElement Container,
 *      after that any set call to that property, will change also
 *      HTMLElement content
 * 
 */
div > bind value='propertyName';