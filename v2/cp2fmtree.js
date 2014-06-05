(function (global) {

    // xxx common constants in a separate file
    var METAFUN        = 'jsmMetafun'
    ,   METARET        = 'jsmMetaret'
    ,   FUNCTION_EXPRESSION       = 'FunctionExpression'
    ,   FUNCTION_DECLARATION       = 'FunctionDeclaration'
    ,   RESERVED       = 'reserved'

    ,   CALL    = 'call'
    ,   DOTCALL = 'dotcall'

    ,   TYPE_BRACKET      = 'bracket'
    ,   TYPEBRACKET_CURLY = 'curly'

    ,  _emptyObj = {}
    ;

    // ---------- Public API

    global.cp2fmtree = cp2fmtree;

    // ---------- Public API implementation

    function cp2fmtree( cp, /*?array of string?*/namespace, /*?object?*/workspace, /*?fm?*/parent )
    // Input:  object returned by `codeparse`.
    // 
    // Output: array of function/metafun declaration trees.
    //
    // Comment:
    // 
    // `cp2fmtree` is used by ./metaret.js to support local metafuns
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
        
        var at = cp  instanceof Array  ?  cp  :  cp.allTree
        ,  ret = []
        ;
        if (isTopLevel)
            ret.lastname2fmarr = workspace.lastname2fmarr;  // Convenience access (mainly for ./inline.js)
        
        for (var n = at.length, i = 0; i < n; i++)
        {
            var one  = at[ i ];

            // Detect a named function/metafunction declaration,
            
            var isFunction     = one.type === FUNCTION_EXPRESSION  ||  one.type === FUNCTION_DECLARATION
            ,   isMetafunction = one.type === METAFUN

            ,   isAnonymousFunction = isFunction  &&  at[ i+1 ].type === TYPE_BRACKET
            ;


            if (((isFunction  ||  isMetafunction)  &&  at[ i+1 ].type !== TYPE_BRACKET)  ||
                isAnonymousFunction)
            {
                var begin = one.begin
                ,   end

                ,   dot_arr = []
                ,   dotnode_arr = []
                ,   next 
                ;
                if (isAnonymousFunction)
                {
                    // Give some identity
                    dot_arr = [ 'anonymous#' + (workspace.iAnonymous++) ];
                }
                else
                {
                    dot_arr = one.name.split( '.' );
                }
                
                if (one.children.length !== 2)
                    throw new Error( 'Unexpected metafun declaration or function declaration' );

                var param_node = one.children[ 0 ]
                ,   param_arr  = param_node.sepSplit.map( strip_comment_and_space )
                ,   param_set  = {}
                ;
                for (var pi = param_arr.length; pi--;)
                    param_set[ param_arr[ pi ] ] = 1;
                               

                var body_node = one.children[ 1 ]
                ,   end       = body_node.end
                ,   body      = body_node.str

                ,   fullname_arr = namespace.concat( dot_arr )
                ,   fullname     = fullname_arr.join( '.' )
                ,   lastname     = fullname_arr[ fullname_arr.length - 1 ]
                
                , out = {
                    begin : begin
                    , end : end
                    , fullname_arr : fullname_arr
                    , lastname     : lastname
                    , isFunction     : isFunction
                    , isMetafunction : isMetafunction
                    , isAnonymousFunction : isAnonymousFunction
                    , dot_arr    : dot_arr
                    , dotnode_arr : dotnode_arr
                    , param_node : param_node
                    , body_node : body_node
                    , fm_node : one
                    , fullname : fullname
                    , param_arr : param_arr
                    , param_str : param_arr.join( ',' )
                    , param_set : param_set
                    , parent   : parent  ||  null
                    
                    // The remaining values are set further below
                    , children : null
                    , body : null  
                }
                ;

                // Support for local metafunctions: look at the
                // metafuns and functions within the body.
                
                var children = body_node.children  ?  cp2fmtree( body_node.children, fullname_arr, workspace, /*parent:*/out )  :  [];
                
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
                
                out.children = children;
                out.body     = body;

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
                ret.push.apply( ret, cp2fmtree( one.children, namespace, workspace ) );
            }
        }

        // When done with the tree, walk it from the top
        if (isTopLevel)
        {
            find_out_who_has_what( ret, [].concat( cp.vardeclArr ), 'vardecl' );
            find_out_who_has_what( ret, cp.identifierArr.filter( function (x) { return !x.isVardecl; } ), 'varuse' );

            // Now we can find closures. Useful e.g. to shorten local names (see ./minify.js)
            find_decluse( ret );
        }

        return ret;
    }
    
    function strip_comment_and_space( o )
    {
        return o.str.replace( /\/\*[\s\S]*?\*\//g, '' ).replace( /(^\s+|\s+$)/g, '' );
    }

    function find_out_who_has_what( arr, vArr, outputName )
    {
        var n = arr.length;

        // Depth first - this can change `vArr`
        
        for (var i = 0; i < n; i++)
        {
            var one = arr[ i ]
            ,   c   = one.children
            ;
            if (c  &&  c.length)
                find_out_who_has_what( c, vArr, outputName );
        }
        
        // then breadth

        for (var i = 0; i < n; i++)
        {
            var one = arr[ i ]
            , begin = one.begin
            ,   end = one.end

            , param_begin = one.param_node.begin
            , param_end   = one.param_node.end

            , one_vda = one[ outputName + 'Arr' ] = []
            , one_vdo = one[ outputName + 'Obj' ] = {}
            ;
            for (var j = vArr.length; j--;)
            {
                var vd = vArr[ j ];
                if (vd.end < param_end)
                    break;

                if (vd.begin < end)
                {
                    var x = vArr.splice( j, 1 )[ 0 ];
                    one_vda.unshift( x );
                    (one_vdo[ x.name ]  ||  (one_vdo[ x.name ] = [])).push( x );
                }
            }
        }
    }


    function find_decluse( /*array | object*/arr_or_fm, /*?object?*/idname2decluse )
    {
        if (arr_or_fm instanceof Array)
        {
            arr_or_fm.forEach( function (fm) { find_decluse( fm, idname2decluse ); } );
            return;
        }

        var fm = arr_or_fm;        
        idname2decluse = copy( idname2decluse || {} );

        var fm_idname2decluse = fm.idname2decluse = idname2decluse
        , arr_push_out = [ idname2decluse ]
        ;

        // Declarations in this scope `fm`

        for (var j = fm.param_arr.length; j--;)
        {
            var   name = fm.param_arr[ j ]
            ,   fpnssi = fm.param_node.sepSplit[ j ]
            ;
            arr_push( arr_push_out
                      , name
                      , { 
                          isParam : true
                          , fmDecl : fm
                          , use : []
                          , name : name 
                          , declArr: [ { begin : fpnssi.begin, end : fpnssi.end } ]
                      } 
                    );
        }
        for (var name in fm.vardeclObj) { if (!(name in _emptyObj)) {  // More flexible than hasOwnProperty
            arr_push( arr_push_out
                      , name
                      , {
                          isVardecl : true
                          , fmDecl : fm
                          , use : []
                          , name : name
                          , declArr : fm.vardeclObj[ name ].map( function (o) { return { begin : o.begin, end : o.end }; } )
                      }
                    );
        }}
        for (var j = fm.children.length; j--;) 
        {
            var kid = fm.children[ j ]
            , name  = kid.lastname
            , kid_declArr = []
            ;
            if (kid.dotnode_arr.length)
            {
                kid_declArr.push(
                    { begin : kid.dotnode_arr[ 0 ].begin, end : kid.dotnode_arr.slice( -1 )[ 0 ].end } 
                );
            }
            
            arr_push( arr_push_out
                      , name
                      , {
                          isFunction : true  // Declaration or named expression
                          , fmDecl : fm
                          , use : []
                          , name : name
                          , declArr : kid_declArr
                      }
                    );
        }

        // Usages in the scope of `fm`

        for (var n = fm.varuseArr.length, j = 0; j < n; j++)
        {
            var one = fm.varuseArr[ j ]
            ,  name = one.name
            ;
            if (!idname2decluse[ name ])
            {
                arr_push( arr_push_out
                          , name
                          , {
                              isGlobal : true
                              , fmDecl : null
                              , use : []
                          }
                        );
            }
            arr_push_use( arr_push_out, fm, one );
        }
        
        // Recursion: Usages in children scopes.
        // Note: this can help to find closures.
        
        find_decluse( fm.children, idname2decluse );
    }
    
    function copy_fm_use( one_vu, fmUse )
    {
        return ( one_vu  ||  [] )
            .map( function (use) { var o = copy( use ); o.fmUse = fmUse; return o; } )
        ;
    }
    
    function arr_push( /*object | array of object*/arr_push_out, /*string*/name, /*object*/o )
    {
        var undef;
        (name || 0).substring.call.a;
        (o || undef).hasOwnProperty.call.a;

        if (arr_push_out instanceof Array)
        {
            arr_push_out.forEach( function (out) { arr_push( out, name, o ); } );
            return;
        }

        if (!arr_push_out[ name ]  ||  arr_push_out[ name ].fmDecl !== o.fmDecl)
        {
            var o2 = copy( o );
            o2.use = [].concat( o2.use );
            arr_push_out[ name ] = o2;
        }
        else
        {
            var use = arr_push_out[ name ].use;
            use.push.apply( use, o.use );
        }        
    }

    function arr_push_use( arr_push_out, fmUse, use )
    {
        if (arr_push_out instanceof Array)
        {
            arr_push_out.forEach( function (out) { arr_push_use( out, fmUse, use ); } );
            return;
        }

        arr_push_out[ use.name ].use.push( mix( copy( use ), { fmUse : fmUse } ) );
    }
    

    function copy( o )
    {
        return mix( {}, o );
    }
    
    function mix( o, o2 )
    {
        for (var k in o2) { if (!(k in _emptyObj)) {  // More flexible than hasOwnProperty
            o[ k ] = o2[ k ];
        }}
        return o;
    }

}(this));
