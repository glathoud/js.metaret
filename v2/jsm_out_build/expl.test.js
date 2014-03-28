(function (global) {

    global.test = test;

    function test()
    {
        // Miscellaneous tests

        

        // ---

        'undefined' !== typeof console  &&  console.log('All tests passed.');

        return true;
    }
    
    // ---
 
    function ensure_error(codestring, testfun, /*?object?*/thisObj)
    {
        var success = false;
        try {
            new Function( codestring ).call( thisObj  ||  global );
        } catch (e) {
            if (testfun( e ))
                success = true;
            else
                throw new Error( 'Failed test: Caught an error as expected, but could not validate the error object. Test code: ' + codestring + ', error: ' + e );
        }

        if (!success)
            throw new Error( 'Failed test: Expected an error on ' + codestring );
    }

    function assert(codestring, /*?optional?*/v) 
    {
        if (!new Function( 'v', 'return ' + codestring + ';' )( v )) 
            throw new Error( 'Failed test: ' + codestring ); 
    }

    
})(this);

