/*global need$ read XMLHttpRequest*/

var need$, read;

(function () {

    need$ = need$Impl;
    var has = {};

    // Load the metaret core necessary to support .jsm files

    var readNative = typeof read === 'function';  // e.g. V8
    need$.read = readNative  ?  read  :  xhrGetSync;  // xhrGetSync to simulate the exact same order as a build file

    need$( 'jsm2js.js' );

    // Implementation

    function need$Impl( /*string*/path )
    {
        if (has[ path ])
            return;

        has[ path ] = 1;

        var isJsm;

        if (/\.js$/.test( path ))
            isJsm = false;
        else if (/\.jsm$/.test( path ))
            isJsm = true;
        else 
            throw new Error( "need$: unknown type, only .js and .jsm are supported. Path: '" + path + "'" );

        var code = need$.read( path );
        
        if (isJsm)
            code = jsm2js( code );

        new Function( code )();  // May include calls to `need$` -> load all missing files recursively.
    }
    
    function xhrGetSync( path )
    // Synchronous (i.e. blocking) XHR to simulate exactly the same
    // order as if we had a single build file.
    //
    // Returns a string, contents of the file at `path`.
    {
        var xhr = new XMLHttpRequest();
        xhr.open( "GET", path, /*async:*/false );
        xhr.send();

        if (xhr.status !== 0  &&  xhr.status !== 200)
            throw new Error( "need$:xhrGetSync: Could not load path '" + path + "'" );

        return xhr.responseText + "\r\n//@ sourceURL=" + path;
    }

})();
