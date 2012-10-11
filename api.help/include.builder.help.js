void function(){	
	/**
        What this tool does:
            1. This tool handles:
                include.cfg
                include.js
                include.css
                include.load
                include.lazy
                
            2. Combines/uglifies Javascript included in .js function
            3. Combines CSS included in .css function
            4. Copies url(images) in CSS files to working directory (if any)
                (images that are not already under working project path)
            5. embeds loaded data and lazy sources into main index.html
                Example:
                    &lt;script type='include/load' data-appuri='/description.txt'&gt;
                        Some text
                    &lt;/script&gt;
                    &lt;script type='include/lazy' data-appuri='/lazy.js'&gt;
                        (function(){ return {name: 'Name'} })()
                    &lt;/script&gt;            
            
        Install:
            npm install includejs -g
        
        Help:
            includejs -help
            
    */

})();