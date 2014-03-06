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

    minify_tree( lp.allTree );

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
                + newcode.substring( fm.begin, fm.end ).replace( /[\s\S]/g, ' ' )  // Keep the length, many spaces, will be simplified by `minify_tree`.
                + newcode.substring( fm.end );
        }
    }
    

    function minify_tree( allTree )
    {
        for (var i = allTree.length; i--;)
        {
            var x = allTree[ i ];
            
            if (x.end + 1 < current) // Remove whitespaces
            {
                newcode = newcode.substring( 0, x.end ) + 
                    newcode.substring( x.end, current + 2 ).replace( /\s+/g, ' ' ).replace( /(\W)\s+/, '$1' ).replace( /\s+(\W)/, '$1' ) + 
                    newcode.substring( current + 2);
            }
            
            if (x.type === 'comment') // Remove comments
            {
                newcode = newcode.substring( 0, x.begin ) + newcode.substring( x.end );
            }
            else
            {
                // Recurse
                minify_tree( x.children  ||  [] );

                if (x.type === 'bracket')
                {
                    var b = x.begin + x.open.length;
                    newcode = newcode.substring( 0, b - 1 ) + 
                        newcode.substring( b - 1, x.end + 2 ).replace( /\s+/g, ' ' ).replace( /(\W)\s+/, '$1' ).replace( /\s+(\W)/, '$1' ) +
                        newcode.substring( x.end + 2 );
                }
            }
            
            current = x.begin;
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
