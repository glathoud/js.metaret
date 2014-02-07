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

    function lp2fmtree( lp, /*?array of string?*/namespace, /*?object?*/workspace )
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
    // metafun a(self) { metaret a.b; }
    // metafun a.b(self) { return 1; }
    // }}}
    // 
    // For a longer example see `sortedSearch` in ./index.html
    //
    // Guillaume Lathoud
    // glathoud@yahoo.fr
    {       
        var isTopLevel = arguments.length < 2;

        namespace  ||  (namespace = []);
        workspace  ||  (workspace = { iAnonymous : 0, lastname2fmarr : {} });
        
        var at = lp  instanceof Array  ?  lp  :  lp.allTree
        ,  ret = []
        ;
        if (isTopLevel)
            ret.lastname2fmarr = workspace.lastname2fmarr;  // Convenience access (mainly for ./inline.js)
        
        for (var n = at.length, i = 0; i < n; i++)
        {
            var one  = at[ i ];

            // Detect a named function/metafunction declaration,
            
            var isFunction     = one.name === FUNCTION
            ,   isMetafunction = one.name === METAFUN

            ,   isAnonymousFunction = isFunction  &&  at[ i+1 ].type === TYPE_BRACKET
            ;


            if (((isFunction  ||  isMetafunction)  &&  at[ i+1 ].type !== TYPE_BRACKET)  ||
                isAnonymousFunction)
            {
                var begin = one.begin
                ,   end

                ,   dot_arr = []
                ,   next 
                ;
                if (isAnonymousFunction)
                {
                    // Give some identity
                    dot_arr = [ 'anonymous#' + (workspace.iAnonymous++) ];
                }
                else
                {
                    // Fetch the name of the function or metafunction.
                    // Dots are supported (subnamespace).
                    do {
                        next = at[ ++i ];
                        dot_arr.push( next.name );
                    } while (
                        next.type !== DOTCALL  &&  next.type !== CALL
                    )
                }
                
                var param_arr = (next = at[ ++i ]).sepSplit.map( strip_comment_and_space );

                while (next.type !== TYPE_BRACKET  ||  next.typebracket !== TYPEBRACKET_CURLY)
                    next = at[ ++i ];

                var body_node = next 
                ,   end       = body_node.end
                ,   body      = body_node.str

                ,   fullname_arr = namespace.concat( dot_arr )
                ,   fullname     = fullname_arr.join( '.' )
                ,   lastname     = fullname_arr[ fullname_arr.length - 1 ]
                ;

                // Support for local metafunctions: look at the
                // metafuns and functions within the body.
                
                var children = next.children  ?  lp2fmtree( next.children, fullname_arr, workspace )  :  [];
                
                // Remove children code from the body.
                
                for (var j = children.length; j--;)
                {
                    var kid = children[ j ]
                    ,     a = kid.begin - body_node.begin
                    ,     b = kid.end   - body_node.begin
                    ;
                    if (!kid.isAnonymousFunction)
                        body = body.substring( 0, a ) + body.substring( a, b ).replace( /[\s\S]/g, ' ' ) + body.substring( b );
                }
                                
                var out = { begin : begin
                            , end : end
                            , fullname_arr : fullname_arr
                            , lastname     : lastname
                            , isFunction     : isFunction
                            , isMetafunction : isMetafunction
                            , isAnonymousFunction : isAnonymousFunction
                            , body_node : body_node
                            , fm_node : one
                            , fullname : fullname
                            , param_arr : param_arr
                            , param_str : param_arr.join( ',' )
                            , body : body 
                            , children : children
                          };
                
                ret.push( out );

                // Convenience access
                if (!isAnonymousFunction)
                {
                    (workspace.lastname2fmarr[ lastname ]  ||  (workspace.lastname2fmarr[ lastname ] = []))
                        .push( out )
                    ;
                }
            }
            else if (one.children)
            {
                // Useful to find functions e.g. within `(...)`:
                // `(function (global) { ... })(this);`
                ret.push.apply( ret, lp2fmtree( one.children, namespace, workspace ) );
            }
        }

        // When done with the tree, walk it from the top
        if (isTopLevel)
            find_out_who_declares_what( ret, [].concat( lp.vardeclArr ) );

        return ret;
    }
    
    function strip_comment_and_space( o )
    {
        return o.str.replace( /\/\*[\s\S]*?\*\//g, '' ).replace( /(^\s+|\s+$)/g, '' );
    }

    function find_out_who_declares_what( arr, vardeclArr )
    {
        var n = arr.length;

        // Depth first - this can change `vardeclArr`
        
        for (var i = 0; i < n; i++)
        {
            var one = arr[ i ]
            ,   c   = one.children
            ;
            if (c  &&  c.length)
                find_out_who_declares_what( c, vardeclArr );
        }
        
        // then breadth

        for (var i = 0; i < n; i++)
        {
            var one = arr[ i ]
            , begin = one.begin
            ,   end = one.end

            , one_vda = one.vardeclArr = []
            ;
            for (var j = vardeclArr.length; j--;)
            {
                var vd = vardeclArr[ j ];
                if (vd.end < begin)
                    break;

                if (vd.begin < end)
                    one_vda.unshift( vardeclArr.splice( j, 1 )[ 0 ] );
            }
        }
    }

}(this));
