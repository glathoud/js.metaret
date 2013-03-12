(function (global)
{
    var RESERVED_ARR = [     // ECMAScript 5, Section 7.6       
        
        "break", "case", "catch", "continue", "debugger", "default", "delete", "do", "else", "finally", "for", "function", "if", "in", "instanceof"
        , "new", "return", "switch", "this", "throw", "try", "typeof", "var", "void", "while", "with"
        
        , "class", "const", "enum", "export", "extends", "import", "super"
        
        , "implements", "interface", "let", "package", "private", "protected", "public", "static", "yield"
    ];
    
    global.lightparse = lightparse;
    
    function lightparse( /*string*/code, /*?object?*/opt )
    {
        var reservedArr = RESERVED_ARR.concat( (opt && opt.extraReservedArr)  ||  [] )
        ,   ret = {
            strArr : []
            , commentArr  : []
            , reservedArr : []
            , identifierArr     : []
            , identifierReverse : []
            , identifierObj        : {}
            , identifierObjReverse : {}
        }
        ;

        // Detect comments and strings, and produce a "nakedCode"
        // string where they've all been replaced with spaces.

        var sA = ret.strArr
        ,   cA = ret.commentArr
        , nakedCode = code
        ;
        while (true)
        {
            var sq = nakedCode.indexOf( "'" )
            ,   dq = nakedCode.indexOf( '"' )
            ,   cs = nakedCode.indexOf( '/*' )
            ,   cd = nakedCode.indedOf( '//' )

            , max = Math.max( sq, dq, cs, cd )
            ;
            if (max < 0)
                break;

            // Which one came first

            var four = [ sq, dq, cs, cd ]
            ,   minV = +Infinity
            ,   ind  = -1
            ;
            for (var i = four.length; i--;)
            {
                var v = four[ i ];
                if (-1 < v  &&  v < minV)
                {
                    minV = v;
                    ind  = i;
                }
            }
            
            var begin = four[ ind ];

            // Find its end

            
            
        }
        
        // Detect identifiers and reserved words
        
        xxx

        // Identifiers: a few derived values, for convenience

        var iA = ret.identifierArr
        ,   iR = ret.identifierReverse = reversed( iA )
        
        ,   iO  = ret.identifierObj = {}
        ;
        for (var i = iA.length; i--;)
        {
            var x = iA[ i ];
            (
                iO[ x.name ]  ||  (iO[ x.name ] = [])
            )
                .push( x.begin )
            ;
        }
        
        var iOR = ret.identifierObjReverse = {};
        for (var name in iO) { if (!(name in iOR)) {

            iOR[ name ] = reversed( iO[ name ] );
            
        }}
                
        return ret;
    }

    // --- Detail

    function reversed( arr )
    {
        var ret = [].concat( arr );
        ret.reverse();
        return ret;
    }
})(this);

