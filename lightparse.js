(function (global)
 {
     var RESERVED_ARR = [     // ECMAScript 5, Section 7.6       
         
         "break", "case", "catch", "continue", "debugger", "default", "delete", "do", "else", "finally", "for", "function", "if", "in", "instanceof"
         , "new", "return", "switch", "this", "throw", "try", "typeof", "var", "void", "while", "with"
         
         , "class", "const", "enum", "export", "extends", "import", "super"
         
         , "implements", "interface", "let", "package", "private", "protected", "public", "static", "yield"
     ];
     
     global.lightparse = lightparse;
     
     function lightparse( /*string*/code, /*?object?*/opt )
     {
         var reservedArr = RESERVED_ARR.concat( (opt && opt.extraReservedArr)  ||  [] )
         ,   ret = {
             strArr : []
             , commentArr  : []
             , reservedArr : []
             , identifierArr     : []
             , identifierReverse : []
             , identifierObj        : {}
             , identifierObjReverse : {}
         }
         ;

         // Detect comments and strings, and produce a "nakedCode"
         // string where they've all been replaced with spaces.

         var sA = ret.strArr
         ,   cA = ret.commentArr
         , nakedCodeArr   = []
         , searchPosition = 0
         ;
         while (true)
         {
             var sq = code.indexOf( "'" , searchPosition )
             ,   dq = code.indexOf( '"' , searchPosition )
             ,   cs = code.indexOf( '/*', searchPosition )
             ,   cd = code.indedOf( '//', searchPosition )

             , max = Math.max( sq, dq, cs, cd )
             ;
             if (max < 0)
             {
                 // Not found

                 nakedCodeArr.push( code.substring( searchPosition ) );
                 break;
             }

             // Found: which one came first

             var four = [ sq, dq, cs, cd ]
             ,   minV = +Infinity
             ,   ind  = -1
             ;
             for (var i = four.length; i--;)
             {
                 var v = four[ i ];
                 if (-1 < v  &&  v < minV)
                 {
                     minV = v;
                     ind  = i;
                 }
             }
             
             var begin = minV
             ,   rest  = code.substring( begin )
             ;

             // Find its end

             var rx = i === 0  ?  /^.*?[^\\]\'/
                 :    i === 1  ?  /^.*?[^\\]\"/
                 :    i === 2  ?  /^.*?\*\//
                 :                /^.*?[\r\n]/
                 , mo = rx.exec( rest )
             , delta = mo  ?  mo.index + mo[ 0 ].length  :  rest.length
             , end   = begin + delta
             ;
             
             // Store

             (i < 2  ?  sA  :  cA).push( [ begin, end ] );

             // Prepare for identifier search

             nakedCodeArr.push(
                 code.substring( searchPosition, begin )
                 , str_repli( ' ', delta )
             );

             // Prepare for the next search

             searchPosition = begin;

         }
         
         // Detect identifiers and reserved words
         
         var reservedObj = {};
         for (var i = reservedArr.length; i--;)  
             reservedObj[ reservedArr[ i ] ] = 1;
         
         var rA        = ret.reservedArr
         ,   iA        = ret.identifierArr
         ,   nakedCode = nakedCodeArr.join( '' )
         ,   rx        = /\b[_a-zA-Z]\w*\b/
             , mo
         ;
         while ( mo = rx.exec( nakedCode ) )
         {
             var name = mo[ 0 ];
             (name in reservedObj  ?  rA  :  iA).push( { name : name, begin : mo.index } );
         }
         
         // Identifiers: a few derived values, for convenience

         var iA = ret.identifierArr
         ,   iR = ret.identifierReverse = reversed( iA )
         
         ,   iO  = ret.identifierObj = {}
         ;
         for (var i = iA.length; i--;)
         {
             var x = iA[ i ];
             (
                 iO[ x.name ]  ||  (iO[ x.name ] = [])
             )
                 .push( x.begin )
             ;
         }
         
         var iOR = ret.identifierObjReverse = {};
         for (var name in iO) { if (!(name in iOR)) {

             iOR[ name ] = reversed( iO[ name ] );
             
         }}
         
         return ret;
     }

     // --- Detail

     function reversed( arr )
     {
         var ret = [].concat( arr );
         ret.reverse();
         return ret;
     }


     function str_repli(/*string*/s, /*positive number*/n) 
     {
         return str_filler(s, n)();
     }


     function str_trim(/*string*/s) 
     {
         return s.replace(/(^\s*|\s*$)/g, '');
     }
     
     function str_filler(/*?string?*/f, /*number, negative to fill on the left, positive to fill on the right*/n) 
     {
         
         if (typeof f === 'number') {
             n = f;
             f = null;
         }

         f = f || ' ';

         var target = Math.abs( n ) * f.length;

         return function (/*string*/s) {

             s = s || '';

             s = s + ''; // Force conversion to string

             var remaining = Math.max( 0, target - s.length )
             ,   tmp = f
             ,   fill = []
             ;

             for (var p = Math.floor( remaining / f.length ) + (((remaining % f.length) > 0) ? 1 : 0);
                  p > 0;
                  tmp += tmp, p >>= 1) {
                 
                 if (p && 1)
                     fill.push( tmp );
             }
             
             fill = fill.join( '' );

             if (fill.length > remaining)
                 fill = (n < 0) ? fill.substring( fill.length - remaining ) : fill.substring( 0, remaining );
             
             if (fill.length !== remaining)
                 throw new Error( 'str.filler() is buggy!' );

             return (n < 0) ? (fill + s) : (s + fill);
         };
     }

})(this);
