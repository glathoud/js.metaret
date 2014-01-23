(function (global) {

    // xxx common constants in a separate file
    var METAFUN        = 'metafun'
    ,   METARET        = 'metaret'
    ,   FUNCTION       = 'function'
    ,   RESERVED       = 'reserved'

    ,   CALL    = 'call'
    ,   DOTCALL = 'dotcall'

    ,   TYPE_BRACKET      = 'bracket'
    ,   TYPEBRACKET_CURLY = 'curly'
    ;

    // ---------- Public API

    global.lp2fmtree = lp2fmtree;

    // ---------- Public API implementation

    function lp2fmtree( lp, /*?array of string?*/namespace )
    // Input:  object returned by lightparse.
    // 
    // Output: array of function/metafun declaration trees.
    //
    // Comment:
    // 
    // `lp2fmtree` is used by ./metaret.js to support local metafuns
    // e.g. `metafun b` in:
    // 
    // {{{ 
    // metafun a(self) { metaret b; metafun b(self) { return 1; } }
    // }}}
    // 
    // -> declares `a` and `a.b`.
    //
    // It would be equivalent to write at the top level:
    // {{{
    // metafun a.b(self) {return 1;}
    // }}}
    // 
    // For a longer example see `sortedSearch` in ./metaret.js
    //
    // Guillaume Lathoud
    // glathoud@yahoo.fr
    {       
        namespace  ||  (namespace = []);
        
        var at = lp  instanceof Array  ?  lp  :  lp.allTree
        ,  ret = []
        ;
        for (var n = at.length, i = 0; i < n; i++)
        {
            var one  = at[ i ];

            // Detect a named function/metafunction declaration,
            // ignore anonymous functions.

            var isFunction     = one.name === FUNCTION
            ,   isMetafunction = one.name === METAFUN
            ;
            if ((isFunction  ||  isMetafunction)  &&  at[ i+1 ].type !== TYPE_BRACKET )
            {
                var begin = one.begin
                ,   end

                ,   dot_arr = []
                ,   next 
                ;
                do {
                    next = at[ ++i ];
                    dot_arr.push( next.name );
                } while (
                    next.type !== DOTCALL  &&  next.type !== CALL
                )
                
                var param = (next = at[ ++i ]).sepSplit.map( strip_comment_and_space );

                while (next.type !== TYPE_BRACKET  ||  next.typebracket !== TYPEBRACKET_CURLY)
                    next = at[ ++i ];

                var body_node = next 
                ,   end       = body_node.end
                ,   body      = body_node.str

                ,   fullname_arr = namespace.concat( dot_arr )
                ,   fullname     = fullname_arr.join( '.' )
                ;

                // Support for local metafunctions: look at the
                // metafuns and functions within the body.
                
                var children = next.children  ?  lp2fmtree( next.children, fullname_arr )  :  [];
                
                // Remove metafun children code from the body
                // (leave normal functions unchanged)
                
                for (var j = children.length; j--;)
                {
                    var kid = children[ j ];
                    if (kid.isMetafunction)
                    {
                        var a = kid.begin - body_node.begin
                        ,   b = kid.end   - body_node.begin
                        ;
                        body = body.substring( 0, a ) + body.substring( a, b ).replace( /[\s\S]/g, ' ' ) + body.substring( b );
                    }
                }
                                
                var out = { begin : begin
                            , end : end
                            , fullname_arr : fullname_arr
                            , isFunction     : isFunction
                            , isMetafunction : isMetafunction
                            , body_node : body_node
                            , fm_node : one
                            , fullname : fullname
                            , param : param
                            , param_str : param.join( ',' )
                            , body : body 
                            , children : children
                          };
                
                ret.push( out );
            }
        }
        
        return ret;
    }
    
    function strip_comment_and_space( o )
    {
        return o.str.replace( /\/\*[\s\S]*?\*\//g, '' ).replace( /(^\s+|\s+$)/g, '' );
    }

}(this));
