(function (global) {

    global.test = test;

    function test()
    {
        // Miscellaneous tests

        //#BEGIN_TEST_DEV_ONLY
        
        // https://github.com/glathoud/js.metaret/issues/6
        // detect and forbid inline cycles

        ensure_error( 'inline( "inline f(); function f() { inline g(); } function g() { inline f(); }" );' 
                      , function (error)
                      {
                          var msg = ('' + error).toLowerCase();
                          return [ 'error', 'inline', 'infinite', 'recursion', 'metafun', 'metaret', 'instead' ].every( function (word) { return -1 < msg.lastIndexOf( word ); } );
                      }
                    );

        // https://github.com/glathoud/js.metaret/issues/7
        // Permit inlining across files.

        var  workspace  = {}
        ,   first_file  = 'function f() { "blah" }'
        ,   second_file = 'inline f();'

        ,   first_file_inlined  = inline( first_file, workspace, { path : "first.file.js" } )
        ,   second_file_inlined = inline( second_file, workspace, { path : "second.file.js" } )
        ;
        assert( 'v.first_file === v.first_file_inlined', { first_file : first_file, first_file_inlined : first_file_inlined } );
        assert( 'v.second_file !== v.second_file_inlined', { second_file : second_file, second_file_inlined : second_file_inlined } );
        assert( '!/\\binline\\b/.test( v )', second_file_inlined.replace( /^\/\/#INLINE_.*$/gm, '' ) );
        assert( ' /"blah"/.test( v )', second_file_inlined );
        

        // https://github.com/glathoud/js.metaret/issues/7
        // Permit inlining across files including access to some globals

        var  workspace  = {}
        ,   first_file  = 'var SOME_CONST = "blah"; function f() { return SOME_CONST; }'
        ,   second_file = 'inline f();'

        ,   first_file_inlined  = inline( first_file, workspace, { path : "first.file.js" } )
        ,   second_file_inlined = inline( second_file, workspace, { path : "second.file.js" } )
        ;
        assert( 'v.first_file === v.first_file_inlined', { first_file : first_file, first_file_inlined : first_file_inlined } );
        assert( 'v.second_file !== v.second_file_inlined', { second_file : second_file, second_file_inlined : second_file_inlined } );
        assert( '!/\\binline\\b/.test( v )', second_file_inlined.replace( /^\/\/#INLINE_.*$/gm, '' ) );
        assert( ' /\\bSOME_CONST\\b/.test( v )', second_file_inlined );


        // https://github.com/glathoud/js.metaret/issues/7
        // Permit inlining across files but forbid access to locally bound externals (closure).

        var  workspace  = {}
        ,   first_file  = '(function () { var SOME_CONST = "blah"; function f() { return SOME_CONST; } })()'
        ,   second_file = 'inline f();'

        ,   first_file_inlined  = inline( first_file, workspace, { path : "first.file.js" } )
        ;
        assert( 'v.first_file === v.first_file_inlined', { first_file : first_file, first_file_inlined : first_file_inlined } );
        assert( '!/\\binline\\b/.test( v )', second_file_inlined.replace( /^\/\/#INLINE_.*$/gm, '' ) );

        ensure_error( 'inline( this.second_file, this.workspace, { path : "second.file.js" } )'
                      , function (error)
                      {
                          var msg = ('' + error).toLowerCase();
                          return [ 'error', 'inline', 'across', 'files', 'local', 'closure', 'global' ].every( function (word) { return -1 < msg.lastIndexOf( word ); } );
                      }
                      , { second_file : second_file, workspace : workspace }
                    );
        
        // https://github.com/glathoud/js.metaret/issues/7
        //
        // Inlining within a file. The source body must be visible
        // to the target inline location.
        //
        ensure_error( 
            "inline( 'function f() { var a,b; return g(); function g() { inline var ret = i(); return ret; function h() { function i() { return a+b; } } } }' )"
            , function (error)
            {
                 var msg = ('' + error).toLowerCase();
                return [ 'error', 'inline', 'within', 'file', 'source', 'body', 'must be', 'visible', 'target', 'inline', 'location' ].every( function (word) { return -1 < msg.lastIndexOf( word ); } );
            }
        );
         
        // https://github.com/glathoud/js.metaret/issues/7
        //
        // Inlining within a file. Permit:
        // 
        //  * to inline any function that does not have any closure.
        // 
        assert( "2 === inline( 'function f() { return g(); function g() { var ret = inline i(); return ret; } }  function h() { function i() { \"i-body\"; } }' ).match( /i-body/g ).length" );
        //  * to share bound variables as long as they are defined
        // within a scope shared by the source body and the target
        // inline location.
        inline( 'function f() { var a,b; return g(); function g() { inline var ret = h(); return ret; function h() { return a+b; } } }' );

        ensure_error( 
            "inline( 'function f() { return g(); function g() { inline var ret = i(); } function h() { var a,b; function i() { return a+b; } } }' )"
            , function (error)
            {
                var msg = ('' + error).toLowerCase();
                return [ 'error', 'inline', 'within', 'file', 'source', 'body', 'must be', 'visible', 'target', 'inline', 'location' ].every( function (word) { return -1 < msg.lastIndexOf( word ); } );
            }
        );

        ensure_error(
            "inline( 'function f() { var a,b; inline var ret = g(); } var a,b; function g() { return a+b; }' )"
            , function (error)
            {
                var msg = ('' + error).toLowerCase();
                return [ 'error', 'inline', 'within', 'file', 'source', 'body', 'target', 'inline', 'location', 'must', 'share', 'bound', 'variables' ].every( function (word) { return -1 < msg.lastIndexOf( word ); } );
            }
        );
        
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

        // https://github.com/glathoud/js.metaret/issues/11
        // forbid `arguments` use within metafun body because the body will be inlined.

        ensure_error( 'var jscode = jsm2js("metafun f( self ) { arguments; }");'
                      , function (error)
                      {
                          var msg = ('' + error).toLowerCase();
                          return [ 'error', 'metafun', 'arguments', 'forbidden' ].every( function (word) { return -1 < msg.lastIndexOf( word ); } );
                      }
                    );
        
        //#END_TEST_DEV_ONLY

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

