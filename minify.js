/*global minify need$ load lightparse*/

// Support both use cases: browser development (example: jsm_dev) and
// command-line transformation (example: jsm_dev -> jsm_out).
if (typeof lightparse === 'undefined')
    (typeof need$ !== 'undefined'  ?  need$  :  load)( "lightparse.js" );

(function (global) {

    global.minify = minify;

function minify( /*string*/code )
// Remove whitespaces and comments.
{
    var    lp = lightparse( code )
    , current = code.length
    , newcode = code
    ;
    minify_tree( lp.allTree );
    return newcode.replace( /^\s+/, '' );
    
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
}

})(this);
