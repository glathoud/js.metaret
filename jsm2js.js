/*global global exports require metaparse jsm2js cp2fmtree codeparse need$ load console*/

// With Node.js
var global, exports;
if (typeof require === 'function')
{
    codeparse = require( './codeparse' ).codeparse;
    cp2fmtree = require( './cp2fmtree' ).cp2fmtree;
    metaparse = require( './metaret' )  .metaparse;
}

// Without Node.js (browser, or V8 alone)
// Support both use cases: browser development (example: jsm_dev) and
// command-line transformation (example: jsm_dev -> jsm_out).
if (typeof codeparse === 'undefined')
    (typeof need$ !== 'undefined'  ?  need$  :  load)( "codeparse.js" );

if (typeof cp2fmtree === 'undefined')
    (typeof need$ !== 'undefined'  ?  need$  :  load)( "cp2fmtree.js" );

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
        ,   arr = metaparse( jsm_code, local_name2info, { doNotCompile : true } )
        ,   ret_js = jsm_code
        ;
        
        replace_rec( arr );

        check_leftover( ret_js );

        return ret_js;

        function replace_rec( arr )
        {
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
                else if (fmtree.isFunction)
                {
                    // E.g. to support anonymous namespace like:
                    // `(function (global) { global.f = f; metafun f(...) ... })(this);`
                    var children = fmtree.children;
                    if (children)
                        replace_rec( children.map( function (kid) { return { fmtree : kid, info : local_name2info[ kid.fullname ] }; } ) );
                }
            }
        }
    }


    var CONST;

    function check_leftover( /*string*/jscode )
    // Make sure all reserved keywords `metafun` and `metaret` have
    // been eliminated.
    // https://github.com/glathoud/js.metaret/issues/9
    {
        CONST  ||  (CONST = metaparse.get_CONST());
        
        var cp = codeparse( jscode, CONST.CODEPARSE_OPT )
        ,   fm = cp2fmtree( cp )
        ,   mretArr = cp.jsmMetaretArr  ||  []
        ,   mfunArr = cp.jsmMetafunArr  ||  []
        ;
        
        if (mfunArr.length  ||  mretArr.length)
        {
            // Consider looking at `mfunArr` and `mretArr`
            // for detailed information useful to debug.
            
            if ('undefined' !== typeof console)
            {
                console.error( 'mfunArr:', mfunArr );
                console.error( 'mretArr:', mretArr );
            }
            throw new Error( 'jsm2js:check_leftover: found remaining `metafun` and/or `metaret` within function(s): ' +
                             ' - Please check for basic errors. For example a `metaret` can only be used from within a `metafun`.' +
                             ' See also github issue #9: https://github.com/glathoud/js.metaret/issues/9'
                           );
        }

        function enrich( begin )
        {
            var containing_function;
            for (var n = fm.length, i = 0; i < n; i++)
            {
                var one_fm = fm[ i ];
                if (one_fm.begin <= begin  &&  begin < one_fm.end)
                {
                    containing_function = one_fm;
                    break;
                }
            }
            
            return { 
                begin : begin
                , containing_function : containing_function
                , containing_function_fullname : containing_function  &&  containing_function.fullname
                , local_context : jscode.substring( Math.max( 0, begin - 50 ), begin + 40 )
            };
        }
    }

})( global  ||  exports  ||  this );
