/*global minify need$ load codeparse cp2fmtree*/

// Support both use cases: browser development (example: jsm_dev) and
// command-line transformation (example: jsm_dev -> jsm_out).
    if (typeof codeparse === 'undefined')
        (typeof need$ !== 'undefined'  ?  need$  :  load)( "codeparse.js" );

if (typeof cp2fmtree === 'undefined')
    (typeof need$ !== 'undefined'  ?  need$  :  load)( "cp2fmtree.js" );

(function (global) {

    var _emptyObj = {};
    
    // ---------- Public API

    global.minify = minify;

    minify.shorten_local_names = shorten_local_names;

    // ---------- Public API: implementation

    function minify( /*string*/code )
    // Remove whitespaces and comments.
    {
        var current = code.length
        ,   newcode = code

        ,      cp = codeparse( code )
        ,  fmtree = cp2fmtree( cp )
        ,  unused = fmtree2unused( cp, fmtree )
        ;
        remove_unused( unused );

        cp     = codeparse( newcode );
        fmtree = cp2fmtree( cp );
        remove_comments( cp.commentArr );

        // xxx        newcode = shorten_local_names( newcode );

        cp     = codeparse( newcode );
        fmtree = cp2fmtree( cp );
        minify_all( cp.all );


        return newcode.replace( /^\s+/, '' );
        
        function remove_unused( unused )
        {
            // https://github.com/glathoud/js.metaret/issues/12
            // 
            // Remove any non-global function declaration
            // whose identifier is never used in the file.
            
            for (var i = unused.length; i--;)
            {
                var fm = unused[ i ];
                newcode = newcode.substring( 0, fm.begin )
                    + newcode.substring( fm.begin, fm.end ).replace( /[\s\S]/g, ' ' )  // Keep the length, many spaces, will be simplified by `minify_all`.
                    + newcode.substring( fm.end );
            }
        }
        

        function remove_comments( cA )
        {
	    for (var i = cA.length; i--; )
	    {
		var c = cA[ i ];
		newcode = newcode.substring( 0, c.begin ) + newcode.substring( c.end );
	    }
        }

        function minify_all( all )
        {
            for (var i = all.length; i--;)
            {
                var x = all[ i ]
		
		;
                if (x.end <= current)
                {
		    
		    newcode = newcode.substring( 0, x.end ) + newcode.substring( x.end ).replace( /^\s+/, ' ' ).replace( /^\s*([;,\?:=\+\-\*\(\)\]\[\}\{]+)\s*/, '$1' );



		    if (x.type === 'comment')
                    {
                        throw new Error('bug');
                    }
		    else
		    {
		        // Remove whitespaces
                        newcode = newcode.substring( 0, x.end ) + 
                            newcode.substring( x.end, current ).replace( /\s+/g, ' ' ).replace( /^\s*([;,\?:=\+\-\*\)\(\]\[\}\{]+)\s*/, '$1' ) + 
                            newcode.substring( current ).replace( /^\s*([;,\?:=\+\-\*\)\(\]\[\}\{]+)\s*/, '$1' )
		        ;
		    }
                }
		
	        var s_beg = newcode.substring( 0, x.begin );
	        
	        if ( /^\s\s$/.test( s_beg.slice( -2 ) ) ) // For performance reasons: test first, before replacing.
		{
		    // Original code (way too slow): s_beg = s_beg.replace( /\s+$/, ' ' );
		    for (var si = s_beg.length - 1; (si--) && /^\s$/.test( s_beg[si] ); )
			;
		    
		    s_beg = s_beg.substring( 0, si+2 );
		}
		
	        
	        if ( /^\S\s$/.test( s_beg.slice( -2 ) ) && // For performance reasons: test first, before replacing
		     /^[;,\?:=\+\-\*\(\[\{]$/.test( s_beg.slice( -2, -1 ))
		   )
		{
		    s_beg = s_beg.slice( 0, -1 );
		}
	        
	        newcode = s_beg + 
		    newcode.substring( x.begin ).replace( /^\s*([;,\?:=\+\-\*\)\(\]\[\}\{]+)\s*/, '$1' )
		;

                current = s_beg.length;
            }       
        }


        function fmtree2unused( cp, fmtree, unused )
        {
            unused || (unused = []);

            for (var n = fmtree.length, i = 0; i < n; i++)
            {
                var fm = fmtree[ i ];
                if (fm.lastname  &&  !fm.isAnonymousFunction  &&  // if has a name
                    fm.parent  &&                                 // ...and not a global declaration...
                    !cp.identifierObj[ fm.lastname ] &&          // ...and is never used
		    !cp.callObj[ fm.lastname ])
                {
                    unused.push( fm );
                }
                else if (fm.children)
                {
                    // Walk deeper
                    fmtree2unused( cp, fm.children, unused );
                }
            }
            
            return unused;
        }
        
    }


    function shorten_local_names( /*string*/code, /*?object?*/fm, /*?object?*/tmp )
    // Input: a string of standard JavaScript code.
    //
    // Output: similar, except that the names of the local identifiers
    // have been shortened wherever possible.
    {
        if (!fm)
        {
            // Top-level: functional

            var fmtree = cp2fmtree( codeparse( code ) )
            ,   allIds = walk_get_all_idnames( fmtree )
            ;

            var i = 0;
            tmp = { toReplace : [], i : i, nextTarget : i2target( i ), allIds : allIds };
            
            // Internal implementation: imperative: update `tmp`
            fmtree.forEach( function (fm) { shorten_local_names( code, fm, tmp ); } );
            tmp.toReplace.sort( function (a,b) { return a.begin-b.begin; } );
            // End of internal implementation.

            var arr = []
            ,  last = code.length
            ;
            for (var j = tmp.toReplace.length; j--;)  // Decreasing order important
            {
                var x = tmp.toReplace[ j ];
                if (x.end < last)
                    arr.push( code.substring( x.end, last ) );
                arr.push( x.target );
                last = x.begin;
            }
            if (last > 0)
                arr.push( code.substring( 0, last ) );

            return arr.reverse().join( '' );
        }

        // Private implementation: imperative -> update `tmp`
        
        var idname2decluse = fm.idname2decluse;
        
        for (var name in idname2decluse) { if (!(name in _emptyObj)) {  // More flexible than hasOwnProperty

            // Next valid target idname to replace with.
            while( tmp.nextTarget in tmp.allIds );            
                tmp.nextTarget = i2target( ++tmp.i );
            
            // Would the replacement save some chars?
            if (name.length <= tmp.nextTarget.length)
                continue;  // No: skip it

            // Replace only once
            var du = idname2decluse[ name ];
            if (du.fmDecl !== fm)
                continue;

            // Do it
            
            var  arr = du.declArr.concat( du.use )
            , target = tmp.nextTarget
            ;
            for (var j = arr.length; j--;)
            {
                var   x = arr[ j ]
                , x_begin = x.begin
                , x_end   = x.end
                ;
                x_begin.toPrecision.call.a;
                x_end  .toPrecision.call.a;
                var x_source = code.substring( x_begin, x_end )
                ,   x_target = x_source.replace( name, target )
                ;
                tmp.toReplace.push( { target : x_target, begin : x_begin, end : x_end, source : x_source } );
            }            
        }}
    }


    function walk_get_all_idnames( fmtree, ret )
    {
        ret  ||  (ret = {});
        for (var i = fmtree.length; i--;)
        {
            var fm = fmtree[ i ];
            for (var idname in fm.idname2decluse) { if (!(idname in ret)){ // More flexible than hasOwnProperty
                ret[ idname ] = 1;
            }}

            walk_get_all_idnames( fm.children  ||  [], ret );
        }
        
        return ret;
    }


    function i2target( i )
    {
        return '_' + i.toString( 36 );
    }


})(this);
