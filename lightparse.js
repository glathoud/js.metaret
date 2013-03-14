(function (global)
 {
     var RESERVED_ARR = [     // ECMAScript 5, Section 7.6
         
         "break", "case", "catch", "continue", "debugger", "default", "delete", "do", "else", "finally", "for", "function", "if", "in", "instanceof"
         , "new", "return", "switch", "this", "throw", "try", "typeof", "var", "void", "while", "with"
         
         , "class", "const", "enum", "export", "extends", "import", "super"
         
         , "implements", "interface", "let", "package", "private", "protected", "public", "static", "yield"
     ];
     
     global.lightparse = lightparse;
     
     // In the implementation of `lightparse`, the small comments
     // /*sc*/, /**/ etc. delimitate beginnings and ends of strings,
     // comments and regexps, for unit testing: ./lightparse_test.js

     function lightparse( /*sc*//*string*//**/code, /*sc*//*?object?*//**/opt )
     {
         var reservedArr = RESERVED_ARR.concat( (opt && opt.extraReservedArr)  ||  [] )
         ,   ret = {
             strArr : []
             , commentArr  : []
             , regexpArr   : []
             , reservedArr       : []
             , identifierArr     : []

             /*dc*/// The last three are derived from `identifierArr`, for convenience.
             , identifierReverse : []
             , identifierObj        : {}
             , identifierObjReverse : {}
         }
         ;

         /*dc*/// Detect comments and strings, and produce a "nakedCode"
         /*dc*/// string where they've all been replaced with spaces.

         var sA = ret.strArr
         ,   cA = ret.commentArr
         ,  rxA = ret.regexpArr
         , nakedCodeArr   = []
         , searchPosition = 0
         ;
         while (true)
         {
             /*dc*/// Search for a string or comment, whichever comes first

             var sq = code.indexOf( "'" , searchPosition )
             ,   dq = code.indexOf( '"' , searchPosition )
             ,   sc = code.indexOf( '/*', searchPosition )
             ,   dc = code.indexOf( '//', searchPosition )
             ,   rr = code.indexOf( '/',  searchPosition )

             ,   four = [ sq, dq, sc, dc, rr ]
             ,   begin = +Infinity
             ,   ind  = -1
             ;
             for (var n = four.length, i = 0; i < n; i++)
             {
                 var v = four[ i ];
                 if (-1 < v  &&  v < begin)
                 {
                     begin = v;
                     ind   = i;
                 }
             }

             if (ind < 0)
             {
                 /*dc*/// Not found

                 nakedCodeArr.push( code.substring( searchPosition ) );
                 break;
             }

             /*dc*/// Found: find its end

             var rest  = code.substring( begin )

             , rx =   ind === 0  ?  /*rr*//^[\s\S]*?[^\\]\'//**/
                 :    ind === 1  ?  /*rr*//^[\s\S]*?[^\\]\"//**/
                 :    ind === 2  ?  /*rr*//^\/\*[\s\S]*?\*\///**/
                 :    ind === 3  ?  /*rr*//^\/\/([^\r\n])*//**/
                 :                  /*rr*//^\/.*?[^\\]\/[gmi]?//**/

             , mo    = rx.exec( rest )
             , delta = mo  ?  mo.index + mo[ 0 ].length  :  rest.length
             , end   = begin + delta
             ;
             
             /*dc*/// Store

             (ind < 2  ?  sA  :  ind < 4  ?  cA  :  rxA).push( { begin : begin,  str : code.substring( begin, end ) } );

             /*dc*/// Prepare for identifier search

             nakedCodeArr.push(
                 code.substring( searchPosition, begin )
                 , str_repli( ' ', delta )
             );

             /*dc*/// Prepare for the next search

             searchPosition = end;

         }
         
         /*dc*/// Detect identifiers and reserved words
         
         var reservedObj = {};
         for (var i = reservedArr.length; i--;)  
             reservedObj[ reservedArr[ i ] ] = 1;
         
         var resA      = ret.reservedArr
         ,   iA        = ret.identifierArr
         ,   nakedCode = nakedCodeArr.join( '' )
         ,   rx        = /*rr*//\b[_a-zA-Z]\w*\b/g/**/
             , mo
         ;
         while ( mo = rx.exec( nakedCode ) )
         {
             var str = mo[ 0 ];
             (str in reservedObj  ?  resA  :  iA).push( { str : str,  begin : mo.index } );
         }
         
         /*dc*/// Identifiers: a few derived values, for convenience

         var iA = ret.identifierArr
         ,   iR = ret.identifierReverse = reversed( iA )
         
         ,   iO  = ret.identifierObj = {}
         ;
         for (var n = iA.length, i = 0; i < n; i++)
         {
             var x = iA[ i ];
             (
                 iO[ x.str ]  ||  (iO[ x.str ] = [])
             )
                 .push( x.begin )
             ;
         }
         
         var iOR = ret.identifierObjReverse = {};
         for (var str in iO) { if (!(str in iOR)) {

             iOR[ str ] = reversed( iO[ str ] );
             
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
