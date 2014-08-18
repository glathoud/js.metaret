/*global acorn need$ load*/

if (typeof acorn.walk === 'undefined')
    (typeof need$ !== 'undefined'  ?  need$  :  load)( "acorn.25.03.2014/util/walk.js" );

(function (global) {

    // ---------- Public API
    
    global.ast2scope = ast2scope;
    
    // ---------- Public API implementation

    function ast2scope( /*object*/topnode )
    // Returns an object with various method to access scope information.
    //
    // Guillaume Lathoud
    // glathoud@yahoo.fr
    {
        var key2scope
        ,   funinfoarr
        ,   funkey2info
        ,   idinfoarr
        ,   idstart2info
        ,   key2node = {}
        ,   GLOBAL  = '<global>'
        ;

        ensure_ready();

        return {
            topnode        : function ()          { return topnode; }
            , id2scope     : function ( idnode )  { ensure_ready(); return key2scope  [ node2key( idnode ) ]; }
            , idinfoarr    : function ()          { ensure_ready(); return idinfoarr.slice(); }
            , idstart2info : function ()          { ensure_ready(); return Object.create( idstart2info ); }
            , fun2info     : function ( funnode ) { ensure_ready(); return funkey2info[ node2key( funnode ) ]; }
            , funinfoarr   : function ()          { ensure_ready(); return funinfoarr.slice(); }
        };

        function ensure_ready()
        {
            if (!key2scope)
                create_key2scope();
        }
        
        function node2key( node )
        {
            if (!node)
                return GLOBAL;
            
            node.start.toPrecision.call.a;
            node.end  .toPrecision.call.a;
            (node.type  ||  0).substring.call.a;
            
            var key = node.start + '.' + node.end + '.' + node.type;

            // Sanity check: key unicity
            if (key2node.hasOwnProperty( key ))
            {
                if (node !== key2node[ key ])
                    throw new Error( 'insanity!' );
            }
            else
            {
                key2node[ key ] = node;
            }
            
            return key;
        }

        function create_key2scope()
        {
            key2scope    = {};
            funinfoarr   = [];
            funkey2info  = {};
            idinfoarr    = [];
            idstart2info = {};

            // First walk to list the name (if any), params and
            // declarations of each function.

            var latest_info = create_funinfo( null, null )
            ,   base        = Object.create( acorn.walk.base )
            ,   base_Function = base.Function
            ;
            base.Function = new_base_Function;
            function new_base_Function( node /* , ... */ )
            {
                first_base_Function2( node );
                return base_Function.apply( base, arguments );
            }
            
            acorn.walk.simple( 
                topnode
                , { VariableDeclaration   : first_meet_VariableDeclaration }
                , base
            );

            // Second walk to define the scope of each identifier
            // usage.

            var second_latest_info   = funkey2info[ node2key( null ) ]
            ,   second_base          = Object.create( acorn.walk.base )
            ,   second_base_Function = second_base.Function
            ;
            second_base.Function = new_second_base_Function;
            function new_second_base_Function( node /*, ... */ )
            {
                second_base_Function2( node );
                return second_base_Function.apply( base, arguments );
            }
            
            acorn.walk.simple(
                topnode
                , { Identifier            : second_meet_Identifier }
                , second_base
            );

            // Sort for convenience

            idinfoarr.sort( idinfo_compare );

            // --- Details

            function idinfo_compare( a, b )
            {
                return a.node.start - b.node.start;
            }
            
            function first_base_Function2( node )
            {
                if (/declaration/i.test( node.type ))
                    first_meet_DeclarationIdentifier( node.id );

                latest_info = create_funinfo( node, latest_info );

                node.params.forEach( first_meet_DeclarationIdentifier );
            }

            function first_meet_VariableDeclaration( node )
            {
                node.declarations.forEach( function ( d ) { first_meet_DeclarationIdentifier( d.id ); } );
            }
            
            function first_meet_DeclarationIdentifier( node )
            {
                if ('Identifier' !== node.type)
                    throw new Error('bug#first_meet_DeclarationIdentifier');

                var key = node2key( node );
                if (!key2scope.hasOwnProperty( key ))
                {
                    latest_info = get_parent_info( node, latest_info );
                    latest_info.declarr.push( node );

                    var scope = latest_info.funnode;
                    save_idinfo( node, key, scope );
                }
            }
            



            function second_base_Function2( node )
            {
                second_latest_info = funkey2info[ node2key( node ) ];
                second_latest_info.declarr.slice.call.a; // Check
            }
            
            function second_meet_Identifier( node )
            {
                var key = node2key( node );
                if (!key2scope.hasOwnProperty( key ))
                {
                    second_latest_info = get_parent_info( node, second_latest_info );
                    var scope = find_scope( node, second_latest_info );
                    save_idinfo( node, key, scope );
                }
            }
         
        }

        // --- More details

        function save_idinfo( node, key, scope )
        {
            key2scope[ key ] = scope; 

            var idinfo = {
                node    : node
                , scope : scope
            };
            idinfoarr.push( idinfo );

            var idstart = node.start;
            idstart.toPrecision.call.a;
            if (idstart in idstart2info)
                throw new Error( 'bug#save_idinfo' );
         
            idstart2info[ idstart ] = idinfo;
        }

        function create_funinfo( node, latest_info )
        {
            var funkey = node2key( node );
            if (funkey2info.hasOwnProperty( funkey ))
                throw new Error('bug#create_funinfo');

            var parent = node  &&  get_parent( node, latest_info )
            ,   p_info = node  &&  funkey2info[ node2key( parent ) ]
            ;
            if (p_info)
                p_info.kidfunarr.push( node );

            var ret = funkey2info[ funkey ] = {
                funnode      : node  ||  null
                , parent    : parent
                , declarr   : []
                , kidfunarr : []
            };
            funinfoarr.push( ret );

            return ret;
        }
        
        function get_parent_info( node, latest_info )
        {
            var p = get_parent( node, latest_info );
            return funkey2info[ node2key( p ) ];
        }
        
        function get_parent( node, latest_info )
        {
            var p_info   = latest_info  // latest_info: sibling or parent -> if a sibling, then find the parent
            ,   a_start  = node.start
            ,   a_end    = node.end
            ;
            while (p_info)
            {
                var pfa = p_info.funnode;
                if (!pfa)
                    return null;  // global scope
                
                if (pfa.start < a_start  &&  a_end < pfa.end)
                    return pfa;
                
                p_info = funkey2info[ node2key( p_info.parent ) ];
            }
            return null;  // global scope
        }
        
        function find_scope( node, info )
        {
            if (node.type !== 'Identifier')
                throw new Error( 'bug#find_scope' );

            var node_name = node.name
            ,   declarr  = info.declarr
            ;
            for (var i = declarr.length; i--;)  // Could be smarter: bisection on .start
            {
                if (declarr[ i ].name === node_name)
                    return info.funnode;
            }
            return info.parent  ?  find_scope( node, funkey2info[ node2key( info.parent ) ] )  :  null;
        }
    }

})(this);
