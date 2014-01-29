(function (global) {

    global.test = test;

    function test()
    {

        // --- Tests with functions declared in ./expl_*.jsm files

        assert( "'function' === typeof fact" );
        assert( "'function' === typeof isOdd" );
        assert( "'function' === typeof isEven" );

        assert( '1 == fact(0)' );
        assert( '1 == fact(1)' );
        assert( '2 == fact(2)' );
        assert( '6 == fact(3)' );
        assert( '24 == fact(4)' );

        assert( 'false === isOdd( -4 )' );
        assert( 'true  === isOdd( -3 )' );
        assert( 'false === isOdd( -2 )' );
        assert( 'true  === isOdd( -1 )' );
        assert( 'false === isOdd( 0 )' );
        assert( 'true  === isOdd( 1 )' );
        assert( 'false === isOdd( 2 )' );
        assert( 'true  === isOdd( 3 )' );
        assert( 'false === isOdd( 4 )' );
        assert( 'true  === isOdd( 1001 )' );
        assert( 'false === isOdd( 1002 )' );
        assert( 'true  === isOdd( 1000001 )' );
        assert( 'false === isOdd( 1000002 )' );

        // No stack issue because the code has been unrolled
        assert( 'true  === isOdd( 10000001 )' );   
        assert( 'false === isOdd( 10000002 )' );

        assert( 'true  === isEven( -4 )' );
        assert( 'false === isEven( -3 )' );
        assert( 'true  === isEven( -2 )' );
        assert( 'false === isEven( -1 )' );
        assert( 'true  === isEven( 0 )' );
        assert( 'false === isEven( 1 )' );
        assert( 'true  === isEven( 2 )' );
        assert( 'false === isEven( 3 )' );
        assert( 'true  === isEven( 4 )' );
        assert( 'false === isEven( 1001 )' );
        assert( 'true  === isEven( 1002 )' );
        assert( 'false === isEven( 1000001 )' );
        assert( 'true  === isEven( 1000002 )' );

        // No stack issue because the code has been unrolled
        assert( 'false === isEven( 10000001 )' );   
        assert( 'true  === isEven( 10000002 )' );


        //#BEGIN_TEST_DEV_ONLY
        // --- Tests with functions declared programmatically

        // - Test the local `name2info`

        // For test purposes: same name 'fact2' as used below, 
        // but different function (just a sum)
        //
        // Since we are using a `local_name2info`
        // there must not be any impact on the 
        // global declaration 'fact2` further below

        var local_name2info = {}
        ,   local_fun = MetaFunction(
            'fact2' 

            , 'self,k,acc'

            , 'acc ||  (acc = 0);  '
                + 'if (k > 0)  metaret  self, k-1, acc + k;'  // sum
                + 'else        return acc;'

            , local_name2info
        )
        ;

        assert( '0 === v( 0 )', local_fun );
        assert( '1 === v( 1 )', local_fun );
        assert( '3 === v( 2 )', local_fun );
        assert( '6 === v( 3 )', local_fun );
        assert( '10 === v( 4 )', local_fun );

        // No stack issue because the code has been unrolled
        assert( '10000*10001/2 === v( 10000 )', local_fun );  

        // - Test global declarations with dotted names. 

        // For test purposes: same name 'fact2' as used above and below, but
        // different implementation (sum of squares).
        //
        // Since we are using a name space 'some.name.space' there must not be
        // any impact on the above local declaration, and on the similarly
        // named global declarations below.

        MetaDecl( 'some.name.space.fact2'
                  , 'self, k, acc'
                  , 'acc  ||  (acc = 0);'

                  // sum of squares
                  + 'if (k > 0)  metaret  self, k-1, acc + k * k;' 
                  
                  + 'else        return acc;'
                );

        assert( '0 === some.name.space.fact2( 0 )' );
        assert( '1 === some.name.space.fact2( 1 )' );
        assert( '5 === some.name.space.fact2( 2 )' );
        assert( '14 === some.name.space.fact2( 3 )' );
        assert( '30 === some.name.space.fact2( 4 )' );

        // No stack issue because the code has been unrolled
        assert( '10000 * 10001 * 20001 / 6 === some.name.space.fact2( 10000 )' )

        // - Test global declarations 'fact2', 'isEven2' and 'isOdd2' These
        //   implementations are similar as those in the script tag (see
        //   above, at the beginning).

        MetaDecl
        ( 
            'fact2'   
            , 'self,k,acc'
            , [ 
                'acc  ||  (acc = 1);'
                , 'if (k > 1)'

                // factorial
                , '    metaret self, k - 1, acc * k;'  
                
                , 'else'
                , '    return acc;'
            ].join( '\n' )
        );

        assert( '1 == fact2(0)' );
        assert( '1 == fact2(1)' );
        assert( '2 == fact2(2)' );
        assert( '6 == fact2(3)' );
        assert( '24 == fact2(4)' );

        assert( '1 == gcd( 7, 5 )' );
        assert( '5*13 == gcd( 2 * 5 * 7 * 13, 5 * 13 * 19 )' );

        // Let us try the "one string" variant
        MetaDecl
        (
            'metafun isEven2 ( self, n ) {'
                + ' if (n > 0)'
                + '    metaret isOdd2, n - 1;'
                + 'if (n < 0)'
                + '    metaret self, -n;'
                + 'return true;'
                + '}'
        );

        // Let us try the "one string" variant with "metafun" omitted
        MetaDecl  
        (
            'isOdd2(self,n) {'
                + 'if (n > 0)'
                + '    metaret isEven2, n - 1;'
                + 'if (n < 0)'
                + '    metaret self, -n;'
                + 'return false;'
                + '}'
        );

        assert( 'false === isOdd2( -4 )' );
        assert( 'true  === isOdd2( -3 )' );
        assert( 'false === isOdd2( -2 )' );
        assert( 'true  === isOdd2( -1 )' );
        assert( 'false === isOdd2( 0 )' );
        assert( 'true  === isOdd2( 1 )' );
        assert( 'false === isOdd2( 2 )' );
        assert( 'true  === isOdd2( 3 )' );
        assert( 'false === isOdd2( 4 )' );
        assert( 'true  === isOdd2( 1001 )' );
        assert( 'false === isOdd2( 1002 )' );
        assert( 'true  === isOdd2( 1000001 )' );
        assert( 'false === isOdd2( 1000002 )' );

        // No stack issue because the code has been unrolled
        assert( 'true  === isOdd2( 10000001 )' );  
        assert( 'false === isOdd2( 10000002 )' );

        assert( 'true  === isEven2( -4 )' );
        assert( 'false === isEven2( -3 )' );
        assert( 'true  === isEven2( -2 )' );
        assert( 'false === isEven2( -1 )' );
        assert( 'true  === isEven2( 0 )' );
        assert( 'false === isEven2( 1 )' );
        assert( 'true  === isEven2( 2 )' );
        assert( 'false === isEven2( 3 )' );
        assert( 'true  === isEven2( 4 )' );
        assert( 'false === isEven2( 1001 )' );
        assert( 'true  === isEven2( 1002 )' );
        assert( 'false === isEven2( 1000001 )' );
        assert( 'true  === isEven2( 1000002 )' );

        // No stack issue because the code has been unrolled
        assert( 'false === isEven2( 10000001 )' );
        assert( 'true  === isEven2( 10000002 )' );

        // --- Test again `local_fun` to make sure it as not been affected by
        // --- the global declaration `fact2`

        assert( '0 === v( 0 )', local_fun );
        assert( '1 === v( 1 )', local_fun );
        assert( '3 === v( 2 )', local_fun );
        assert( '6 === v( 3 )', local_fun );
        assert( '10 === v( 4 )', local_fun );

        // No stack issue because the code has been unrolled
        assert( '10000*10001/2 === v( 10000 )', local_fun );

        // --- Test again `some.name.space.fact2` to make sure it as not been
        // --- affected by the global declaration `fact2`

        assert( '0 === some.name.space.fact2( 0 )' );
        assert( '1 === some.name.space.fact2( 1 )' );
        assert( '5 === some.name.space.fact2( 2 )' );
        assert( '14 === some.name.space.fact2( 3 )' );
        assert( '30 === some.name.space.fact2( 4 )' );

        // No stack issue because the code has been unrolled
        assert( '10000 * 10001 * 20001 / 6 === some.name.space.fact2( 10000 )' );

        //#END_TEST_DEV_ONLY

        // --- sortedSearch: mutual recursion between 3 metafuns.

        var sortedArray = [ 0, 0, 0, 0, 1, 1, 3, 4, 6, 6, 7, 8, 9, 10, 10, 10,
                            11, 13, 14, 14, 15 ];
        assert( '"0###3" === sortedSearch( v, 0 ).join("###")', sortedArray );
        assert( '"4###5" === sortedSearch( v, 1 ).join("###")', sortedArray );
        assert( 'null === sortedSearch( v, 2 )', sortedArray );
        assert( '"8###9" === sortedSearch( v, 6 ).join("###")', sortedArray );
        assert( 'null === sortedSearch( v, 12 ) ', sortedArray );
        assert( '"18###19" === sortedSearch( v, 14 ).join("###")', sortedArray );
        assert( '"20###20" === sortedSearch( v, 15 ).join("###")', sortedArray );




        // ---

        console.log('All tests passed.');

        return true;
    }

    // ---

    function assert(codestring, /*?optional?*/v) 
    {
        if (!new Function( 'v', 'return ' + codestring + ';' )( v )) 
            throw new Error( 'Failed test: ' + codestring ); 
    }

    
})(this);

