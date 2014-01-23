(function (global) {

    // xxx common constants in a separate file
    var METAFUN        = 'metafun'
    ,   METARET        = 'metaret'
    ,   FUNCTION       = 'function'
    ,   RESERVED       = 'reserved'

    ,   CALL    = 'call'
    ,   DOTCALL = 'dotcall'
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
            if (one.name === METAFUN  ||  one.name === FUNCTION)
            {
                var dot_arr = []
                ,   next 
                ;
                do {
                    next = at[ ++i ];
                    dot_arr.push( next.name );
                } while (
                    next.type !== DOTCALL  &&  next.type !== CALL
                )
                
                var param = (next = at[ ++i ]).sepSplit.map( strip_comment_and_space )

                ,   body_node = next = at[ ++i ]
                ,   body      = body_node.str

                ,   fullname_arr = namespace.concat( dot_arr )
                ,   fullname     = fullname_arr.join( '.' )
                ;

                // Support for local metafunctions: look at the
                // metafuns and functions within the body.
                
                var children = next.children  ?  lp2fmtree( next.children, fullname_arr )  :  [];
                
                // Remove children code from the body
                
                for (var j = children.length; j--;)
                {
                    var kid = children[ j ];
                    body = body.substring( 0, kid.body_node.begin ) + kid.body.replace( /[\s\S]/g, ' ' ) + body.substring( kid.body_node.end );
                }
                                
                var out = { fullname_arr : fullname_arr
                            , body_node : body_node
                            , fullname : fullname
                            , param : param
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

