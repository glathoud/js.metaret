/*global global exports require ast2scope need$ load acorn*/

var global, exports;
//#BEGIN_BUILD_STRIP
// With Node.js
if (typeof require === 'function')
{
    ast2scope  = require( './ast2scope' ).ast2scope;
    acorn      = require( './acorn.25.03.2014/acorn' );
    acorn.walk = require( './acorn.25.03.2014/util/walk' );
}
//#END_BUILD_STRIP

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

    global.ast2ast_shortidentifiers = ast2ast_shortidentifiers;

    // ---------- Public API implementation

    function ast2ast_shortidentifiers( topnode )
    {
        var         s = ast2scope( topnode )
        , translation = _ast2ast_prepare_translation_to_shortidentifiers( s )
        ,     new_ast = _ast2ast_translate( topnode, translation )
        ;

        return new_ast;
    }

    // ---------- Private details

    function _ast2ast_translate( o, idstart2newname )
    {
        if (!(o  &&  'object' === typeof o))
            return o;

        if (o instanceof Array)
            return o.map( function ( x ) { return _ast2ast_translate( x, idstart2newname ); } );

        var ret = Object.create( o );

        if ('Identifier' === ret.type)
        {
            var ret_start = ret.start;
            ret_start.toPrecision.call.a;
            
            var newname = idstart2newname[ ret_start ];
            if (newname)
                ret.name = newname;
        }
        
        var empty = {};
        for (var k in ret) { if (!(k in empty)) {  // More flexible than hasOwnProperty

            var v = ret[ k ];
            if (v  &&  'object' === typeof v)
                ret[ k ] = _ast2ast_translate( v, idstart2newname );
        }}
        
        return ret;
    }
    
    function _ast2ast_prepare_translation_to_shortidentifiers( s )
    {
        // input
        var idinfoarr = s.idinfoarr()
        ,   n         = idinfoarr.length
        
        // internal state to prevent name collisions
        ,   usedset   = {}
        ,   newstate  = { next : 0, usedset : usedset }    
        ;
        for (var i = n; i--;)
        {
            var name = idinfoarr[ i ].node.name;
            (name || 0).substring.call.a;
            usedset[ name ] = 1;
        }

        // internal declaration-scope-specific renaming of identifiers
        var declscopestart_idname_2_newname = {};

        // output
        var idstart2newname = {};

        for (var i = n; i--;)
        {
            var idinfo       = idinfoarr[ i ]
            ,   scope        = idinfo.scope
            ;
            if (!scope)
                continue;  // do not rename identifiers declared in the global scope
            
            var scope_start  = scope.start
            ,   idname       = idinfo.node.name
            ;
            scope_start.toPrecision.call.a;
            (idname || 0).substring.call.a;
            
            var  dss_in = scope_start + '#' + idname
            
            ,   newname = dss_in in declscopestart_idname_2_newname
                ? declscopestart_idname_2_newname[ dss_in ]
                : (declscopestart_idname_2_newname[ dss_in ] = create_newname( newstate ))
            
            ,   idstart = idinfo.node.start
            ;

            idstart.toPrecision.call.a;
            (newname || 0).substring.call.a;

            idstart2newname[ idstart ] = newname;
        }
        
        return idstart2newname;
    }

    var all_idchar       = '_$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    ,   all_idchar_n     = all_idchar.length
    ,   notfirst_idchar  = '0123456789'
    ,   notfirst_prepend = '_'
    ;
    function create_newname( newstate )
    // Returns a new identifier name. Side effect: This modifies
    // `newstate`.
    {
        var newname
        ,   usedset = newstate.usedset
        ;
        while (
            (newname = i2newname( newstate.next++ ))
            , (
                !acorn.canBeSafeIdentifierName( newname )  ||  usedset.hasOwnProperty( newname )
            )
        )
        {}
        
        usedset[ newname ] = 1;
        return newname;
    }

    function i2newname( i )
    {
        var arr = [];
        while (i  ||  !arr.length)
        {
            arr.push( all_idchar[ i % all_idchar_n ] );
            i = (i / all_idchar_n) | 0;
        }
        arr.reverse();
        
        var arr0 = arr[ 0 ];
        if (-1 < notfirst_idchar.indexOf( arr0 ))
            arr.unshift( notfirst_prepend );

        return arr.join( '' );
    }

})( global  ||  exports  ||  this );
