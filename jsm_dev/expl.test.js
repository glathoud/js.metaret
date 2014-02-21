(function (global) {

    global.test = test;

    function test()
    {
        // Miscellaneous tests

        //#BEGIN_TEST_DEV_ONLY
        
        // https://github.com/glathoud/js.metaret/issues/9
        // error messages for beginner

        ensure_error( 'var jscode = jsm2js("function () { metaret; }");'
                      , function (error) 
                      { 
                          var msg = '' + error;
                          return /\berror\b/i.test( msg )  &&  /\bjsm2js\b/i.test( msg )  && /\bmetafun\b/i.test( msg )  &&  /\bmetaret\b/i.test( msg )  &&
                              /leftover/i.test( msg );
                      }
                    );

        ensure_error( 'inline( "inline f(); function f() { console.log( arguments ); }" )'
                      , function (error)
                      {
                          var msg = '' + error;
                          return /\binline\b/i.test( msg )  &&  /\berror\b/i.test( msg )  &&  /\barguments\b/i.test( msg )  &&  /\bbody\b/i.test( msg );
                      }
                    );
        
        //#END_TEST_DEV_ONLY

        // ---

        'undefined' !== typeof console  &&  console.log('All tests passed.');

        return true;
    }
    
    // ---
 
    function ensure_error(codestring, testfun)
    {
        var success = false;
        try {
            eval.call( global, codestring );
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

