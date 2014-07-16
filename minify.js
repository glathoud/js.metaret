/*global minify need$ load codeparse cp2fmtree*/

// Support both use cases: browser development (example: jsm_dev) and
// command-line transformation (example: jsm_dev -> jsm_out).
if (typeof acorn === 'undefined')
    (typeof need$ !== 'undefined'  ?  need$  :  load)( "acorn.25.03.2014/acorn.js" );

if (typeof ast2code === 'undefined')
    (typeof need$ !== 'undefined'  ?  need$  :  load)( "ast2code.js" );


(function (global) {

    var _emptyObj = {};
    
    // ---------- Public API

    global.minify = minify;

    // ---------- Public API: implementation

    function minify( /*string*/code )
    // Remove whitespaces and comments.
    {
        var ast = acorn.parse( code, { jsm : true } );
        return ast2code( ast, { jsm : true } );
    }

})(this);
