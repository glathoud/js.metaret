(function (global) {

    global.test = test;

    function test()
    {
        // Miscellaneous tests

        

        // https://github.com/glathoud/js.metaret/issues/16
        // RegExp parsing should work fine based on acorn.
        
        var cp = codeparse( 'var a = b / c; var d = e / f;' );
        if (0 !== cp.regexpArr.length)
            throw new Error( 'RegExp: false positive!' );

        var cp = codeparse('a = b' + '\n' + '/hi/g.exec(c).map(d);' );  // Based on the remarks at the beginning of section 7 of the ECMAscript 5 spec.
        if (0 !== cp.regexpArr.length)
            throw new Error( 'RegExp: false positive!' );
        
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

