(function (global) {

    global.test = test;

    function test()
    {
        assert( '"1,1,1"===to_be_inlined_imbricated().join(",")' );

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
