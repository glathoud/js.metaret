
//#BUILD_BEGIN_FILE: "need$.js"


{
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

    
//#BUILD_BEGIN_FILE: "jsm2js.js"


{
/*global metaparse jsm2js lp2fmtree codeparse need$ load*/

// Support both use cases: browser development (example: jsm_dev) and
// command-line transformation (example: jsm_dev -> jsm_out).
if (typeof codeparse === 'undefined')
    
//#BUILD_BEGIN_FILE: "codeparse.js"


{
(function (global)
 {
     var RETURN = 'return'
     ,   VAR    = 'var'
     ,   RESERVED_ARR = [     // ECMAScript 5, Section 7.6
         
         "break", "case", "catch", "continue", "debugger", "default", "delete", "do", "else", "finally", "for", "function", "if", "in", "instanceof"
         , "new", RETURN, "switch", "this", "throw", "try", "typeof", VAR, "void", "while", "with"
         
         , "class", "const", "enum", "export", "extends", "import", "super"
         
         , "implements", "interface", "let", "package", "private", "protected", "public", "static", "yield"
     ]
     , EXTRA_BRACKET_ARR = [
         { open : RETURN, close : ';', typebracket : RETURN, ignore_unbalanced : true }
         , { open : VAR,  close : [ ';', 'in' ], typebracket : VAR, ignore_unbalanced : true }
     ]
	 , _emptyObj = {}
     ;
     
     global.codeparse = codeparse;
     
     codeparse.getDefaultReservedArr = getDefaultReservedArr; 

     // --- Implementation
     
     function getDefaultReservedArr() { return [].concat( RESERVED_ARR ); }

     // In the implementation of `codeparse`, the small comments
     // /*sc*/, /**/ etc. delimitate beginnings and ends of strings,
     // comments and regexps, for unit testing: ./codeparse_test.js

     function codeparse( /*sc*//*string*//**/code, /*sc*//*?object?*//**/opt )
     /*{0*/{
         var /*vd*/reservedArr/**/ = ((opt  &&  opt.reservedArr)  ||  RESERVED_ARR).concat( (opt  &&  opt.extraReservedArr)  ||  [] )
         ,   /*vd*/extraBracketArr/**/ = EXTRA_BRACKET_ARR.concat( (opt  &&  opt.extraBracketArr)  ||  [] )
         ,   /*vd*/ret/**/ = /*{1*/{
             strArr : []
             , commentArr  : []
             , regexpArr   : []

             , reservedArr       : []
             , reservedObj       : /*{1.1*/{}/*}1.1*/

             , callArr           : []
             , dotArr            : []
             , dotcallArr        : []
             , identifierArr     : []

             /*dc*/// The last three are derived from `identifierArr`, for convenience.
             , identifierArrReverse : []
             , identifierObj        : /*{1.2*/{}/*}1.2*/
             , identifierObjReverse : /*{1.3*/{}/*}1.3*/

	     /*dc*/// Derived from callArr, for convenience
	     , callObj              : /*{1.4*/{}/*}1.4*/
             
             /*dc*/// Bracket pairs
             , bracketcurlyArr          : []
             , bracketroundArr          : []
             , bracketsquareArr         : []
             , bracketextraArr          : []

             /*dc*/// Brackets: derived values
             , bracketArr               : []
             , bracketTree              : []

         }/*}1*/
         ;

         /*dc*/// Detect comments and strings, and produce a "nakedCode"
         /*dc*/// string where they've all been replaced with spaces.

         var /*vd*/sA/**/ = ret.strArr
         ,   /*vd*/cA/**/ = ret.commentArr
         ,  /*vd*/rxA/**/ = ret.regexpArr
         , /*vd*/nakedCodeArr/**/   = []
         , /*vd*/searchPosition/**/ = 0
         ;
         while (true)
         /*{2*/{
             /*dc*/// Search for a string or comment, whichever comes first

             var /*vd*/sq/**/ = code.indexOf( /*dq*/"'"/**/ , searchPosition )
             ,   /*vd*/dq/**/ = code.indexOf( /*sq*/'"'/**/ , searchPosition )
             ,   /*vd*/sc/**/ = code.indexOf( /*sq*/'/*'/**/, searchPosition )
             ,   /*vd*/dc/**/ = code.indexOf( /*sq*/'//'/**/, searchPosition )
             ,   /*vd*/rr/**/ = code.indexOf( /*sq*/'/'/**/,  searchPosition )
		 ;
	     /*dc*/// Do not see a divide operator `/` as the beginning of a regexp
	     if (-1 < rr  &&  !/*rr*//^\/(?![\*\/])(\\[^\r\n]|[^\\\r\n])+?\/[gmi]?//**/.test(code.substring(rr)))
		 rr = -1;
	     
             var /*vd*/four/**/ = [ sq, dq, sc, dc, rr ]
             ,   /*vd*/begin/**/ = +Infinity
             ,   /*vd*/ind/**/  = -1
             ;
             for (var /*vd*/n/**/ = four.length, /*vd*/i/**/ = 0; i < n; i++)
             /*{2.1*/{
                 var /*vd*/v/**/ = four[ i ];
                 if (-1 < v  &&  v < begin)
                 /*{2.1.1*/{
                     begin = v;
                     ind   = i;
                 }/*}2.1.1*/
             }/*}2.1*/

             if (ind < 0)
             /*{2.2*/{
                 /*dc*/// Not found

                 nakedCodeArr.push( code.substring( searchPosition ) );
                 break;
             }/*}2.2*/

             /*dc*/// Found: find its end

             var /*vd*/rest/**/  = code.substring( begin )

             , /*vd*/rx/**/ =   ind === 0  ?  /*rr*//^[\s\S]*?[^\\]\'//**/
                 :    ind === 1  ?  /*rr*//^[\s\S]*?[^\\]\"//**/
                 :    ind === 2  ?  /*rr*//^\/\*[\s\S]*?\*\///**/
                 :    ind === 3  ?  /*rr*//^\/\/([^\r\n])*//**/
                 :                  /*rr*//^\/(?![\*\/])(\\[^\r\n]|[^\\\r\n])+?\/[gmi]?//**/

             , /*vd*/mo/**/    = rx.exec( rest )
             , /*vd*/delta/**/ = mo  ?  mo.index + mo[ 0 ].length  :  rest.length
             , /*vd*/end/**/   = begin + delta
             ;
             
             /*dc*/// Store

             (ind < 2  ?  sA  :  ind < 4  ?  cA  :  rxA).push( /*{2.3*/{ begin : begin,  str : code.substring( begin, end ) }/*}2.3*/ );

             /*dc*/// Prepare for identifier search

             nakedCodeArr.push(
                 code.substring( searchPosition, begin )
                 , str_repli( /*sq*/' '/**/, delta )
             );

             /*dc*/// Prepare for the next search

             searchPosition = end;

         }/*}2*/
         
         /*dc*/// Detect identifiers and reserved words
         
         var /*vd*/reservedSet/**/ = /*{2a*/{}/*}2a*/;
         for (var /*vd*/i/**/ = reservedArr.length; i--;)  
             reservedSet[ reservedArr[ i ] ] = 1;
         
         var /*vd*/resA/**/      = ret.reservedArr
         ,   /*vd*/caA/**/       = ret.callArr
         ,   /*vd*/dA/**/        = ret.dotArr
         ,   /*vd*/dcaA/**/      = ret.dotcallArr
         ,   /*vd*/iA/**/        = ret.identifierArr
         ,   /*vd*/nakedCode/**/ = nakedCodeArr.join( /*sq*/''/**/ )
         ,   /*vd*/rx/**/        = /*rr*//(\.\s*)?(\b[_a-zA-Z]\w*\b)(\s*\()?/g/**/
         
         ,   /*vd*/mo/**/
         ;
         while (mo = rx.exec( nakedCode ))
         /*{3*/{
             var  /*vd*/str/**/ = mo[ 0 ]
             ,    /*vd*/dot/**/ = mo[ 1 ]
             ,   /*vd*/name/**/ = mo[ 2 ]
             ,   /*vd*/call/**/ = mo[ 3 ]
             ,   /*vd*/arr/**/  = (
                 name in reservedSet  ?  resA  
                     : dot && call    ?  dcaA
                     : dot            ?    dA
                     : call           ?   caA
                     :                     iA
             )
             ,   /*vd*/begin/**/ = mo.index
             ,   /*vd*/x/**/     = /*{3.a1*/{ str : str,  begin : begin , name : name }/*}3.a1*/ 
             ;             
             arr.push( x );

         }/*}3*/
         
         
         /*dc*/// Curly brackets (blocks of code or objects).
         
         /*dc*/// - First, white out each regexp.
         var /*vd*/nakedCodeNoRx/**/ = nakedCode;
         for (var /*vd*/i/**/ = rxA.length; i--;)
         /*{6*/{
             var /*vd*/x/**/ = rxA[ i ]
             , /*vd*/len/**/ = x.str.length
             ;
             nakedCodeNoRx = nakedCodeNoRx.substring( 0, x.begin ) + 
                 str_repli( /*sq*/' '/**/, len ) + 
                 nakedCodeNoRx.substring( x.begin + len )
             ;
         }/*}6*/
         
         /*dc*/// - Second, find bracket pairs.

         var /*vd*/bcA/**/ = ret.bracketcurlyArr
         ,   /*vd*/brA/**/ = ret.bracketroundArr
         ,   /*vd*/bsA/**/ = ret.bracketsquareArr
         ,   /*vd*/beA/**/ = ret.bracketextraArr

         ,    /*vd*/bA/**/ = ret.bracketArr

         , /*vd*/find_bracket_cfg/**/ = [
             /*{7a*/{
                 out_arr : bcA
                 , open  : /*sq*/'{'/**/
                 , close : /*sq*/'}'/**/
                 , typebracket  : /*sq*/'curly'/**/
             }/*}7a*/
             , /*{7b*/{
                 out_arr : brA
                 , open  : /*sq*/'('/**/
                 , close : /*sq*/')'/**/
                 , typebracket  : /*sq*/'round'/**/
             }/*}7b*/
             , /*{7c*/{
                 out_arr : bsA
                 , open  : /*sq*/'['/**/
                 , close : /*sq*/']'/**/
                 , typebracket  : /*sq*/'square'/**/
             }/*}7c*/
         ].concat( extraBracketArr.map( function (x) /*{7d*/{
             
             var /*vd*/ret/**/ = Object.create( x ); 
             ret.out_arr = beA; 
             return ret; 
             
         }/*}7d*/ ) )
         ;
         
         find_bracket( find_bracket_cfg, nakedCodeNoRx, code, bA );
                 
         build_bracket_tree( bA, ret.bracketTree );
         build_bracket_sep_split( bA, nakedCodeNoRx, code, reservedArr );
         build_bracket_var_leftstr_rightstr( bA, cA );

         /*dc*/// Mark which identifier instances are var declarations.
         
         var /*vd*/tmp/**/ = bA
             .filter( function (x) /*{c8*/{ return x.typebracket === VAR; }/*}c8*/ )
             .reduce( function (a,b) /*{b8*/{ return a.concat( b.sepSplit ); }/*}b8*/
                      , [] 
                    )
         ;
         for (var /*vd*/iA_i/**/ = 0
              , /*vd*/n/**/ = tmp.length
              , /*vd*/niA/**/ = iA.length
              , /*vd*/i/**/ = 0; i < n  &&  iA_i < niA ; i++)
         /*{a8*/{
             var /*vd*/x/**/ = tmp[ i ]
             ,  /*vd*/id/**/
             ;
             while ((id = iA[ iA_i ]).begin < x.begin)
             /*{a8.1*/{
                 id.isVardecl = false;
                 iA_i++;
             }/*}a8.1*/
             id.isVardecl = true;
             iA_i++;
         }/*}a8*/
         

         /*dc*/// Identifiers: a few derived values, for convenience

         var /*vd*/iA/**/ = ret.identifierArr
         ,   /*vd*/iR/**/ = ret.identifierArrReverse = reversed( iA )
         ,  /*vd*/vdA/**/ = ret.vardeclArr = []
         
         ,   /*vd*/iO/**/  = ret.identifierObj = /*{3a*/{}/*}3a*/
         ;
         for (var /*vd*/n/**/ = iA.length, /*vd*/i/**/ = 0; i < n; i++)
         /*{4*/{
             var /*vd*/x/**/ = iA[ i ];
             (
	      iO[ x.str ] !== _emptyObj[ x.str ] ? iO[ x.str ] : (iO[ x.str ] = [])
             )
                 .push( x.begin )
             ;

             if (x.isVardecl)
                 vdA.push( x );
         }/*}4*/
         
	 var /*vd*/cA/**/ = ret.callArr
	     ,  /*vd*/cO/**/ = ret.callObj = /*{4b*/{}/*}4b*/
	 ;
	 for (var /*vd*/n/**/ = cA.length, /*vd*/i/**/=0; i <n; i++)
	     /*{4c*/{
	     var /*vd*/x/**/ = cA[ i ];
	     (
	      cO[ x.name ] !== _emptyObj[ x.name ]  ?  cO[ x.name ]  :  (cO[ x.name ] = [])
	      )
		 .push( x.begin )
		 ;
	 }/*}4c*/

         var /*vd*/iOR/**/ = ret.identifierObjReverse = /*{a5*/{}/*}a5*/;
         for (var /*vd*/str/**/ in iO) /*{5*/{ if (!(str in iOR)) /*{5.1*/{

             iOR[ str ] = reversed( iO[ str ] );
             
         }/*}5.1*/}/*}5*/


         /*dc*/// Reserved words: a few derived values, for convenience
         var /*vd*/rA/**/ = ret.reservedArr
         ,   /*vd*/rO/**/ = ret.reservedObj
         ;
         for (var /*vd*/n/**/ = rA.length, /*vd*/i/**/ = 0; i < n ; i++)
         /*{6a*/{
             var /*vd*/x/**/ = rA[ i ];
             (
	      rO[ x.name ] !== _emptyObj[ x.name ]  ? rO[ x.name ] :  (rO[ x.name ] = [])
             )
                 .push( x.begin );
         }/*}6a*/
                  

         /*dc*/// All elements, in both first-to-last and reverse orders.
         /*dc*/// Also add a `type` field to each element.

         var /*vd*/all/**/ = ret.all = [];
         
         for (var /*vd*/k/**/ in ret) /*{8*/{
             
             var /*vd*/mo/**/ = k.match( /*rr*//^(.+)Arr$//**/ );
             if (mo)
             /*{8.1*/{
                 var /*vd*/arr/**/ = ret[ k ]
                 ,  /*vd*/type/**/ = mo[ 1 ]
                 ;
                 for (var /*vd*/i/**/ = arr.length; i--;)
                     arr[ i ].type = type;

                 all.push.apply( all, arr );                 
             }/*}8.1*/
         }/*}8*/
       
         /*dc*/// Guarantee all have "end", guarantee unicity
         for (var /*vd*/i/**/ = all.length; i--;)
         /*{9*/{
             var /*vd*/xi/**/ = all[ i ];
             if (!(/*sq*/'end'/**/ in xi))
                 xi.end = xi.begin + xi.str.length;
         }/*}9*/

         all.sort( compare_begin_end ); /*dc*/// This sort prepares to build a tree
         
         /*dc*/// Guarantee unicity
         for (var /*vd*/i/**/ = all.length; --i;)
         /*{10*/{
             var /*vd*/xi/**/ = all[ i ]
             , /*vd*/xim1/**/ = all[ i - 1 ]
             ;
             if (xi.begin === xim1.begin  &&  xi.end === xim1.end)
             /*{10.1*/{
                 if (xi.type !== xim1.type) /*dc*/// Sanity check
                     throw new Error( /*dq*/"Internal bug."/**/ );
                 all.splice( i, 1 );
             }/*}10.1*/
         }/*}10*/

         ret.allReverse = reversed( all );

         /*dc*/// Build a tree
         var /*vd*/allTree/**/ = [].concat( all );

         for (var /*vd*/i/**/ = allTree.length - 1; i--; )
         /*{11*/{
             var /*vd*/xi/**/ = allTree[ i ]
             ,   /*vd*/xip1/**/
             ;
             while (xip1 = allTree[ i + 1 ]
                    , xip1  &&  
                    xi.begin <= xip1.begin  &&  xip1.end <= xi.end
                   )
             /*{11.1*/{
                 (xi.children  ||  (xi.children = []))
                     .push( allTree.splice( i+1, 1 )[ 0 ] )
                 ;
             }/*}11.1*/
         }/*}11*/
             
         ret.allTree = allTree;
         
         return ret;
             
     }/*}0*/

     // --- Detail

     function compare_begin (a,b) { return a.begin < b.begin  ?  -1  :  +1; }

     function compare_begin_end (a,b) { return a.begin < b.begin  ?  -1  :  a.begin > b.begin  ?  +1  :  a.end > b.end  ?  -1  :  +1; }

     function build_bracket_tree( /*array*/inArr, /*array*/outTree )
     {
         var pile = [];
         for (var n = inArr.length, i = 0; i < n; i++)
         {
             var x = inArr[ i ];
             x.bracketchildren = [];

             // Close
             
             var last;
             while ((last = pile[ pile.length - 1])  &&  last.end < x.begin)
                 pile.pop();
             
             // Append

             x.bracketparent   = last  ?  last  :  null;
             x.bracketdepth    = pile.length;
             
             if (last  &&  x.begin < last.end)
                 last.bracketchildren.push( x );

             else
                 outTree.push( x );
             
             // Open

             pile.push( x );
         }
     }


     function build_bracket_sep_split( /*array*/bA, /*string*/nakedCodeNoRx, /*string*/code, /*array of string*/reservedArr )
     {
         for (var i = bA.length; i--;)
         {
             var      x = bA[ i ]
             ,     kids = x.bracketchildren
             , nakedOne = nakedCodeNoRx.substring( x.begin, x.end )
             ,   offset = x.begin;
             ;
             // Whitespace open and close
             nakedOne = str_repli( ' ', x.open.length ) + 
                 nakedOne.substring( x.open.length, nakedOne.length - x.close.length ) + 
                 str_repli( ' ', x.close.length )
             ;

             // Whitespace all brackedchildren
             for (var j = kids.length; j--;)
             {
                 var  kid = kids[ j ];
                 nakedOne = nakedOne.substring( 0, kid.begin - offset ) + 
                     str_repli( ' ', kid.end - kid.begin ) 
                     + nakedOne.substring( kid.end - offset )
                 ;
             }
             // Now we can look for comma/semicolon splits without risking to
             // match any comma/semicolon within a kid.

             var rx = new RegExp(
                 [ ',', ';' ]
		 // xxx wrong, remove this line: .concat( reservedArr.map( function (w) { return '\\b' + w + '\\b'; } ) )
                     .join( '|' )
                 , 'g' 
             )
             ,   sA = x.sepArr = []
             ,   mo
             ;
             while (mo = rx.exec( nakedOne ))
                 sA.push( { index : offset + mo.index, type : mo[ 0 ] } );

             var FIRST = '<first>'
             ,   LAST  = '<last>'
             ,   arr = [ { index : offset + x.open.length, type : FIRST } ]
                 .concat( sA )
                 .concat( [ { index : offset + nakedOne.length - x.close.length, type : LAST } ] )
             ,   sS  = x.sepSplit = []
             ;
             for (var n = -1 + arr.length, j = 0; j < n; j++)
             {
                 var before = arr[ j ]
                 ,   after  = arr[ j + 1 ]
                 ,   begin  = before.index + (before.type !== FIRST  &&  before.type !== LAST  ?  before.type.length  :  0)
                 ,   end    = after .index
                 ,   str    = code.substring( begin, end )
                 ;
                 if (!str  ||  /^\s*$/.test(nakedCodeNoRx.substring( begin, end )))
                     continue;
                 
                 sS.push( { 
                     begin : begin
                     , end : end
                     , str : str
                     , sep_begin : before
                     , sep_end   : after
                 } );
             }
             
         }
     }

     function build_bracket_var_leftstr_rightstr( bA, commentArr )
     {
         for (var i = bA.length, i_cA = commentArr.length; i--;)
         {
             var brack = bA[ i ];
             if (brack.typebracket !== VAR)
                 continue;
             
             var vdArr = brack.vdArr = [];
             
             var s_arr = brack.sepSplit;
             for (var nj = s_arr.length, j = 0; j < nj; j++)
             {
                 var s = s_arr[ j ]
                 , str = s.hasOwnProperty( 'str_noComments' )
		     ? s.str_noComments
		     : (s.str_noComments = 
			( /\/\*|\*\//.test( s.str )  
			  ? removeComments( s )
			  : s.str
			  ).replace( /^\s*|\s*$/g, '' )
			)
		     
		     , mo_LR = str.match( /^([^=]*)\s*=\s*([\s\S]+)$/ )
                 ;
                 vdArr.push(
                     mo_LR ?  { leftstr : mo_LR[ 1 ]
                                , rightstr : mo_LR[ 2 ]
                              }
                     : { leftstr : str, rightstr : null }
                 );
             }
         }

         function removeComments( s )
         {
             var str = s.str
             , begin = s.begin
             ,   end = s.end
             ;
	     if (0 < i_cA)
		 {
		     for (; i_cA--;)
			 {
			     var c = commentArr[ i_cA ];
			     if (c.end > end)
				 continue;
			     
			     if (c.end < begin)
				 {
				     i_cA++;
				     break;
				 }
			     
			     str = str.substring( 0, c.begin - begin )
				 + str.substring( c.end - begin );
			 }
		 }
	     return str;
         }
     }


     function find_bracket( /*array*/cfgA, /*string*/nakedCodeNoRx, /*string*/code, /*array*/bA )
     {
         // First, find all open & close occurences, in a single pass
         // to keep the order they appear in `nakedCodeNoRx`.
         
         var rx = new RegExp(
             cfgA.map( function (o) { 
                 var open  = fix( o.open )
                 ,   close = fix( o.close )
                 ;
                 return '(' + open + ')' + 
                     '|' + 
                     '(' + close + ')'
                 ; 

                 function fix( x )
                 {
                     return 'string' === typeof x  ?  x.replace( /(\W)/g, '\\$1' ).replace( /^(\w)/, '\\b$1' ).replace( /(\w)$/, '$1\\b' )
                         : x.map( fix ).join( '|' )  // For a bracket with multiple possibilities e.g. var...; or var...in
                     ;
                 }
             } )
                 .join( '|' )
             , 'g'
         )
         ,   arr = []
         ,   mo
         ,   error
         ;
         while (mo = rx.exec( nakedCodeNoRx ))
         {
             var ind2 = -1;
             for (var i = mo.length; i--;)
             {
                 if (mo[ i ])
                 {
                     ind2 = i-1;
                     break;
                 }
             }
             
             if (!(-1 < ind2))
                 error.bug;  // Sanity check
             
             var is_close = 1 & ind2
             ,   cfgA_ind = ind2 >> 1
             ;
             
             var sanity = cfgA[ cfgA_ind ][ is_close  ?  'close'  :  'open' ];
             if (!('string' === typeof sanity  ?  mo[0] === sanity  :  -1 < sanity.indexOf( mo[ 0 ] )))
                 error.bug;  // Sanity check
             
             var one = {
                 begin : mo.index
                 , end : mo.index + mo[ 0 ].length
                 , cfg : cfgA[ cfgA_ind ]
             };

             one[ is_close  ?  'close'  :  'open' ] = mo[ 0 ];

             arr.push( one );
         }

         // Second, walk through open/close instances and pair them,
         // using a pile to take care of encapsulation
         //
         // Store (1) into the array specific to each `typebracket`
         // and (2) into the global array of all brackets: `bA`.
         //
         // Here too, we do a single pass to preserve order.

         var pile = [];
         for (var n = arr.length, i = 0; i < n; i++)
         {
             var one = arr[ i ];

             if (one.open)
             {
                 var x = { begin         : one.begin
                           , typebracket : one.cfg.typebracket
                           , open        : one.cfg.open
                           , close       : one.cfg.close 
                         };
                 one.cfg.out_arr.push( x ); // Specific to this typebracket.
                 bA             .push( x ); // All types together, in order.

                 pile           .push( { i : i, x : x } ); // Used below to close.
             }
             else
             {
                 var last = pile[ pile.length - 1 ];
                 if (!last)
                 {
                     if (!one.cfg.ignore_unbalanced)
                         throw new Error( 'Unbalanced brackets: missing an opening "' + one.cfg.open + '".' );
                 }
                 else if ('string' === typeof last.x.close  ?  last.x.close !== one.close  :  0 > last.x.close.indexOf( one.close ))
                 {
                     if (!(arr[ last.i ].cfg.ignore_unbalanced  ||  one.cfg.ignore_unbalanced))
                     {
                         throw new Error( 
                             'Unbalanced brackets: opening typebracket "' + last.x.typebracket + '" (' + last.x.begin + ')' + 
                                 ' does not match closing typebracket "' + one.cfg.typebracket + '" (' + one.begin + ').' 
                         );
                     }
                 }
                 else
                 {                 
                     var   x = pile.pop().x;
                     x.close = one.close;
                     x.end   = one.end;
                     x.str   = code.substring( x.begin, x.end );
                 }
             }
         }
         
         if (pile.length !== 0)
	     {
		 var last = pile[ pile.length - 1 ];
		 global.console  &&  global.console.error("last:",last);
             throw new Error( 'Unbalanced brackets: missing a closing "' + last.x.close + '" for {open:"' + last.x.open + '", begin:<char:' + last.x.begin + '>}. Did you forget a semicolon, maybe?' );
	     }
     }
          

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

}

//#BUILD_END_FILE: "codeparse.js"



if (typeof lp2fmtree === 'undefined')
    
//#BUILD_BEGIN_FILE: "lp2fmtree.js"


{
(function (global) {

    // xxx common constants in a separate file
    var METAFUN        = 'metafun'
    ,   METARET        = 'metaret'
    ,   FUNCTION       = 'function'
    ,   RESERVED       = 'reserved'

    ,   CALL    = 'call'
    ,   DOTCALL = 'dotcall'

    ,   TYPE_BRACKET      = 'bracket'
    ,   TYPEBRACKET_CURLY = 'curly'

    ,  _emptyObj = {}
    ;

    // ---------- Public API

    global.lp2fmtree = lp2fmtree;

    // ---------- Public API implementation

    function lp2fmtree( lp, /*?array of string?*/namespace, /*?object?*/workspace, /*?fm?*/parent )
    // Input:  object returned by `codeparse`.
    // 
    // Output: array of function/metafun declaration trees.
    //
    // Comment:
    // 
    // `lp2fmtree` is used by ./metaret.js to support local metafuns
    // e.g. `metafun b` in:
    // 
    // {{{ 
    // metafun a(self) { metaret b; metafun b(self) { return 1; } }
    // }}}
    // 
    // -> declares `a` and `a.b`.
    //
    // It would be equivalent to write at the top level:
    // {{{
    // metafun a(self) { metaret a.b; }
    // metafun a.b(self) { return 1; }
    // }}}
    // 
    // For a longer example see `sortedSearch` in ./index.html
    //
    // Guillaume Lathoud
    // glathoud@yahoo.fr
    {       
        var isTopLevel = arguments.length < 2;

        namespace  ||  (namespace = []);
        workspace  ||  (workspace = { iAnonymous : 0, lastname2fmarr : {} });
        
        var at = lp  instanceof Array  ?  lp  :  lp.allTree
        ,  ret = []
        ;
        if (isTopLevel)
            ret.lastname2fmarr = workspace.lastname2fmarr;  // Convenience access (mainly for ./inline.js)
        
        for (var n = at.length, i = 0; i < n; i++)
        {
            var one  = at[ i ];

            // Detect a named function/metafunction declaration,
            
            var isFunction     = one.name === FUNCTION
            ,   isMetafunction = one.name === METAFUN

            ,   isAnonymousFunction = isFunction  &&  at[ i+1 ].type === TYPE_BRACKET
            ;


            if (((isFunction  ||  isMetafunction)  &&  at[ i+1 ].type !== TYPE_BRACKET)  ||
                isAnonymousFunction)
            {
                var begin = one.begin
                ,   end

                ,   dot_arr = []
                ,   dotnode_arr = []
                ,   next 
                ;
                if (isAnonymousFunction)
                {
                    // Give some identity
                    dot_arr = [ 'anonymous#' + (workspace.iAnonymous++) ];
                }
                else
                {
                    // Fetch the name of the function or metafunction.
                    // Dots are supported (subnamespace).
                    do {
                        next = at[ ++i ];
                        dotnode_arr.push( next );
                        dot_arr.push( next.name );
                    } while (
                        next.type !== DOTCALL  &&  next.type !== CALL
                    )
                }
                
                var param_node = next = at[ ++i ];
                var param_arr = param_node.sepSplit.map( strip_comment_and_space )
                ,   param_set = {}
                ;
                for (var pi = param_arr.length; pi--;)
                    param_set[ param_arr[ pi ] ] = 1;
                               

                while (next.type !== TYPE_BRACKET  ||  next.typebracket !== TYPEBRACKET_CURLY)
                    next = at[ ++i ];

                var body_node = next 
                ,   end       = body_node.end
                ,   body      = body_node.str

                ,   fullname_arr = namespace.concat( dot_arr )
                ,   fullname     = fullname_arr.join( '.' )
                ,   lastname     = fullname_arr[ fullname_arr.length - 1 ]
                
                , out = {
                    begin : begin
                    , end : end
                    , fullname_arr : fullname_arr
                    , lastname     : lastname
                    , isFunction     : isFunction
                    , isMetafunction : isMetafunction
                    , isAnonymousFunction : isAnonymousFunction
                    , dot_arr    : dot_arr
                    , dotnode_arr : dotnode_arr
                    , param_node : param_node
                    , body_node : body_node
                    , fm_node : one
                    , fullname : fullname
                    , param_arr : param_arr
                    , param_str : param_arr.join( ',' )
                    , param_set : param_set
                    , parent   : parent  ||  null
                    
                    // The remaining values are set further below
                    , children : null
                    , body : null  
                }
                ;

                // Support for local metafunctions: look at the
                // metafuns and functions within the body.
                
                var children = next.children  ?  lp2fmtree( next.children, fullname_arr, workspace, /*parent:*/out )  :  [];
                
                // Remove children code from the body.
                
                for (var j = children.length; j--;)
                {
                    var kid = children[ j ]
                    ,     a = kid.begin - body_node.begin
                    ,     b = kid.end   - body_node.begin
                    ;
                    if (!kid.isAnonymousFunction)
                        body = body.substring( 0, a ) + body.substring( a, b ).replace( /[\s\S]/g, ' ' ) + body.substring( b );
                }
                
                out.children = children;
                out.body     = body;

                ret.push( out );

                // Convenience access
                if (!isAnonymousFunction)
                {
                    (workspace.lastname2fmarr[ lastname ]  ||  (workspace.lastname2fmarr[ lastname ] = []))
                        .push( out )
                    ;
                }
            }
            else if (one.children)
            {
                // Useful to find functions e.g. within `(...)`:
                // `(function (global) { ... })(this);`
                ret.push.apply( ret, lp2fmtree( one.children, namespace, workspace ) );
            }
        }

        // When done with the tree, walk it from the top
        if (isTopLevel)
        {
            find_out_who_has_what( ret, [].concat( lp.vardeclArr ), 'vardecl' );
            find_out_who_has_what( ret, lp.identifierArr.filter( function (x) { return !x.isVardecl; } ), 'varuse' );

            // Now we can find closures. Useful e.g. to shorten local names (see ./minify.js)
            find_decluse( ret );
        }

        return ret;
    }
    
    function strip_comment_and_space( o )
    {
        return o.str.replace( /\/\*[\s\S]*?\*\//g, '' ).replace( /(^\s+|\s+$)/g, '' );
    }

    function find_out_who_has_what( arr, vArr, outputName )
    {
        var n = arr.length;

        // Depth first - this can change `vArr`
        
        for (var i = 0; i < n; i++)
        {
            var one = arr[ i ]
            ,   c   = one.children
            ;
            if (c  &&  c.length)
                find_out_who_has_what( c, vArr, outputName );
        }
        
        // then breadth

        for (var i = 0; i < n; i++)
        {
            var one = arr[ i ]
            , begin = one.begin
            ,   end = one.end

            , param_begin = one.param_node.begin
            , param_end   = one.param_node.end

            , one_vda = one[ outputName + 'Arr' ] = []
            , one_vdo = one[ outputName + 'Obj' ] = {}
            ;
            for (var j = vArr.length; j--;)
            {
                var vd = vArr[ j ];
                if (vd.end < param_end)
                    break;

                if (vd.begin < end)
                {
                    var x = vArr.splice( j, 1 )[ 0 ];
                    one_vda.unshift( x );
                    (one_vdo[ x.name ]  ||  (one_vdo[ x.name ] = [])).push( x );
                }
            }
        }
    }


    function find_decluse( /*array | object*/arr_or_fm, /*?object?*/idname2decluse )
    {
        if (arr_or_fm instanceof Array)
        {
            arr_or_fm.forEach( function (fm) { find_decluse( fm, idname2decluse ); } );
            return;
        }

        var fm = arr_or_fm;        
        idname2decluse = copy( idname2decluse || {} );

        var fm_idname2decluse = fm.idname2decluse = idname2decluse
        , arr_push_out = [ idname2decluse ]
        ;

        // Declarations in this scope `fm`

        for (var j = fm.param_arr.length; j--;)
        {
            var   name = fm.param_arr[ j ]
            ,   fpnssi = fm.param_node.sepSplit[ j ]
            ;
            arr_push( arr_push_out
                      , name
                      , { 
                          isParam : true
                          , fmDecl : fm
                          , use : []
                          , name : name 
                          , declArr: [ { begin : fpnssi.begin, end : fpnssi.end } ]
                      } 
                    );
        }
        for (var name in fm.vardeclObj) { if (!(name in _emptyObj)) {  // More flexible than hasOwnProperty
            arr_push( arr_push_out
                      , name
                      , {
                          isVardecl : true
                          , fmDecl : fm
                          , use : []
                          , name : name
                          , declArr : fm.vardeclObj[ name ].map( function (o) { return { begin : o.begin, end : o.end }; } )
                      }
                    );
        }}
        for (var j = fm.children.length; j--;) 
        {
            var kid = fm.children[ j ]
            , name  = kid.lastname
            , kid_declArr = []
            ;
            if (kid.dotnode_arr.length)
            {
                kid_declArr.push(
                    { begin : kid.dotnode_arr[ 0 ].begin, end : kid.dotnode_arr.slice( -1 )[ 0 ].end } 
                );
            }
            
            arr_push( arr_push_out
                      , name
                      , {
                          isFunction : true  // Declaration or named expression
                          , fmDecl : fm
                          , use : []
                          , name : name
                          , declArr : kid_declArr
                      }
                    );
        }

        // Usages in the scope of `fm`

        for (var n = fm.varuseArr.length, j = 0; j < n; j++)
        {
            var one = fm.varuseArr[ j ]
            ,  name = one.name
            ;
            if (!idname2decluse[ name ])
            {
                arr_push( arr_push_out
                          , name
                          , {
                              isGlobal : true
                              , fmDecl : null
                              , use : []
                          }
                        );
            }
            arr_push_use( arr_push_out, fm, one );
        }
        
        // Recursion: Usages in children scopes.
        // Note: this can help to find closures.
        
        find_decluse( fm.children, idname2decluse );
    }
    
    function copy_fm_use( one_vu, fmUse )
    {
        return ( one_vu  ||  [] )
            .map( function (use) { var o = copy( use ); o.fmUse = fmUse; return o; } )
        ;
    }
    
    function arr_push( /*object | array of object*/arr_push_out, /*string*/name, /*object*/o )
    {
        var undef;
        (name || 0).substring.call.a;
        (o || undef).hasOwnProperty.call.a;

        if (arr_push_out instanceof Array)
        {
            arr_push_out.forEach( function (out) { arr_push( out, name, o ); } );
            return;
        }

        if (!arr_push_out[ name ]  ||  arr_push_out[ name ].fmDecl !== o.fmDecl)
        {
            var o2 = copy( o );
            o2.use = [].concat( o2.use );
            arr_push_out[ name ] = o2;
        }
        else
        {
            var use = arr_push_out[ name ].use;
            use.push.apply( use, o.use );
        }        
    }

    function arr_push_use( arr_push_out, fmUse, use )
    {
        if (arr_push_out instanceof Array)
        {
            arr_push_out.forEach( function (out) { arr_push_use( out, fmUse, use ); } );
            return;
        }

        arr_push_out[ use.name ].use.push( mix( copy( use ), { fmUse : fmUse } ) );
    }
    

    function copy( o )
    {
        return mix( {}, o );
    }
    
    function mix( o, o2 )
    {
        for (var k in o2) { if (!(k in _emptyObj)) {  // More flexible than hasOwnProperty
            o[ k ] = o2[ k ];
        }}
        return o;
    }

}(this));

}

//#BUILD_END_FILE: "lp2fmtree.js"



if (typeof metaparse === 'undefined')
    
//#BUILD_BEGIN_FILE: "metaret.js"


{
/*global document console load codeparse need$ lp2fmtree JSON*/

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
// -> Task: Detection of metaret + prevention of variable name collision
// (hygienic renaming).
//
// Mutual recursion is also supported, as shown in ./metaret_test.html
//
// 
// References
//
// [Backus78] "Can Programming Be Liberated from the von Neumann
// Style?  A Functional Style and Its Algebra of Programs", by John
// Backus, Communications of the ACM, August 1978 Volume 21 Number 8.
//
// [tomrec] http://glat.info/jscheck/tomrec_prod.html

if (typeof codeparse === 'undefined')
    
//#BUILD_BEGIN_FILE: "codeparse.js"


{

}

//#BUILD_END_FILE: "codeparse.js"



if (typeof lp2fmtree === 'undefined')
    
//#BUILD_BEGIN_FILE: "lp2fmtree.js"


{

}

//#BUILD_END_FILE: "lp2fmtree.js"



;(function (global) {

    // The place of `self` in the parameters: 0:first place, 1:second
    // place, etc.
    var ACTION_PARAM = 0
    , METAFUN        = 'metafun'
    , METARET        = 'metaret'
    , EXTRA_RESERVED_ARR = [ METAFUN, METARET ]
    ,  EXTRA_BRACKET_ARR  = [ { open : METARET, close : ';', typebracket : METARET, ignore_unbalanced : true } ]
    ,     CODEPARSE_OPT = { extraReservedArr : EXTRA_RESERVED_ARR, extraBracketArr : EXTRA_BRACKET_ARR }
    ;

    // ---------- Public API

    global.MetaDecl      = MetaDecl;      // Returns nothing, declares a function in the global name space
    global.MetaFunction  = MetaFunction;  // MetaFunction returns a function. Optionally you can give a local name space object.
    global.metaparse     = metaparse;     // Returns nothing. Search for script tags with type="text/js-metaret", parse and apply them.

    // convenience access to constants
    metaparse.get_CODEPARSE_OPT = metaparse_get_CODEPARSE_OPT;
    metaparse.get_CONST          = metaparse_get_CONST;

    function metaparse_get_CODEPARSE_OPT() 
    {
        // Safe deep copy using a hammer.
        return JSON.parse( JSON.stringify( CODEPARSE_OPT ) ); 
    }

    function metaparse_get_CONST()
    {
        return {
            'METAFUN'   : METAFUN
            , 'METARET' : METARET
            , 'CODEPARSE_OPT' : metaparse_get_CODEPARSE_OPT()
        };
    }
    
    // ---------- Public API implementation
    
    var _metaparse_rx     = /\s*(metafun|function)\s*(\S+)\s*\(\s*([^\)]+?)\s*\)((?![\r\n]\s*(metafun|function))[\s\S])*/g
    ,   _metaparse_one_rx = /^\s*(metafun|function)\s*(\S+)\s*\(\s*([^\)]+?)\s*\)\s*\{\s*(((?![\r\n]\s*(metafun|function))[\s\S])*)\s*\}\s*$/
        , _metaparse_one_start_rx = /^\s*(metafun|function)\s/
        , _metaparse_one_start_function_rx = /^\s*function\s/
        ;
    function metaparse( /*?string?*/code, /*?object?*/name2info, /*?object?*/opt )
    {
        name2info  ||  (name2info = _global_name2info);

        var noli = code  ?  [ code ]  :  document.getElementsByTagName( 'script' )
        ,   ret  = []
        ;
        for (var n = noli.length, i = 0; i < n; i++)
        {
            var     s = noli[ i ]
            , sString = 'string' === typeof s
            ;
            if (!sString  &&  'text/js-metaret-decl' !== s.getAttribute( 'type' ))
                continue;
            
            var metacode = sString  ?  s  :  s.textContent  ||  s.innerText
            ,   lp       = codeparse( metacode, CODEPARSE_OPT )
            ,   fmtree   = lp2fmtree( lp )
            ;
            rec_decl( fmtree, /*isTop:*/true, name2info, ret, opt );
        }

        return ret;
    }

    function rec_decl( fmtree, /*boolean*/isTop, /*object*/name2info, /*?array?*/output, /*?object?*/opt )
    // Returns an array of `info` objects, ordered by increasing
    // `.begin` value.
    {
        output  ||  (output = []);

        if (fmtree instanceof Array)
        {
            for (var n = fmtree.length, i = 0; i < n; i++)
                rec_decl( fmtree[ i ], isTop, name2info, output, opt );
        }
        else
        {
            if (fmtree.children)
                rec_decl( fmtree.children, /*isTop*/false, name2info, output, opt );
            
            
            name2info[ fmtree.fullname ] = { fm : fmtree, _work_in_progress : true };
            
            Decl( fmtree.fullname, fmtree.param_str, fmtree.body, fmtree.children, fmtree.isFunction, name2info, opt );
            
            delete name2info[ fmtree.fullname ]._work_in_progress;

            if (isTop)
                output.push( { fullname : fmtree.fullname, fmtree : fmtree, info : name2info[ fmtree.fullname ] } );
        }

            
        return output;
    }
    
    var _global_name2info = {};    

    function MetaDecl( /*single argument: code string | three arguments: name*/code_or_name, /*?string?*/param, /*?string?*/body, /*?array?*/children, /*?object?*/name2info, /*?object?*/opt )
    {
        Decl( code_or_name, param, body, children, false, name2info  ||  _global_name2info, opt );
    }

    function FunDecl( /*single argument: code string | three arguments: name*/code_or_name, /*?string?*/param, /*?string?*/body, /*?array?*/children, /*?object?*/name2info, /*?object?*/opt )
    {
        Decl( code_or_name, param, body, children, true, name2info  ||  _global_name2info, opt );
    }

    function Decl( /*single argument: code string | three arguments: name*/code_or_name, /*?string?*/param, /*?string?*/body, /*?array?*/children, /*?boolean?*/is_fun, /*?object?*/name2info, /*?object?*/opt)
    {
        children  ||  (children = []);

        is_fun != null  ||  (is_fun = _metaparse_one_start_function_rx.test( code_or_name ));

        name2info  ||  (name2info = _global_name2info);
                
        var param_null = param == null
        ,    body_null = body  == null
        ;
        if (param_null ^ body_null)
            throw new Error( 'Decl: invalid usage. Give either both `param` and `body`, or none of them.' );

        if (param_null)
        {
            // --- Single code string

            // For convenience, prepend metafun|function automatically.
            var code  = _metaparse_one_start_rx.test( code_or_name )  ?  code_or_name  :  (is_fun  ?  'function'  :  'metafun') + ' ' + code_or_name
            ,   mo    = _metaparse_one_rx.exec( code )
            ,   name  = mo[ 2 ]
            ;
            param = mo[ 3 ];
            body  = mo[ 4 ];
            
            Decl( name, param, body, children, is_fun, name2info, opt );
            return;
        }
        
        // --- beginner help: detect `arguments` usage within metafun
        // https://github.com/glathoud/js.metaret/issues/11
        if (!is_fun)
        {
            var body_lp = codeparse( body )
            ,   body_argumentsArr = body_lp.identifierObj[ 'arguments' ]  ||  []
            ;
            if (body_argumentsArr.length)
                throw new Error( 'metafun error: it is forbidden to use `arguments` in the body of the metafun (because the body of the metafun may end up being inlined within a `while` loop).' );
        }

        // --- All three strings: name, param, body.

        var name = code_or_name;

        // Support for dotted names: automatically any missing part
        // within the global object.
        
        var dot_arr = name.split( '.' )
        ,   g       = name2info === _global_name2info  ?  global  :  {}
        ;
        while (dot_arr.length > 1)
        {
            var next = dot_arr.shift();
            g = g[ next ]  ||  (g[ next ] = {});
        }
        
        // Now we are ready to create the metafunction
        
        var remember = is_fun  ?  ''  :  ( 
            '\nmetafun ' + name + '\n( ' + param + ')'
        ).replace( /([\r\n])/g, '$1// --- ' )
            + '\n\n'
        ;

        g[ dot_arr[ 0 ] ] = (is_fun  ?  NormalFunction  :  MetaFunction)( name, param, remember + body, name2info, children, opt );

    }
    
    function NormalFunction( name, param, body, name2info, /*?array?*/children, /*?object?*/opt )
    {
        _checkNameNotUsedYet( name2info, name );
        
        if (children  &&  children.length)
        {
            var rx = /\}\s*/
            ,   ok = rx.test( body )
            ;
            body = ok  &&  body.replace( rx, '\n\n' + childrenCode( name2info, children ) + '\n\n}' )
        }

        var info = name2info[ name ] = name2info[ name ]  ||  {};
        
        info.name      = name;
        info.lastname  = name.replace( /^.*\./, '' );
        info.origParam = param;
        info.origBody  = body;
        info.name2info = name2info;
        info.impl      = null;
        
        // Store also for childrenCode
        info.paramArr = param.split(',');
        info.body     = body;
        
        // 2 cases

        var ret = opt  &&  opt.doNotCompile  
            ?  fWrapper
            :  getImpl()
        ;
        ret.getInfo = getInfo;
        ret.getImpl = getImpl;  // For convenience, ensure the compiled code always can be seen from the outside.
        return ret;

        function fWrapper()
        {
            return (
                info.impl  ||  (info.impl = getImpl())
            )
                .apply( this, arguments)
            ;
        }

        function getInfo()
        {
            return Object.create( info );  // lousy protection but better than nothing
        }

        function getImpl()
        {
            return info.impl  ||  (
                info.impl = new Function( param, body )
            );
        }
    }

    function MetaFunction(
        /*string*/name
        , /* string like "self,a,b,c" */param
        , /*string: code*/body
        , /*object*/name2info
        , /*array*/children
        , /*?object?*/opt
    ) 
    // Returns a function `ret`. So it does not matter whether you
    // use `new MetaFunction(...)`, or just `MetaFunction(...)`.
    //
    // Advice: use the same name string as your target variable name:
    /*
      var fact = MetaFunction
      ( 
      'fact'            // <- same name string as the variable name `fact`
      , 'self,k,acc'     
      , [ 
      'acc  ||  (acc = 1);'
      , 'if (k > 1)'
      , '    metaret self, k - 1, acc * k;' 
      , 'else'
      , '    return acc;'
      ].join( '\n' )
      );
    */
    {        
        _checkNameNotUsedYet( name2info, name );

        var info = name2info[ name ] = name2info[ name ]  ||  {};
        
        info.name      = name;
        info.lastname  = name.replace( /^.*\./, '' );
        info.origParam = param;
        info.origBody  = body;
        info.name2info = name2info;

        // solve
        info.solved    = false;
        info.newParam  = null;
        info.newBody   = null;

        // compile
        info.impl      = null;         // Where we'll store the resulting unwrapped implementation, as soon as we need it.
        
        var paramArr   = info.paramArr      = _checkExtractParam( param )  
        , varArr     = info.varArr        = _extractVar( body )
        , metaretArr = info.metaretArr    = _checkExtractMetaret( body, paramArr.self, name )
        ;
        _createSolver( info, children );


        var ret = mfWrapper;
        
        if (metaretArr.hasAll( name2info ))
        {
            // If we can solve right away (e.g. self-recursion case),
            // then we do not need the `function ret()` check anymore.
            info.solve();

            if (!(opt  &&  opt.doNotCompile))
                ret = info.compile();
        }

        ret.getInfo = mf_getInfo;
        ret.getImpl = mf_getImpl;

        return ret;

        
        // Solve later (e.g. mutual recursion case where some of the
        // metaret actions (= other metafunctions) are not known yet).

        function mfWrapper(/*...*/) 
        { 
            if (!info.impl)
                info.compile();
            
            return info.impl.apply( this, arguments );
        }
        
        function mf_getInfo()
        {
            return Object.create( info );  // lousy protection but better than nothing
        }

        
        // For convenience : to see the generated code from outside.

        function mf_getImpl()
        {
            if (!info.impl)
                info.compile();
            
            return info.impl;
        }

    }

    // ---------- Private constant
    
    var _RX_NAME             = /^(([a-zA-Z_]\w*|anonymous#\d+)\.)*([a-zA-Z_]\w*|anonymous#\d+)$/
        , _RX_NAME_ANONYMOUS = /^(([a-zA-Z_]\w*|anonymous#\d+)\.)*(anonymous#\d+)$/
        , _RX_PARAM   = /^((?:^\s*|\s*,\s*)[a-zA-Z_]\w*(?:\s*))+$/
        , _RX_ACTION  = /^[a-zA-Z_]\w*?(\.[a-zA-Z_]\w*?)*$/
    , _Aps            = Array.prototype.slice
    ;

    // ---------- Private function

    function _createSolver( info, children )
    {
        var name     = info.name
        , metaretArr = info.metaretArr
        , paramArr   = info.paramArr
        , varArr     = info.varArr
        , origBody   = info.origBody

        , name2info  = info.name2info

        , namespace_arr = name.split( '.' )
        ;

        info.solve   = solve;
        info.compile = compile;
        
        function solve()
        {
            if (info.solved)  
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

            info.solved = true;
        }

        function compile()
        {
            if (!info.solved)
                solve();

            return info.impl  ||  (
                info.impl = new Function (info.newParam.join(','), info.newBody)
            );
        }

        function solveNoMetaret()
        {
	    var warn_msg = 'MetaFunction : _createSolver:solveNoMetaret() no #metaret in body of metafunction "' + name + '".';
            if ('undefined' !== typeof console  &&  console.warn)
		console.warn( warn_msg );
	    
            info.newParam = paramArr;
            info.newBody  = origBody.replace( /^\s+$/mg, '' );
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
                    '}\n' +
                    
                (children  &&  children.length  ?  '\n\n' + childrenCode( name2info, children ) + '\n'  :  '')
            )
                .replace( /^\s+$/mg, '' )
            ;
            
            // Store also for childrenCode
            info.paramArr = newParam;
            info.body     = newBody;
        }

        function solveMulti()
        {
            // For simplicity and readability we opted for switch
            // (flat, maybe less variable name collision issues)
            // rather than expanding recursively (faster than switch,
            // but code duplication).
            
            var  maha = metaretArr.hasAll()
            
            // Preserve order and prevent duplicate code
            , infoArr = [ info ].concat( maha.infoArr.filter( function (other) { return other !== info; } ) )

            // Fullnames (including namespace)
            , nameArr = infoArr.map( function (info) { return info.name; } )

            , against = infoArr.map( function (info) { return info.paramArr.concat( info.origBody ); } )
            , switch_ind_name = nameArr.switch_ind_name = _generateAddName( 'switch_ind', against )
            , switchLabel     = nameArr.switchLabel     = _generateAddName( 'L_switch', against )
            , undefName       = _generateAddName( 'undef', against )  // Avoid collision   
            ; 
            
            // https://github.com/glathoud/js.metaret/issues/13
            check_bound_variables_all_shared( infoArr.map( function (info) { return info.fm; } ) );

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
            ].concat( 

                children  &&  children.length

                    ?  [ ''
                         , ''
                         , childrenCode(
                             name2info
                             , children
                                 .filter( function (kid) { 
                                     (kid.fullname || 0).substring.call.a; 
                                             return 0 > nameArr.lastIndexOf( kid.fullname ); 
                                 } )
                         )
                       ] 

                         :  []

            )))
                .join( '\n' )
                .replace( /^\s+$/mg, '' )
            ;
            
            function info2code( info, ind )
            {
                var code = [ 
                    ''
                    , 'case ' + ind + ':' 
			     ];
                
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

    function childrenCode( /*object*/name2info, /*?array?*/children )
    {
        var arr = [];
        
        for (var n = children.length, i = 0; i < n; i++)
        {
            var kid = children[ i ]
            ,  info = name2info[ kid.fullname ]
            ;
            if (kid.isAnonymousFunction)
                continue;
            
            arr.push( '\n' );
            arr.push( 'function ' + info.lastname + '(' + 
                      info.paramArr.join( ',' ) +
                      ')\n' +
                      (/^\s*\{[\s\S]*?\}\s*$/.test( info.body )  ?  info.body  :  ('{\n' + info.body + '\n}\n'))
                    );
        }
        
        return arr.join( '\n' );
    }


    // ---------- Private implementation: deeper

    function _checkNameNotUsedYet(/*object*/name2info, /*string*/name)
    {
        if (!_RX_NAME.test( name ))  
            throw new Error(
                'MetaFunction : _checkNameNotUsedYet : Invalid function name "' + name + '". The function name must match [a-zA-Z_][a-zA-Z_0-9]*'
            );

        if (name2info_has( name2info, name, [] ))
            throw new Error(
                'MetaFunction : _checkNameNotUsedYet : Duplicate function name "' + name + '". The function name must be unique: ' + 
                    'MetaFunction can be called one time only with a given name.' 
            );

    }

    function _checkExtractParam( /*string*/param )  
    {
        // Remove comments
        param = param.replace( /\/\*.*?\*\//g, '' );

        if (!_RX_PARAM.test( param ))
            throw new Error('MetaFunction : _checkExtractParam : Invalid parameters string, the string must be like "self,x,y,z".');

        var ret = param.replace(/\s+/g, '' ).split( ',' );
        ret.self = ret.splice( ACTION_PARAM, 1 )[ 0 ];

        return ret;
    }

    function _extractVar( /*string*/body )
    {
        var lp = codeparse( body, CODEPARSE_OPT )
        ,   iA = lp.identifierArr
        , ret = []
        ;
        for (var n = iA.length, i = 0; i < n; i++)
        {
            var x = iA[ i ];
            ret.push( { text    : x.str
                        , end   : x.begin + x.str.length
                        , start : x.begin
                        , isVardecl : x.isVardecl
                      }
                    );
            
        }
        return ret;
    }

    function _checkExtractMetaret( /*string*/body, /*string*/self, /*string*/selfName )
    {
        var lp = codeparse( body, CODEPARSE_OPT )
        ,  beA = lp.bracketextraArr
        ,  ret = []
        ;

        // Remember

        ret.body     = body;
        ret.self     = self;
        ret.selfName = selfName;

        // Parse

        for (var beA_n = beA.length, beA_i = 0; beA_i < beA_n; beA_i++)
        {
            var x = beA[ beA_i ];
            if (x.typebracket !== METARET)
                continue;

            var exprArr = x.sepSplit.map( function (o) { return o.str.replace( /^\s+/, '' ).replace( /\s+$/, '' ); } )
            ,    action = exprArr.length > ACTION_PARAM  &&  exprArr.splice( ACTION_PARAM, 1 )[ 0 ]
            ;
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
                        , end    : x.end
                        , start  : x.begin
                        , namespace : selfName
                        , namespace_arr : selfName.split( '.' )
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

    function hasAll(/*object*/name2info, /*?object?*/visited, /*?object?*/visitedObj, /*?array of string?*/visitedArr)
    {
        // Returns  false | array of strings
     
        var topLevel = arguments.length < 2;
        if (topLevel)
        {
            var cache = 'hasAllResult';
            if (cache in this)  
                return this[ cache ];

            // Init

            visitedObj = {};
            visitedArr = [];
        }

        // Do the (possibly recursive) search

        for (var i = this.length; i--; )
        {
            var x = this[ i ];
            if (x.isSelf)
                continue;

            var action = x.action;
            if (!action)
                throw new Error('MetaFunction : hasAll : Found a bug: empty metaret action (not permitted).');

            if (action in visitedObj)  // Prevent infinite cycles
                continue;
            
            var info = name2info_get( name2info, action, x.namespace_arr );
            if (!info)
                return false;       // Failure

            if (info.name in visitedObj)
                continue;

            visitedObj[ action ] = visitedObj[ info.name ] = info;
            visitedArr.push( info );
            
            if (!info.metaretArr.hasAll( name2info, visited, visitedObj, visitedArr ))
                return false;       // Failure
        }

        if (topLevel)
            // Finished
            return this[ cache ] = { 
                vObj : visitedObj
                , infoArr : visitedArr
            };  
        else
            // Not finished yet
            return true;
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
            var label = '_' + baseName.replace( /#/g, '' ).replace( /\W/g, '_' ) + (i || '') + '_';
            
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

            , before    = ret.slice( 0, metaret.start )
            , after     = ret.slice( metaret.end )
            ;

            // If there was a comment right on the metaret line,
            // make sure it appears at a readable position.
            var after_comment = ''
            ,   after_comment_mo = after.match( /^\s*(?:\/\/[^\r\n]*[\r\n]+|\/\*((?!\*\/)[\s\S]*)\*\/)/ )
            ;
            if (after_comment_mo)
            {
                after_comment = after_comment_mo[ 0 ];
                after         =  after.substring( after_comment.length );
            }
            
            var code = prepareCode( metaret, after_comment );
            
            ret = before + code + after;
        }
        
        return ret;

        function prepareCode( metaret, after_comment )
        {
            var code   = []
            , info     = name2info_get( name2info, metaret.action, metaret.namespace_arr )
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
                for (var j = 0, i = 0, end = paramArr.length; i < end; i++)
                {
                    var varname  = paramArr[ i ];

                    // Special case: spare us the identity (no transformation)
                    if (varname === exprArr[ i ])
                        continue;

                    // General case                    
                    var newVarname = _generateName( varname, against );
                    against.push( newVarname );  // Prevent future collisions on this new name
                    
                    code.splice( j++, 0, 'var ' + newVarname + ' = ' + exprArr[ i ] + ';' );
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
                    code.push( 'continue ' + nameArr.switchLabel + '; // --- stay in: ' + metaret.action );
                }
                else
                {
                    // Moving to the body of another metafunction (switch style)
                    var switch_ind = nameArr.indexOf( info.name );
                    if (0 > switch_ind)
                    {
                        throw new Error('MetaFunction : _replaceMetaretWithContinue : prepareCode : Found a bug! Could not find the switch index of action "' +
                                        metaret.action + '"' 
                                       );
                    }
                    
                    code.push( nameArr.switch_ind_name + ' = ' + switch_ind + '; // --- go to: ' + metaret.action );
                    code.push( 'continue ' + nameArr.switchLabel + ';' );
                }
            }   
            
            if (after_comment)
                code.unshift( after_comment );

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
            
            if (v.isVardecl  &&  -1 < maybeDeclInd  &&  maybeDeclInd < v.end)
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

    function name2info_has( /*object <fullname> -> info*/name2info, /*string*/name, /*array of string*/namespace_arr )
    {
        var info = name2info_get( name2info, name, namespace_arr );
        return !!(info  &&  !info._work_in_progress);
    }
    
    function name2info_get( /*object <fullname> -> info*/name2info, /*string*/name, /*array of string*/namespace_arr )
    {
        // Search first in the local namespace

        var fullname = namespace_arr.concat( name ).join( '.' );
        if (fullname in name2info)
            return name2info[ fullname ];

        // Else step up

        if (namespace_arr.length)
            return name2info_get( name2info, name, namespace_arr.slice( 0, -1 ) );

        // Else not found
        return false;
    }

    function check_bound_variables_all_shared( fmArr)
    {
        var name2scope = {};
        fmArr.forEach( check_one );

        function check_one( fm )
        {
            if (!fm)
                return;

            var m_vuo  = fm.varuseObj
            ,   m_vdo  = fm.vardeclObj
            ,   m_pset = fm.param_set
            ;
            for (var name in m_vuo) { if (!(name in m_vdo) && !(name in m_pset)) { 
                
                var scope = decl_scope( name, fm );

                if (!name2scope[ name ])
                    name2scope[ name ] = { scope : scope };

                else if (scope !== name2scope[ name ].scope)
                    throw new Error( 'metafun error: when using mutual recursion, the various metafunctions must share their bound variables (if any).' );
            }}
        }
    }

    function decl_scope( name, fm )
    // Returns the closest scope where `name` is declared (`fm` or
    // one of its parents), else `null` for a global variable.
    {
        return fm  
            ?  (fm.vardeclObj[ name ]  ?  fm  :  decl_scope( name, fm.parent ))
        :  null  // global variable
        ;
    }
    
})(this);

}

//#BUILD_END_FILE: "metaret.js"




(function (global) {

    global.jsm2js = jsm2js;

    function jsm2js( /*string*/jsm_code )
    // Convert .jsm code to .js code.
    // Returns a string.
    // 
    // Used by ./need$.js
    //
    // Guillaume Lathoud
    // glathoud@yahoo.fr
    {
        var local_name2info = {}
        ,   arr = metaparse( jsm_code, local_name2info, { doNotCompile : true } )
        ,   ret_js = jsm_code
        ;
        
        replace_rec( arr );

        check_leftover( ret_js );

        return ret_js;

        function replace_rec( arr )
        {
            for (var i = arr.length; i--;)
            {
                var one = arr[ i ]
                
                , fmtree = one.fmtree
                , info   = one.info
                
                , begin    = fmtree.begin
                , end      = fmtree.end
                , lastname = info.lastname

                ;

                begin.toPrecision.call.a;
                (end || null).toPrecision.call.a;

                if (fmtree.isMetafunction)
                {
                    ret_js = ret_js.substring( 0, begin ) +
                        '\nfunction ' + info.lastname + '(' + info.paramArr.join( ',' ) + ')\n{\n' + 
                        (info.newBody  ||  (info.solve(), info.newBody)) + '\n}\n' +
                        ret_js.substring( end );
                }
                else if (fmtree.isFunction)
                {
                    // E.g. to support anonymous namespace like:
                    // `(function (global) { global.f = f; metafun f(...) ... })(this);`
                    var children = fmtree.children;
                    if (children)
                        replace_rec( children.map( function (kid) { return { fmtree : kid, info : local_name2info[ kid.fullname ] }; } ) );
                }
            }
        }
    }


    var CONST;

    function check_leftover( /*string*/jscode )
    // Make sure all reserved keywords `metafun` and `metaret` have
    // been eliminated.
    // https://github.com/glathoud/js.metaret/issues/9
    {
        CONST  ||  (CONST = metaparse.get_CONST());
        
        var lp = codeparse( jscode, CONST.CODEPARSE_OPT )
        ,   fm = lp2fmtree( lp )
        ,   rO = lp.reservedObj
        ,   mfunArr = (rO[ CONST.METAFUN ]  ||  []).map( enrich )
        ,   mretArr = (rO[ CONST.METARET ]  ||  []).map( enrich )
        ;
        
        if (mfunArr.length  ||  mretArr.length)
        {
            // Consider looking at `mfunArr` and `mretArr`
            // for detailed information useful to debug.

            throw new Error( 'jsm2js:check_leftover: found remaining `metafun` and/or `metaret` within function(s): ' + 
                             (
                                 (mfunArr.concat( mretArr ).map( function (x) { return x.containing_function.fullname; }))
                                     .join(',')
                             ) +
                             ' - Please check for basic errors. For example a `metaret` can only be used from within a `metafun`.' +
                             ' See also github issue #9: https://github.com/glathoud/js.metaret/issues/9'
                           );
        }

        function enrich( begin )
        {
            var containing_function;
            for (var n = fm.length, i = 0; i < n; i++)
            {
                var one_fm = fm[ i ];
                if (one_fm.begin <= begin  &&  begin < one_fm.end)
                {
                    containing_function = one_fm;
                    break;
                }
            }
            
            return { 
                begin : begin
                , containing_function : containing_function
                , containing_function_fullname : containing_function  &&  containing_function.fullname
                , local_context : jscode.substring( Math.max( 0, begin - 50 ), begin + 40 )
            };
        }
    }

})( this );

}

//#BUILD_END_FILE: "jsm2js.js"


    
//#BUILD_BEGIN_FILE: "inline.js"


{
/*global need$ load codeparse lp2fmtree console print JSON*/

if (typeof codeparse === 'undefined')
    
//#BUILD_BEGIN_FILE: "codeparse.js"


{

}

//#BUILD_END_FILE: "codeparse.js"



if (typeof lp2fmtree === 'undefined')
    
//#BUILD_BEGIN_FILE: "lp2fmtree.js"


{

}

//#BUILD_END_FILE: "lp2fmtree.js"



(function (global) {

    var       INLINE = 'inline'
    , CODEPARSE_OPT = { 
        extraReservedArr  : [ INLINE ]
    }

    , VARASSIGN = 'varassign'
    ,    ASSIGN = 'assign'
    ,      CALL = 'call'
    
    // xxx constants should be in a separate file
    ,   BRACKET = 'bracket'
    ,     ROUND = 'round'
    , IDENTIFIER = 'identifier'
    ,   RESERVED = 'reserved'
    ,     RETURN = 'return'
    ,        VAR = 'var'
    ,    VARDECL = 'vardecl'
    ;
    
    global.inline = inline;

    function inline( code, /*?object?*/workspace, /*?object?*/opt_code_info, /*?array?*/error_inline_stack )
    // Remove `inline` statements, replace them with hygienic inlining 
    // of the called function.
    //
    // Returns: another code string.
    //
    // Examples:
    // {{{
    // inline var result = f(x,y,z);
    //
    // inline result = f(x,y,z);
    //
    // inline f(x,y,z);
    // }}}
    //
    // See also:
    // 
    // issue [#3](https://github.com/glathoud/js.metaret/issues/3) 
    // 
    // ./jsm_dev/expl_longer.jsm
    //
    // Guillaume Lathoud
    // glathoud@yahoo.fr
    {
        workspace  ||  (workspace = {});

        error_inline_stack  ||  (error_inline_stack = []);
        
        // Parse this piece of code: find inline statements.

        var      lp = codeparse( code, CODEPARSE_OPT )
        ,        fm = lp2fmtree( lp )
        
        ,       all = lp.all
        , inlineArr = all
            .map( function (o, ind) { 
                var ret = getInlineInfo( o, ind, all, code ); 
                if (ret) 
                {
                    ret.begin = ret.o.begin;
                    ret.end   = ret.args.end;
                    ret.str   = code.substring( ret.begin, ret.end );
                }
                return ret;
            })
            .filter( function (info) { return info; } )
        ;

        var lastname2fmarr = fm.lastname2fmarr;

        var key = opt_code_info  ?  JSON.stringify( opt_code_info )  :  code;
        
        error_inline_stack.push( { key : key, code : code, workspace : workspace, opt_code_info : opt_code_info } );
        
        if (key in workspace)
        {
            var newcode = workspace[ key ].newcode;
            
            if ('string' !== typeof newcode)
            {
                if ('undefined' !== typeof console  &&  console  &&  console.error)
                {
                    console.error( 'error_inline_stack (summary):\n ' + error_inline_stack.map( function (x) { return '\n' + x.key.substring(0,96) + (x.key.length < 96  ?  ''  :  '...'); } ).join( '\n\n###\n' ) );
                    console.error( 'error_inline_stack (full):');
                    console.error( error_inline_stack );
                }
                throw new Error( 'inline error: Most likely you have an infinite `inline` recursion. Consider using `metafun` and `metaret` instead.' );
            }
            
            return newcode;
        }

        workspace[ key ] = {
            code_info   : opt_code_info  // e.g. path of the file
            , inlineArr : inlineArr
            , lastname2fmarr : lastname2fmarr
            , lp : lp
            , fm : fm
        };
        
        if (!inlineArr.length)
            return workspace[ key ].newcode = code;

        // For each inline statement, look for an unambiguous match,
        // in this piece of code, else in another one (workspace).

        for (var i = inlineArr.length; i--;)
        {
            var one = inlineArr[ i ];

            // Try first in the same piece of code.

            one.fmScopePath = getFmScopePath( fm, one );

            var local_fmCallMatch = getFmCallMatch( fm, one, one.fmScopePath );
            if (local_fmCallMatch)
            {
                one.hasLocalMatch = true;
                one.fmCallMatch   = local_fmCallMatch;
                one.matchKey      = key;
            }
            else
            {
                // Try second in other pieces of codes (typically other files).

                var matches  = []
                ,   callname = one.call.name
                ;
                (callname || 0).substring.call.a;

                for (var other_key in workspace) { if (workspace.hasOwnProperty( key )) {

                    if (key === other_key)
                        continue;
                    
                    var other_stuff          = workspace[ other_key ]
                    ,   other_lastname2fmarr = other_stuff.lastname2fmarr
                    ,   other_fmarr = other_lastname2fmarr[ callname ]
                    ,   other_n     = other_fmarr  &&  other_fmarr.length
                    ;
                    if (other_n === 1)
                    {
                        if (one.fmCallMatch)
                        {
                            throw new Error( 'Ambiguous match for inline call "' + callname + '" found between the 2 pieces: ' + one.matchKey + 
                                             '\n --- and --- \n' + other_key 
                                           );
                        }
                        
                        one.hasLocalMatch   = false;
                        one.fmCallMatch     = other_fmarr[ 0 ];
                        one.matchKey        = other_key;

                        // Globals are permitted (e.g. to access some
                        // tools), but not local closure in some
                        // parent function, because the latter would
                        // be lost when inlining the body.
                        // 
                        // See also:
                        // https://github.com/glathoud/js.metaret/issues/7
                        // 
                        // And the test in:  ./jsm_dev/expl.test.js
                        check_no_local_closure( one.fmCallMatch );
                    }
                    else if (other_n === 2)
                    {
                        throw new Error( 'Ambiguous match for inline call "' + callname + '" found within piece "' + other_key );
                    }
                }}
            }

            if (!one.fmCallMatch)
                throw new Error( 'inline error: when inlining within a file, the source body must be visible to the target inline location. one.call.name: "' + one.call.name + '", opt_code_info: ' + JSON.stringify( opt_code_info )  );
            
            // beginner help: detect `arguments` usage
            // https://github.com/glathoud/js.metaret/issues/10
            var matchBegin   = one.fmCallMatch.begin
            ,   matchEnd     = one.fmCallMatch.end
            ,   argumentsArr = lp.identifierObj[ 'arguments' ]  ||  []
            ;
            if (argumentsArr.some( function (x) { return matchBegin <= x  &&  x < matchEnd; } ))
                throw new Error( 'inline error: it is forbidden to use `arguments` in the body of the function to be inlined.' );
        }
        
        // Actually inline
        
        var newcode = code;
        for (var i = inlineArr.length; i--;)
        {
            var one = inlineArr[ i ]
            , begin = one.begin
            ,   end = one.end
            ;
            newcode = newcode.substring( 0, begin ) +

            // Quick implementation to support imbricated inlines.
            // https://github.com/glathoud/js.metaret/issues/6
            inline( getInlineCodeHygienic( lp.identifierObj, fm, one ), workspace, /*opt_code_info:*/null, error_inline_stack ) + 
                
            newcode.substring( end )
            ;
        }
        
        return workspace[ key ].newcode = newcode;
    }

    // --- Details

    function getInlineInfo( o, ind, all, code )
    {
        if (o.name !== INLINE)
            return;
        
        var v            // var        (optional)
        ,   identifier   // identifier (optional)
        ,   call         // call       (mandatory)
        ,   args         // call args  (mandatory)
        ;

        if ((call = all[ ind+1 ]).type === CALL  &&  
            (args = all[ ind+2 ]).type === BRACKET  &&  args.typebracket === ROUND)
        {
            return {
                o            : o
                , ind        : ind
                , inlinetype : CALL
                , call       : call
                , args       : args
            };
        }

        if ((identifier = all[ ind+1 ]).type === IDENTIFIER  &&  
            (call = all[ ind+2 ]).type === CALL  &&  
            (args = all[ ind+3 ]).type === BRACKET  &&  args.typebracket === ROUND  &&  
            /=/.test( code.substring( identifier.end, call.begin )))
        {
            return {
                o            : o
                , ind        : ind
                , inlinetype : ASSIGN
                , identifier : identifier
                , call       : call
                , args       : args
            };
        }

        var vc;
        if ((v = all[ ind+1 ]).type === BRACKET   &&  v.typebracket === VAR  &&
            (vc = v.children).length === 4  &&
            (identifier = vc[ 1 ]).type === VARDECL  &&  
            (call       = vc[ 2 ]).type === CALL  &&  
            (args       = vc[ 3 ]).type === BRACKET  &&  args.typebracket === ROUND  &&  
            /=/.test( code.substring( identifier.end, call.begin )))
        {
            return {
                o            : o
                , ind        : ind
                , inlinetype : VARASSIGN
                , identifier : identifier
                , call       : call
                , args       : args
            };
        }

        throw new Error( 'Unrecognized inline syntax.' );
    }


    function getInlineCodeHygienic( identifierObj, fm, one )
    {
        var error;

        var fmScopePath = one.fmScopePath
        ,   fmCallMatch = one.fmCallMatch
        ;
        if (-1 < fmScopePath.indexOf( fmCallMatch ))
        {
            if ('undefined' !== typeof console)  
                console.error( 'Could not inline: self-recursion found for "' + fmCallMatch.fullname+ '".' );
            else if ('undefined' !== typeof print)
                print( '[ERROR] Could not inline: self-recursion found for "' + fmCallMatch.fullname+ '".' );

            // Just drop the "inline" identifier
            return one.str.substring( INLINE.length );
        }

        // Hygenic inlining: rename local variables and take a few
        // other precautions to guarantee the same functionality
        // as the original function call.
        
        // while true  .. break
        // _undef_
        // _ret_
        // var x; -> var x = _undef_; // (e.g. looping use case)
        // return -> _ret_ = ; break;

        var io = Object.create( identifierObj );

        var undefN = getNewName( 'undef', io )
        ,     retN = getNewName( 'ret',   io )

        , param_arr    = fmCallMatch.param_arr
        , paramN_arr   = param_arr.map( function (name) { return getNewName( name, io ); } )
        , paramN_map   = getMapping( param_arr, paramN_arr )

        , vardeclArr   = fmCallMatch.vardeclArr
        , varnameArr   = vardeclArr.map( function (x) { return x.name; } )
        , vardeclN_arr = varnameArr.map( function (name) { return getNewName( name, io ); } )
        , vardeclN_map = getMapping( varnameArr, vardeclN_arr )

        , body = fmCallMatch.body
        , body_begin = fmCallMatch.body_node.begin
        , body_end   = fmCallMatch.body_node.end
        , body_length = body_end - body_begin
        , toReplace = []

        , body_lp = codeparse( body, CODEPARSE_OPT )
        ;
        
        // Prepare: Will replace variable names

        for (var i = body_lp.identifierArr.length; i--;)
        {
            var ident = body_lp.identifierArr[ i ]
            ,  newstr = paramN_map[ ident.name ]  ||  vardeclN_map[ ident.name ]
            ;
            if (newstr)
                toReplace.push( { o : ident, newstr : newstr } );
        }
        
        // Prepare: Will replace function names in calls

        for (var i = body_lp.callArr.length; i--;)
        {
            var call = body_lp.callArr[ i ]
            , newstr = paramN_map[ call.name ]  ||  vardeclN_map[ call.name ]
            ;
            if (newstr)
                toReplace.push( { o : call, newstr : call.str.replace( call.name, newstr ) } );
        }
        
        // Prepare: Will replace returns

        for (var i = body_lp.bracketextraArr.length; i--;)
        {
            var brack = body_lp.bracketextraArr[ i ];
            if (brack.typebracket !== RETURN)
                continue;
            
            toReplace.push( { o : { begin : brack.begin
                                    , end : brack.begin + RETURN.length
                                  }
                              , newstr : retN + ' = '
                            }
                          );
            toReplace.push( { o : { begin : brack.end
                                    , end : brack.end
                                  }
                              , newstr : ' break;'
                            }
                          );
        }
        
        toReplace.sort( function (a,b) { 
            var error;
            return a.o.begin < b.o.begin  ?  -1
                :  a.o.end > b.o.end  ?  +1
                :  error.bug
            ;
        });
        
        // Actually replace

        var newbody = body;

        for (var i = toReplace.length; i--;)
        {
            var r = toReplace[ i ];
            newbody = newbody.substring( 0, r.o.begin )
                + r.newstr
                + newbody.substring( r.o.end )
            ;
        }
        
        // Set input argument values.

        var oas = one.args.sepSplit
        , set_args_arr = paramN_arr.map( function (pN, i) {
            return 'var ' + pN + ' = ' + 
                (i < oas.length  
                 ?  oas[ i ].str  // argument given
                 :  undefN        // argument missing
                ) +
                ';'
            ;
        });
        
        // Beginning: Make sure "undefined" declarations work (e.g. when looping, need to reset such variables)
        
        var var_decl_undef_arr = []
        ,   var_decl_undef_set = {}
        ;

        for (var n = body_lp.bracketextraArr.length, i = 0; i < n; i++)
        {
            var brack = body_lp.bracketextraArr[ i ];
            if (brack.typebracket !== VAR)
             continue;
            
            var vdArr = brack.vdArr;
            for (var nj = vdArr.length, j = 0; j < nj; j++)
            {
                var vd = vdArr[ j ];
                if (!vd.rightstr  &&  !(vd.leftstr in var_decl_undef_set))
                {
                    var_decl_undef_arr.push( vardeclN_map[ vd.leftstr ] + ' = ' + undefN );
                    var_decl_undef_set[ vd.leftstr ] = 1;
                }
            }
        }
        
        // Wrap the whole thing using a while loop.

        var bodyAlreadyCurly = /^\s*\{[\s\S]*?\}\s*$/.test( newbody );

        var newcode = [ '{'
                        , '//#INLINE_BEGIN: ' + one.str.replace( /\r\n/g, ' ' ) // On top, put the original "inline" call in a comment.
                      ]
            .concat( [ 'var ' + undefN + ', ' + retN + ';' ] )
            .concat( [ '//#INLINE_SET_INPUT_ARGS:' ] )
            .concat( set_args_arr )
            .concat( var_decl_undef_arr.length 
                     ? [ 'var ' + var_decl_undef_arr.join( ', ' ) + ';' ]
                     : []
                   )
            .concat( [ '//#INLINE_IMPLEMENT:' ] )
            .concat( [ 'do {' ] )
            .concat( newbody )
            .concat( [ '} while (false);' ] )
            .concat( one.inlinetype === CALL  ?  []  
                     : one.inlinetype === ASSIGN  ?  [ one.identifier.name + ' = ' + retN + ';' ] 
                     : one.inlinetype === VARASSIGN  ?  [ 'var ' + one.identifier.name + ' = ' + retN + ';' ] 
                     : error.bug
                   )
            .concat( [ '//#INLINE_END: ' + one.str.replace( /\r\n/g, ' ' ) ] ) // On the bottom as well, put the original "inline" call in a comment.
            .concat( [ '}' ] )
            .join( '\n' )
        ;
        
        return newcode;
    }

    function getMapping( arr_in, arr_out )
    {
        var ret = {};
        for (var i = arr_in.length; i--;)
            ret[ arr_in[ i ] ] = arr_out[ i ];
        
        return ret;
    }

    function getNewName( name, io )
    {
        var base = '_' + name + '_'
        ,   i    = ''
        ,   newname
        ;
        while ((newname = base + i) in io)
            i = +i+1;  // i: '', 1, 2, 3, ...

        io[ newname ] = 1;
        return newname;
    }

    function getFmScopePath( fmtree, one, sofar )
    {
        sofar  ||  (sofar = []);
        for (var n = fmtree.length, i = 0; i < n; i++)
        {
            var fm = fmtree[ i ];
            if (fm.begin <= one.begin  &&  one.end <= fm.end)
            {
                sofar.push( fm );
                getFmScopePath( fm.children  ||  [], one, sofar );
                break;
            }
        }
        return sofar;
    }
    
    function getFmCallMatch( fmtree, one, fmScopePath )
    {
        var callname = one.call.name
        ,   all      = fmtree.concat( fmScopePath )
        ,   match
        ;
        
        top_loop: for (var i = all.length; i--;)  // i--: Important: search locally first
        {
            var fm = all[ i ];

            var fmc = fm.children  ||  [];
            for (var j = fmc.length; j--; )
            {
                var c = fmc[ j ];
                if (c.lastname === callname)
                {
                    match = c;
                    break top_loop;
                }
            }

            if (fm.lastname === callname)
            {
                match = fm;
                break top_loop;
            }

            // Not found, move one scope upwards.
        }
        
        if (match)
            check_bound_variables_all_shared( match, fmScopePath.slice( -1 )[ 0 ] );

        return match;
    }

    // ---------- Checks

    function check_no_local_closure( fm )
    {
        var vuo = fm.varuseObj
        ,   vdo = fm.vardeclObj
        ;
        for (var name in vuo) { if (!(name in vdo)) {
            
            // Not declared here. 
            // -> global: ok.
            // -> local declared in a parent function (closure): forbidden.
            // 
            // See also:
            // https://github.com/glathoud/js.metaret/issues/7
            // ./jsm_dev/expl.test.js
            var pFm = fm;
            while (pFm = pFm.parent)
            {
                if (name in pFm.vardeclObj)
                {
                    throw new Error('inline error: when inlining across files, the body to inline MUST NOT use locally bound variables (closures). (It may use globals, though.)');
                }
            }
            

        }}
        
    }


    function check_bound_variables_all_shared( match, target_inline_fm )
    // https://github.com/glathoud/js.metaret/issues/7
    // 
    // If the `match` body source has any bound variables, they must
    // be shared with the target `one` location.
    //
    // In particular, we detect re-declaration ambiguities.
    //
    // See also failure detection examples in ./jsm_dev/expl.test.js
    {
        var bound  = []
        ,   m_vuo  = match.varuseObj
        ,   m_vdo  = match.vardeclObj
        ,   m_pset = match.param_set
        ;
        for (var name in m_vuo) { if (!(name in m_vdo) && !(name in m_pset)) { bound.push( name ); } }
        
        bound.forEach( check_declared_in_same_scope );

        function check_declared_in_same_scope( name )
        {
            var m_decl_scope = decl_scope( name, match )
            ,   t_decl_scope = decl_scope( name, target_inline_fm )
            ;
            if (m_decl_scope !== t_decl_scope)
                throw new Error( 'inline error: when inlining within a file, the source body and the target inline location must share their bound variables (if the source body has any).' );
        }

        function decl_scope( name, fm )
        // Returns the closest scope where `name` is declared (`fm` or
        // one of its parents), else `null` for a global variable.
        {
            return fm  
            ?  (fm.vardeclObj[ name ]  ?  fm  :  decl_scope( name, fm.parent ))
            :  null  // global variable
            ;
        }
    }

    
})(this);

}

//#BUILD_END_FILE: "inline.js"



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

}

//#BUILD_END_FILE: "need$.js"


