/*global global exports require minify need$ load codeparse cp2fmtree*/

var global, exports;
//#BEGIN_BUILD_STRIP
// With Node.js
if (typeof require === 'function')
{
    acorn     = require( './acorn.25.03.2014/acorn' );
    ast2code  = require( './ast2code' ).ast2code;
    ast2ast_shortidentifiers  = require( './ast2ast_shortidentifiers' ).ast2ast_shortidentifiers;
    ast2ast_remove_unused_local_fundecl = require( './ast2ast_remove_unused_local_fundecl' ).ast2ast_remove_unused_local_fundecl;
}
//#END_BUILD_STRIP

// Without Node.js (browser, or V8 alone)
// Support both use cases: browser development (example: jsm_dev) and
// command-line transformation (example: jsm_dev -> jsm_out).
if (typeof acorn === 'undefined')
    (typeof need$ !== 'undefined'  ?  need$  :  load)( "acorn.25.03.2014/acorn.js" );

if (typeof ast2code === 'undefined')
    (typeof need$ !== 'undefined'  ?  need$  :  load)( "ast2code.js" );

if (typeof ast2ast_shortidentifiers === 'undefined')
    (typeof need$ !== 'undefined'  ?  need$  :  load)( "ast2ast_shortidentifiers.js" );

if (typeof ast2ast_remove_unused_local_fundecl === 'undefined')
    (typeof need$ !== 'undefined'  ?  need$  :  load)( "ast2ast_remove_unused_local_fundecl.js" );

(function (global) {

    var _emptyObj = {};
    
    // ---------- Public API

    global.minify = minify;

    // ---------- Public API: implementation

    function minify( /*string*/code )
    // Remove whitespaces and comments.
    {
        var       ast         = acorn.parse( code, { jsm : true } )
        , ast_obscure         = ast2ast_shortidentifiers( ast )
        , ast_obscure_useful  = ast2ast_remove_unused_local_fundecl( ast_obscure )
        ;
        return ast2code( ast_obscure_useful, { jsm : true } );
    }

})( global  ||  exports  ||  this );
