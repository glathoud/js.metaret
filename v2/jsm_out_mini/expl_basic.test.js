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


        


        // ---

        'undefined' !== typeof console  &&  console.log('All tests passed.');

        return true;
    }

    // ---

    function assert(codestring, /*?optional?*/v) 
    {
        if (!new Function( 'v', 'return ' + codestring + ';' )( v )) 
            throw new Error( 'Failed test: ' + codestring ); 
    }

    
})(this);

