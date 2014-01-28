/*global metaparse jsm2js*/

// Support both use cases: browser development (example: jsm_dev) and
// command-line transformation (example: jsm_dev -> jsm_out).
if (typeof metaparse === 'undefined')
    (typeof need$ !== 'undefined'  ?  need$  :  load)( "metaret.js" );

(function (global) {

    global.jsm2js = jsm2js;

    function jsm2js( /*string*/jsm_code )
    // Convert .jsm code to .js code.
    // Returns a string.
    // 
    // Used by ./need$.js
    //
    // Guillaume Lathoud
    // glathoud@yahoo.fr
    {
        var local_name2info = {}
        ,   arr = metaparse( jsm_code, local_name2info )

        ,   ret_js = jsm_code
        ;
        
        for (var i = arr.length; i--;)
        {
            var one = arr[ i ]
            
            , fmtree = one.fmtree
            , info   = one.info
            
            , begin    = fmtree.begin
            , end      = fmtree.end
            , lastname = info.lastname

            ;

            begin.toPrecision.call.a;
            (end || null).toPrecision.call.a;

            if (fmtree.isMetafunction)
            {
                ret_js = ret_js.substring( 0, begin ) +
                    '\nfunction ' + info.lastname + '(' + info.paramArr.join( ',' ) + ')\n{\n' + 
                    (info.newBody  ||  (info.solve(), info.newBody)) + '\n}\n' +
                    ret_js.substring( end );
            }
        }
        
        return ret_js;
    }

})( this );
