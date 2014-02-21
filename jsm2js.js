/*global metaparse jsm2js lp2fmtree lightparse need$ load*/

// Support both use cases: browser development (example: jsm_dev) and
// command-line transformation (example: jsm_dev -> jsm_out).
if (typeof lightparse === 'undefined')
    (typeof need$ !== 'undefined'  ?  need$  :  load)( "lightparse.js" );

if (typeof lp2fmtree === 'undefined')
    (typeof need$ !== 'undefined'  ?  need$  :  load)( "lp2fmtree.js" );

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
        
        var lp = lightparse( jscode, CONST.LIGHTPARSE_OPT )
        ,   fm = lp2fmtree( lp )
        ,   rO = lp.reservedObj
        ,   mfunArr = (rO[ CONST.METAFUN ]  ||  []).map( enrich )
        ,   mretArr = (rO[ CONST.METARET ]  ||  []).map( enrich )
        ;
        
        if (mfunArr.length  ||  mretArr.length)
        {
            // Consider looking at `mfunArr` and `mretArr`
            // for detailed information useful to debug.

            throw new Error( 'jsm2js:check_leftover: found remaining `metafun` and/or `metaret` within function(s): ' + 
                             (
                                 (mfunArr.concat( mretArr ).map( function (x) { return x.containing_function.fullname; }))
                                     .join(',')
                             ) +
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

})( this );
