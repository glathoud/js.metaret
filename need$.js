/*global need$ read XMLHttpRequest*/

var need$, read;

(function (global) {

    need$ = need$Impl;
    var has = {}
    , inline_workspace = {}
    ;

    // Load the metaret core necessary to support .jsm files

    var readNative = typeof read === 'function';  // e.g. V8
    need$.read = readNative  ?  read  :  xhrGetSync;  // xhrGetSync to simulate the exact same order as a build file

    need$( 'jsm2js.js' );
    need$( 'inline.js' );

    var canInline = true;

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

        // Because of inline & inline_workspace, we need to do load
        // dependencies right now, because inline is permitted across
        // files (see github issue #7).
	    //
	    // There were some issues with while( mo =
	    // NEED_RX.exec(code)) in some old versions of V8,
	    // so I replaced with the somewhat stupid version below (2 regexps).

	    var rx_str = "/need\\$\\s*\\(\\s*([\"\\'])([^\"\\']+)\\1/"
	    , rx_all  = new RegExp( rx_str, "g" )
	    , rx_one  = new RegExp( rx_str )

	    , need_all = code.match( /need\$\s*\(\s*(["\'])([^"\']+)\1/g )
	    ;
	while (need_all  &&  need_all.length)
	    need$Impl( need_all.shift().match( /need\$\s*\(\s*(["\'])([^"\']+)\1/ )[2] );
        
        if (isJsm)
        {
            code = jsm2js( code );

            if (canInline)
                code = inline( code, inline_workspace, { path : path } ); // `inline_workspace` to permit inlining accross files, see github issue #7 
        }

        eval.call( global, code );  // May include calls to `need$` -> load all missing files recursively.
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

})(this);
