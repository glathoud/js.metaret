if ('function' === typeof load  &&  'undefined' === typeof lightparse)
    load( 'lightparse.js' );  // V8, Rhino

var result, expected;
(function () {
    
    // Run the test on the `lightparse` implementation code itself.
    
    var code = '' + lightparse; 
    result = lightparse( code );

    // Define expectations

    expected = extractExpectations( code );

    // Conclude

    assert( 'arrEqual( result.commentArr, expected.commentArr )' );
    assert( 'arrEqual( result.regexpArr, expected.regexpArr )' );
    assert( 'arrEqual( result.strArr, expected.strArr )' );
    assert( 'arrEqual( result.reservedArr, expected.reservedArr )' );
    assert( 'arrEqual( result.callArr, expected.callArr )' );
    assert( 'arrEqual( result.dotArr, expected.dotArr )' );
    assert( 'arrEqual( result.dotcallArr, expected.dotcallArr )' );
    assert( 'arrEqual( result.identifierArr, expected.identifierArr )' );
    
    console.log( 'Successfuly tested `lightparse`.' );

    // --- Details
    
    function extractExpectations( code )
    {
        // Extract delimited pieces of code, as e.g. /*sq*/'blah'/**/
        // (`sq` stands for "single quote").

        var sA = []
        ,   cA = []
        ,  rxA = []
        , resA = []
        ,  caA = []
        ,   dA = []
        , dcaA = []
        ,   iA = []
        ,  ret = { strArr       : sA 
                   , commentArr : cA
                   , regexpArr  : rxA
                   , reservedArr : resA
                   , callArr       : caA
                   , dotArr        : dA
                   , dotcallArr    : dcaA
                   , identifierArr : iA
                 }
        ,   rx  = /((\/\*sq\*\/)([\s\S]*?)(\/\*\*\/))|((\/\*dq\*\/)([\s\S]*?)(\/\*\*\/))|((\/\*sc\*\/)([\s\S]*?)(\/\*\*\/))|((\/\*dc\*\/)([^\r\n]*)())|((\/\*rr\*\/)([\s\S]*?)(\/\*\*\/))/g
        ,   mo
        ;

        while (mo = rx.exec( code ))
        {
            for (var ind = 0, i = 1; !mo[i]; i+= 4, ind++) {}

            var begin        = mo.index
            ,   delimitBegin = mo[ i + 1 ]
            ,   str          = mo[ i + 2 ]
            ,   delimitEnd   = mo[ i + 3 ]
            ;
            
            cA.push( { begin : begin
                       , str : delimitBegin
                     } );
            begin += delimitBegin.length;


            (ind < 2  ?  sA  :  ind < 4  ?  cA  :  rxA)
                .push( { begin : begin , str : str } )
            ;
            begin += str.length;
            

            if (delimitEnd)  // None for //
            {
                cA.push( { begin : begin
                           , str : delimitEnd 
                         } );
            }
            
        }
        
        // White space the above things, so that we can then extract
        // reserved keywords and identifiers.

        var nakedCode = code;
        [ sA, cA, rxA ].forEach( do_whitespace );

        var rx_word = /(\.\s*)?(\b[_a-zA-Z]\w*\b)(\s*\()?/g
        ,   mo_word

        var reservedArr = lightparse.getDefaultReservedArr();
        var reservedObj = {};
        for (var i = reservedArr.length; i--;)  
            reservedObj[ reservedArr[ i ] ] = 1;
        
        while (mo_word = rx_word.exec( nakedCode ))
        {
            var str = mo_word[ 0 ]
            ,   dot = mo_word[ 1 ]
            ,  name = mo_word[ 2 ]
            ,  call = mo_word[ 3 ]
            ;
            (
                name in reservedObj  ?  resA
                : dot && call        ?  dcaA
                    : dot            ?    dA
                    : call           ?   caA
                    :                     iA
            )
                .push( { begin : mo_word.index , str : str , name : name } )
            ;
        }
        
        return ret;

        function do_whitespace( arr )
        {
            var nakedArr = nakedCode.split('');

            for (var i = arr.length; i--;)
            {
                var x = arr[ i ];
                for (var j = x.begin, j_end = j + x.str.length; j < j_end; j++)
                
                    nakedArr[ j ] = ' ';
            }
            
            nakedCode = nakedArr.join('');
        }
    }

    function arrEqual( a, b )
    {
        if (!(a instanceof Array)  ||  !(b instanceof Array)  ||  a.length !== b.length)
            return false;

        for (var i = a.length; i--;)
        {
            var ai = a[ i ]
            ,   bi = b[ i ]
            ;
            if (ai.begin !== bi.begin  ||  ai.str !== bi.str  ||  ai.name !== bi.name)
                return false;
        }
        
        return true;
    }

    function assert(codestring) 
    { 
        if (!eval( codestring )) throw new Error( 'Failed test: ' + codestring + 
                                                  'There must be a bug in `lightparse` and/or in the test implementation and/or ' + 
                                                  'an error in the delimiter comments in ./lightparse.js' 
                                                ); 
    }

})();
