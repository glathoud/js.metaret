/*global minify need$ load lightparse lp2fmtree*/

// Support both use cases: browser development (example: jsm_dev) and
// command-line transformation (example: jsm_dev -> jsm_out).
if (typeof lightparse === 'undefined')
    (typeof need$ !== 'undefined'  ?  need$  :  load)( "lightparse.js" );

if (typeof lp2fmtree === 'undefined')
    (typeof need$ !== 'undefined'  ?  need$  :  load)( "lp2fmtree.js" );

(function (global) {

    global.minify = minify;

function minify( /*string*/code )
// Remove whitespaces and comments.
{
    var current = code.length
    ,   newcode = code

    ,      lp = lightparse( code )
    ,  fmtree = lp2fmtree( lp )
    ,  unused = fmtree2unused( lp, fmtree )
    ;
    remove_unused( unused );

    lp     = lightparse( newcode );
    fmtree = lp2fmtree( lp );
    minify_all( lp.all );

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
    

    function minify_all( all )
    {
        for (var i = all.length; i--;)
        {
            var x = all[ i ]
		
		;
            if (x.end <= current)
            {

		newcode = newcode.substring( 0, x.end ) + newcode.substring( x.end ).replace( /^\s+/, ' ' ).replace( /^\s*([;,\?:=\+\-\*\(\)\]\[\}\{]+)\s*/, '$1' );



		if (x.type === 'comment') // Remove comments
            {
                newcode = newcode.substring( 0, x.begin ).replace( /\s+$/, ' ' ) + newcode.substring( x.end ).replace( /^\s+/, ' ' );
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
		
	    var s_beg = newcode.substring( 0, x.begin ).replace( /\s+$/, ' ' ).replace( /([;,\?:=\+\-\*\(\[\{]+)\s*$/, '$1' );
	    newcode = s_beg + newcode.substring( x.begin ).replace( /^\s*([;,\?:=\+\-\*\)\(\]\[\}\{]+)\s*/, '$1' );

            current = s_beg.length;
        }       
    }


    function fmtree2unused( lp, fmtree, unused )
    {
        unused || (unused = []);

        for (var n = fmtree.length, i = 0; i < n; i++)
        {
            var fm = fmtree[ i ];
            if (fm.lastname  &&  !fm.isAnonymousFunction  &&  // if has a name
                fm.parent  &&                                 // ...and not a global declaration...
                !lp.identifierObj[ fm.lastname ] &&          // ...and is never used
		!lp.callObj[ fm.lastname ])
            {
                unused.push( fm );
            }
            else if (fm.children)
            {
                // Walk deeper
                fmtree2unused( lp, fm.children, unused );
            }
        }
        
        return unused;
    }
    
}

})(this);
