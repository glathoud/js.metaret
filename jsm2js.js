/*global metaparse jsm2js*/

// Support both use cases: browser development (example: jsm_dev) and
// command-line transformation (example: jsm_dev -> jsm_out).
if (typeof metaparse === 'undefined')
    (typeof need$ !== 'undefined'  ?  need$  :  load)( "metaret.js" );

(function (global) {

    global.jsm2js = jsm2js;

    function jsm2js( /*string*/code )
    // Convert .jsm code to .js code.
    // Returns a string.
    // 
    // Used by ./need$.js
    //
    // Guillaume Lathoud
    // glathoud@yahoo.fr
    {
        var local_name2info = {}
        ,   arr = metaparse( code, local_name2info )
        ;
        
        console.log( 'xxx jsm2js arr:', arr );
    }

})( this );
