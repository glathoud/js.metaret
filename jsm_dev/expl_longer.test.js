(function (global) {

    global.test = test;

    function test()
    {

        // --- Tests with functions declared in ./expl_*.jsm files

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

