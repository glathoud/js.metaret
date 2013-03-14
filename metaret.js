/*global document console*/

// Guillaume Lathoud, 2011, 2013, MIT License, see ./LICENSE.TXT
// 
// Unit tests: ./metaret.html
//
// Idea:
//
// metafun fact( self, k, acc )
// {
//     acc || (acc = 1);
//     if (k > 1)
//        metaret self, k-1, acc*k;  // metacomposition (similar to [Backus78])
//     else
//        return acc;
// }
//
// Quick experiment in Javascript: Unroll the code similarly to [tomrec].
// -> Task: Detection of metaret + prevention of variable name collision.
//
// (mutual recursion is also supported)
//
// To avoid having to parse the whole code, and traverse complex
// syntax trees [tomrec], I decided to use simple "flat" regexps, hash
// all variable names, and use double comma in metaret calls:
//
//     metafun fact( self, k, acc )
//     {
//         acc  ||  (acc = 1);
//         if (k > 1)
//             metaret self # k - 1 # acc * k;
//         else
//             return acc;
//     }
//
// References
//
// [Backus78] "Can Programming Be Liberated from the von Neumann
// Style?  A Functional Style and Its Algebra of Programs", by John
// Backus, Communications of the ACM, August 1978 Volume 21 Number 8.
//
// [tomrec] http://glat.info/jscheck/tomrec_prod.html

if ('function' === typeof load  &&  'undefined' === typeof lightparse)
    load( 'lightparse.js' );  // V8, Rhino


;(function (global) {

    // The place of `self` in the parameters: 0:first place, 1:second
    // place, etc.
    var ACTION_PARAM = 0
    , METAFUN        = 'metafun'
    , METARET        = 'metaret'
    , EXTRA_RESERVED_ARR = [ METAFUN, METARET ]
    ;

    // ---------- Public API

    global.MetaDecl      = MetaDecl;      // Returns nothing, declares a function in the global name space
    global.MetaFunction  = MetaFunction;  // MetaFunction returns a function. Optionally you can give a local name space object.
    global.metaparse     = metaparse;     // Returns nothing. Search for script tags with type="text/js-metaret", parse and apply them.

    // ---------- Public API implementation
    
    var _metaparse_rx     = /\s*metafun\s*(\S+)\s*\(\s*([^\)]+?)\s*\)((?!metafun)[\s\S])*/g
    ,   _metaparse_one_rx = /^\s*metafun\s*(\S+)\s*\(\s*([^\)]+?)\s*\)\s*\{\s*(((?!metafun)[\s\S])*)\s*\}\s*$/
    ;
    function metaparse()
    {
        var noli = document.getElementsByTagName( 'script' );
        for (var n = noli.length, i = 0; i < n; i++)
        {
            var s = noli[ i ];
            if ('text/js-metaret-decl' !== s.getAttribute( 'type' ))
                continue;
            
            var metacode = s.textContent  ||  s.innerText
            ,   arr      = metacode.match( _metaparse_rx )
            ;
            for (var p = arr.length, j = 0; j < p; j++)
                MetaDecl( arr[ j ] );
        }
    }

    var _global_name2info = {};    
    function MetaDecl( /*single argument: code string | three arguments: name*/code_or_name, /*?string?*/param, /*?string?*/body )
    {
        if (arguments.length < 2)
        {
            // --- Single argument: code string

            // For convenience, prepend metafun automatically.
            var code  = /^\s*metafun\s/.test( code_or_name )  ?  code_or_name  :  'metafun' + code_or_name
            
            ,   mo    = _metaparse_one_rx.exec( code )
            ,   name  = mo[ 1 ]
            ;
            param = mo[ 2 ];
            body  = mo[ 3 ];
            
            MetaDecl( name, param, body );
            return;
        }
        
        // --- Three arguments

        var name = code_or_name;

        // Support for dotted names: automatically any missing part
        // within the global object.
        
        var dot_arr = name.split( '.' )
        ,   g       = global
        ;
        while (dot_arr.length > 1)
        {
            var next = dot_arr.shift();
            g = g[ next ]  ||  (g[ next ] = {});
        }
        
        // Now we are ready to create the metafunction
        
        g[ dot_arr[ 0 ] ] = MetaFunction( name, param, body, _global_name2info );
    }

    function MetaFunction(
        /*string*/name
        , /* string like "self,a,b,c" */param
        , /*string: code*/body
        , /*object*/name2info
    ) 
    // Returns a function `ret`. So it does not matter whether you
    // use `new MetaFunction(...)`, or just `MetaFunction(...)`.
    //
    // Advice: use the same name string as your target variable name:
    /*
      var fact = MetaFunction
      ( 
      'fact'            // <- same name string as the variable name `fact`
      , 'self,k,acc'     // hashes in all identifiers to make parsing easy without a full-fledged JS parser
      , [ 
      'acc  ||  (acc = 1);'
      , 'if (k > 1)'
      , '    metaret self # k - 1 # acc * k;'       // double comma to make parsing easy without a full-fledged JS parser
      , 'else'
      , '    return acc;'
      ].join( '\n' )
      );
    */
    {        
        _checkNameNotUsedYet( name2info, name );

        var info     = name2info[ name ]  = { name        : name  
                                              , origParam : param  
                                              , origBody  : body  
                                              , impl      : null         // Where we'll store the resulting unwrapped implementation, as soon as we need it.
                                              , name2info : name2info 
                                            }
        , paramArr   = info.paramArr      = _checkExtractParam( param )  
        , varArr     = info.varArr        = _extractVar( body )
        , metaretArr = info.metaretArr    = _checkExtractMetaret( body, paramArr.self, name )
        , solve      = info.solve         = _createSolver( info )
        ;
        
        if (metaretArr.hasAll( name2info ))
        {
            // If we can solve right away (e.g. self-recursion case),
            // then we do not need the `function ret()` check anymore.
            solve();
            ret = info.impl;
        }
        
        return ret;

        // Solve later (e.g. mutual recursion case where some of the
        // metaret actions (= other metafunctions) are not known yet).

        function ret (/*...*/) 
        { 
            if (!info.impl)
                solve();
            
            return info.impl.apply( null, arguments );
        }

    }

    // ---------- Private constant
    
    var _RX_NAME      = /^[a-zA-Z_][\w\.]*$/
        , _RX_PARAM   = /^((?:^\s*|\s*,\s*)[a-zA-Z_]\w*(?:\s*))+$/
        , _RX_ACTION  = /^[a-zA-Z_]\w*?(\.[a-zA-Z_]\w*?)*$/
        , _RX_METARET_ARGS = '^\\s+((\\S[\\S\\s]*?\\s*)(#\\s*\\S[\\S\\s]*?)*);'
    , _Aps            = Array.prototype.slice
    ;

    // ---------- Private function

    function _createSolver( info )
    {
        var name     = info.name
        , metaretArr = info.metaretArr
        , paramArr   = info.paramArr
        , varArr     = info.varArr
        , origBody   = info.origBody

        , name2info  = info.name2info
        ;

        return solve;
        
        function solve()
        {
            if (info.impl)  
                return;  // Done already

            // Not done yet. Make sure it is feasible.

            if (!metaretArr.hasAll( name2info ))
                throw new Error( 'MetaFunction : _createSolver : solve() could not resolve all dependencies yet for metafunction "' + name + '".' );
            
            if (!metaretArr.length)
                solveNoMetaret();
            else if (!metaretArr.hasOther())
                solveSelf();
            else
                solveMulti();
        }

        function solveNoMetaret()
        {
            console.warn( 'MetaFunction : _createSolver:solveNoMetaret() no #metaret in body of metafunction "' + name + '".' );
            
            var newParam = info.newParam = paramArr
            , newBody    = info.newBody  = origBody
            ;
            info.impl = new Function( newParam.join( ',' ), newBody );
        }

        function solveSelf()
        {
            var against = [ paramArr, origBody ]
            , label     = _generateAddName( 'L_' + name, against )  // Avoid collision
            , undefName = _generateAddName( 'undef', against )  // Avoid collision   
            , newParam  = info.newParam = paramArr
            , i4        = _indentGen( 4 )
            , i8        = _indentGen( 8 )
            , newBody   = info.newBody  = i4( 
                'var ' + undefName + ';\n' + 
                label + ': while (true) {\n' + 
                    i4( _reinitUndef( _replaceMetaretWithContinue( name2info, metaretArr, origBody, label, paramArr )
                                      , info.varArr
                                      , undefName )
                        + '\n'
                      ) +
                    '  return;\n' +
                    '}\n'
            )
            ;
            info.impl = new Function( newParam.join( ',' ), newBody );
        }

        function solveMulti()
        {
            // For simplicity and readability we opted for switch
            // (flat, maybe less variable name collision issues)
            // rather than expanding recursively (faster than switch,
            // but code duplication).
            
            var nameArr  = [ name ].concat( metaretArr.hasOther() )
            , infoArr    = nameArr.map( function (n) { return name2info[ n ]; } )
            , against    = infoArr.map( function (info) { return info.paramArr.concat( info.origBody ); } )
            , switch_ind_name = nameArr.switch_ind_name = _generateAddName( 'switch_ind', against )
            , switchLabel     = nameArr.switchLabel     = _generateAddName( 'L_switch', against )
            , undefName       = _generateAddName( 'undef', against )  // Avoid collision   
            ; 
            
            var i4     = _indentGen( 4 )
            , i8       = _indentGen( 8 )
            , i12      = _indentGen( 12 )
            , newParam = info.newParam = paramArr
            , newBody    = info.newBody = i4( [
                'var ' + undefName + ';'
                , 'var ' + switch_ind_name  + ' = 0;'
                , switchLabel + ': while (true) {'
                , i4( 'switch (' + switch_ind_name + ') {' )
            ].concat( 
                infoArr.map( info2code )
            ).concat( [
                i4( '}' )
                , i4( 'return;' )
                , '}'
                , ''
            ])).join( '\n' )
            ;
            
            info.impl = new Function( newParam.join( ',' ), newBody );

            function info2code( info, ind )
            {
                var code = [ 
                    ''
                    , '/* ' + info.name + ' */'
                    , 'case ' + ind + ':' 
                ]
                
                code.push( i4( _reinitUndef
                               ( 
                                   _replaceMetaretWithContinue( name2info, info.metaretArr, info.origBody, nameArr, against )
                                   , info.varArr
                                   , undefName
                               )
                             ) 
                         );
                
                code.push( 'break;' );
                code.push( '' );
                return code.map( i8 ).join( '\n' );
            }
        }

    }  // end of function _createSolver

    // ---------- Private implementation: deeper

    function _checkNameNotUsedYet(/*object*/name2info, /*string*/name)
    {
        if (!_RX_NAME.test( name ))  
            throw new Error(
                'MetaFunction : _checkNameNotUsedYet : Invalid function name "' + name + '". The function name must match [a-zA-Z_][a-zA-Z_0-9]*'
            );

        if (name in name2info)
            throw new Error(
                'MetaFunction : _checkNameNotUsedYet : Duplicate function name "' + name + '". The function name must be unique: ' + 
                    'MetaFunction can be called one time only with a given name.' 
            );

    }

    function _checkExtractParam( /*string*/param )  
    {
        if (!_RX_PARAM.test( param ))
            throw new Error('MetaFunction : _checkExtractParam : Invalid parameters string, the string must be like "self,x,y,z".')

        var ret = param.replace(/\s+/g, '' ).split( ',' );
        ret.self = ret.splice( ACTION_PARAM, 1 )[ 0 ];
        return ret;
    }

    function _extractVar( /*string*/body )
    {
        var lp = lightparse( body, { extraReservedArr : EXTRA_RESERVED_ARR } )
        ,   iA = lp.identifierArr
        , ret = []
        ;
        for (var n = iA.length, i = 0; i < n; i++)
        {
            var x = iA[ i ];
            ret.push( { text    : x.str
                        , end   : x.begin + x.str.length
                        , start : x.begin
                      }
                    );
            
        }
        return ret;
    }

    function _checkExtractMetaret( /*string*/body, /*string*/self, /*string*/selfName )
    {
        var lp = lightparse( body, { extraReservedArr : EXTRA_RESERVED_ARR } )
        , resA = lp.reservedArr
        , ret  = []
        ;

        // Remember

        ret.body     = body;
        ret.self     = self;
        ret.selfName = selfName;

        // Parse

        for (var resN = resA.length, resI = 0; resI < resN; resI++)
        {
            var x = resA[ resI ];
            if (x.str !== METARET)
                continue;

            var exprStr = body.substring( x.begin + x.str.length ).match( _RX_METARET_ARGS )[ 0 ]
            ,   exprArr = exprStr.split( '#' )
            , n         = exprArr.length
            ;
            for (var i = n ; i-- ; ) 
                exprArr[ i ] = exprArr[ i ].replace( /^\s+/, '' ).replace( /\s+$/, '' );
            
            var action = n > 1  &&  exprArr.splice( ACTION_PARAM, 1 )[ 0 ];
            if (!action)
                throw new Error('MetaFunction : _checkExtractMetaret() : A `metaret` needs at least an action.');
            
            if (action !== self  &&  !_RX_ACTION.test( action ))
            {
                throw new Error('MetaFunction : _checkExtractMetaret : Invalid action "' + action + '". action must be self ("' + self + 
                                '") or a named action (like "myOtherAction" or "my.other.action" or "my_other_action").'
                               );
            }
            
            var isSelf = action === self  ||  action === selfName;

            ret.push( { exprArr  : exprArr  // array of string
                        , isSelf : isSelf
                        , action : isSelf ? selfName : action   // string
                        , end    : x.begin + x.str.length + exprStr.length
                        , start  : x.begin
                      }
                    );
        }

        // Add convenience methods

        ret.hasOther = hasOther;
        ret.hasAll   = hasAll;

        return ret;
    }

    function hasOther()
    {
        var cache = 'hasOtherResult'; 
        if (cache in this)  
            return this[ cache ];

        var arr = [];

        for (var i = this.length; i--; )
        {
            if (!this[ i ].isSelf)
                arr.push( this[ i ].action );
        }
        
        return this[ cache ] = arr.length  &&  arr;
    }

    function hasAll(/*object*/name2info, /*?object?*/visited, /*?array of string?*/visitedArr)
    {
        // Returns  false | array of strings
     
        var topLevel = arguments.length < 2;
        if (topLevel)
        {
            var cache = 'hasAllResult';
            if (cache in this)  
                return this[ cache ];
        }

        // Do the (possibly recursive) search
        
        visited     ||  (visited = {});
        visitedArr  ||  (visitedArr = []);

        for (var i = this.length; i--; )
        {
            var x = this[ i ];
            if (x.isSelf)
                continue;

            var action = x.action;
            if (!action)
                throw new Error('MetaFunction : hasAll : Found a bug: empty metaret action (not permitted).');

            if (action in visited)  // Prevent infinite cycles
                continue;

            if (!(action in name2info))
                return false;       // Failure

            visited[ action ] = 1;
            visitedArr.push( action );

            if (!name2info[ action ].metaretArr.hasAll( name2info, visited, visitedArr ))
                return false;       // Failure
        }

        if (topLevel)
            return this[ cache ] = visitedArr;   // Success
        else
            return visitedArr;   // Not finished yet
    }
    
    function _dropAction( /*array of string*/paramArr )
    {
        return paramArr.slice( 0, ACTION_PARAM ).concat( paramArr.slice( ACTION_PARAM + 1 ) );
    }

    function _generateAddName( /*string*/baseName, /*array of ... */against)
    {
        var newName = _generateName( baseName, against );
        against.push( newName );
        return newName;
    }

    function _generateName( /*string*/baseName /*, ... recursive array of strings: string | array of ( string | array of ..) ... */ )
    {
        // Generate a string based on `baseName`, that cannot be found
        // in any of the strings in `against`.

        var against = _Aps.call( arguments, 1 );  // array of ...

        for (var i = null ; true ; i = (i >>> 0) + 1)
        {
            var label = '_' + baseName.replace( /\./g, '_' ) + (i || '') + '_';
            
            if (!match( against ))
                return label;  // success
            
            // failure
        }

        function match( /*array | string*/against )
        {
            if (typeof against === 'string')
                return -1 < against.indexOf( label );

            // array -> recurse (OR logic)

            for (var i = against.length; i--; )
            {
                if (match( against[ i ] ))
                    return true;
            }

            return false;
        }
    }

    function _replaceMetaretWithContinue( 
        name2info
        , metaretArr
        , origBody
        , /*string | array of string*/label_or_nameArr 
        /*, ... recursive array of strings: string | array of ( string | array ...) ... */ 
    )
    {
        var against = _Aps.call( arguments, 1 )  // Including `origBody`, `label` and `newVarArr`
        , isLabel   = typeof label_or_nameArr === 'string'
        , ret       = origBody
        ;
        for (var i = metaretArr.length; i--; )   // Downward order important
        {
            var metaret = metaretArr[ i ]
            , code      = prepareCode( metaret )
            ;
            ret = ret.slice( 0, metaret.start ) + code + ret.slice( metaret.end );
        }
        
        return ret;

        function prepareCode( metaret )
        {
            var code   = []
            , info     = name2info[ metaret.action ]
            , paramArr = info.paramArr
            , exprArr  = metaret.exprArr
            ;
            
            if (paramArr.length !== exprArr.length)
            {
                throw new Error( 'MetaFunction : _replaceMetaretWithContinue : prepareCode : Invalid number of metaret arguments, action  "' + 
                                 metaret.action + '" expects ' + paramArr.length + ' arguments, but ' + exprArr.length + ' were given.'
                               );
            }

            if (paramArr.length === 1)
            {
                code.push( paramArr[ 0 ] + ' = ' + exprArr[ 0 ] + ';' );
            }
            else
            {
                for (var i = 0, end = paramArr.length; i < end; i++)
                {
                    var varname  = paramArr[ i ]
                    , newVarname = _generateName( varname, against )
                    ;
                    against.push( newVarname );  // Prevent future collisions on this new name
                    
                    code.splice( i, 0, 'var ' + newVarname + ' = ' + exprArr[ i ] + ';' );
                    code.push( varname + ' = ' + newVarname + ';' );
                }
            }

            if (isLabel)
            {
                // self-recursion case  (continue <Label>)
                code.push( 'continue ' + label_or_nameArr + ';' );
            }
            else
            {
                // mutual recursion case (switch style)

                var nameArr  = label_or_nameArr;

                if (metaret.action === metaretArr.selfName)
                {
                    // Actually a self-recursion (switch style)
                    code.push( 'continue ' + nameArr.switchLabel + '; /* stay in: ' + metaret.action + ' */' );
                }
                else
                {
                    // Moving to the body of another metafunction (switch style)
                    var switch_ind = nameArr.indexOf( metaret.action );
                    if (0 > switch_ind)
                    {
                        throw new Error('MetaFunction : _replaceMetaretWithContinue : prepareCode : Found a bug! Could not find the switch index of action "' +
                                        metaret.action + '"' 
                                       );
                    }
                    
                    code.push( nameArr.switch_ind_name + ' = ' + switch_ind + '; /* go to: ' + metaret.action + ' */' );
                    code.push( 'continue ' + nameArr.switchLabel + ';' );
                }
            }   
            
            code.unshift( '{' );
            code.push( '}' );

            return code.join( '\n' ) + '\n';
        }

    }

    function _reinitUndef( /*string*/body, /*array of string*/varArr, /*string*/undefName )
    {
        var toReinit = []
        , textSeen   = {}
        ;
        for (var i = 0, i_end = varArr.length; i < i_end; i++ )
        {
            var v  = varArr[ i ]
            , text = v.text
            ;
            if (text in textSeen)
                continue;
            textSeen[ text ] = 1;

            var maybeDeclInd = body.search(new RegExp( text + '\\s*[,;]'));
            
            if (-1 < maybeDeclInd  &&  maybeDeclInd < v.end)
            {
                // Might well be a declaration without initialization.
                // To guarantee the same behaviour of the unrolled
                // code, we'll add an explicit reinit to `undefined`
                // at the begining of the unrolled code.
                toReinit.push( text );
            }
        }

        if (!toReinit.length)
            return body;  // unchanged

        return 'var ' + toReinit.map( function (s) { return s + ' = ' + undefName; } ).join( '\n, ' ) + (toReinit.length > 1 ? '\n' : '') + ';\n' + body;
    }

    function _indentGen( n ) 
    {
        var x = ' '
        , s   = []
        ;
        while (n)
        {
            if (n & 1)
                s.push( x );
            
            n >>= 1;
            x += x;
        }
        
        var s_indent = s.join( '' );
        return indentFun;

        function indentFun( /*string | array of string*/s_or_a)
        {
            if (typeof s_or_a === 'string')
            {
                var rxEol = /\n/;
                if (rxEol.test(s_or_a))
                    return s_or_a.split( rxEol ).map( indentFun ).join( '\n' );
                
                return s_indent + s_or_a;
            }
            
            return s_or_a.map( indentFun );
        }
    }

})(this);
