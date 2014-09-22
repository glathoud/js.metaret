/*global global exports require ast2scope need$ load acorn*/

// With Node.js
var global, exports;
if (typeof require === 'function')
{
    ast2scope = require( './ast2scope' ).ast2scope;
    acorn     = require( './acorn.25.03.2014/acorn' ).acorn;
    require( './acorn.25.03.2014/util/walk' );
}

// Without Node.js (browser, or V8 alone)
// Support both use cases: browser development (example: jsm_dev) and
// command-line transformation (example: jsm_dev -> jsm_out).
if (typeof ast2scope === 'undefined')
    (typeof need$ !== 'undefined'  ?  need$  :  load)( "ast2scope.js" );

if (typeof acorn === 'undefined')
    (typeof need$ !== 'undefined'  ?  need$  :  load)( "acorn.25.03.2014/acorn.js" );

if (typeof acorn.walk === 'undefined')
    (typeof need$ !== 'undefined'  ?  need$  :  load)( "acorn.25.03.2014/util/walk.js" );

(function (global) {

    // ---------- Public API

    global.ast2ast_remove_unused_local_fundecl = ast2ast_remove_unused_local_fundecl;

    // ---------- Public API implementation

    function ast2ast_remove_unused_local_fundecl( topnode )
    {
        var         s = ast2scope( topnode )
        ,      unused = _ast2ast_find_unused_local_fundecl( s )
        ,     new_ast = _ast2ast_filter_out( topnode, unused )
        ;

        return new_ast;
    }

    // ---------- Private details

    function _ast2ast_find_unused_local_fundecl( s )
    {
        var topnode = s.topnode()
        ,   fiarr   = s.funinfoarr()
        ,   iiarr   = s. idinfoarr()
        ,   unused_start_2_node = {} // returned value
        ;
        for (var i = fiarr.length; i--;)
        {
            var fi     = fiarr[ i ]
            , is_local = !!fi.parent
            ;
            if (is_local  &&  /declaration/i.test( fi.funnode.type ))
            {
                var idnode = fi.funnode.id
                ,   idname = idnode.name
                ,    scope = s.id2scope( idnode )
                ;
                if (!scope  ||  !idname)
                    throw new Error('Bug');
                
                var has_other_in_same_scope = false;
                for (var j = iiarr.length; j--;)
                {
                    var idinfo = iiarr[ j ];
                    if (idinfo.scope !== scope  ||  idinfo.node.name !== idname  ||  idinfo.node === idnode)
                        continue;

                    has_other_in_same_scope = true;
                    break;
                }
                
                if (!has_other_in_same_scope)
                {
                    var fifn  = fi.funnode
                    ,   fifns = fifn.start
                    ;
                    if (unused_start_2_node[ fifns ])
                        throw new Error( 'Bug #2' );
                    
                    unused_start_2_node[ fifns ] = fifn;
                }
            }
        }
        
        return unused_start_2_node;
    }

    function _ast2ast_filter_out( topnode, unused_start_2_node )
    {
        var ret = Object.create( topnode )
        , empty = {}
        ;
        for (var k in ret) { if (!(k in empty)) {  // More flexible than hasOwnProperty

            var v = ret[ k ];

            if (v instanceof Array)
            {
                ret[ k ] = v
                    .filter( not_an_unused_local_fundecl )
                    .map( function (x) { return _ast2ast_filter_out( x, unused_start_2_node ); } )
                ;
            }
            else if (v  &&  'object' === typeof v)
            {
                ret[ k ] = _ast2ast_filter_out( v, unused_start_2_node );
            }
        }}
        return ret;

        function not_an_unused_local_fundecl (x) 
        { 
            var node = x  &&  'number' === typeof x.start  &&  unused_start_2_node[ x.start ];
            if (node  &&  node !== x)
                throw new Error( 'Bug #3' );

            return !node;
        }
    }

})( global  ||  exports  ||  this );
