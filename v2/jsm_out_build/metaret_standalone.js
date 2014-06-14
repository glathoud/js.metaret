
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
/*global metaparse jsm2js cp2fmtree codeparse need$ load console*/

// Support both use cases: browser development (example: jsm_dev) and
// command-line transformation (example: jsm_dev -> jsm_out).
if (typeof codeparse === 'undefined')
    
//#BUILD_BEGIN_FILE: "codeparse.js"


{
/*global acorn need$ load*/

if (typeof acorn === 'undefined')
    
//#BUILD_BEGIN_FILE: "acorn.25.03.2014/acorn.js"


{
// Acorn is a tiny, fast JavaScript parser written in JavaScript.
//
// Acorn was written by Marijn Haverbeke and released under an MIT
// license. The Unicode regexps (for identifiers and whitespace) were
// taken from [Esprima](http://esprima.org) by Ariya Hidayat.
//
// Git repositories for Acorn are available at
//
//     http://marijnhaverbeke.nl/git/acorn
//     https://github.com/marijnh/acorn.git
//
// Please use the [github bug tracker][ghbt] to report issues.
//
// [ghbt]: https://github.com/marijnh/acorn/issues
//
// This file defines the main parser interface. The library also comes
// with a [error-tolerant parser][dammit] and an
// [abstract syntax tree walker][walk], defined in other files.
//
// [dammit]: acorn_loose.js
// [walk]: util/walk.js

(function(root, mod) {
  if (typeof exports == "object" && typeof module == "object") return mod(exports); // CommonJS
  if (typeof define == "function" && define.amd) return define(["exports"], mod); // AMD
  mod(root.acorn || (root.acorn = {})); // Plain browser env
})(this, function(exports) {
  "use strict";

  exports.version = "0.5.1";

  // The main exported interface (under `self.acorn` when in the
  // browser) is a `parse` function that takes a code string and
  // returns an abstract syntax tree as specified by [Mozilla parser
  // API][api], with the caveat that the SpiderMonkey-specific syntax
  // (`let`, `yield`, inline XML, etc) is not recognized.
  //
  // [api]: https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API

  var options, input, inputLen, sourceFile;

  exports.parse = function(inpt, opts) {
    input = String(inpt); inputLen = input.length;
    setOptions(opts);
    initTokenState();
    return parseTopLevel(options.program);
  };

  // A second optional argument can be given to further configure
  // the parser process. These options are recognized:

  var defaultOptions = exports.defaultOptions = {
    // `ecmaVersion` indicates the ECMAScript version to parse. Must
    // be either 3 or 5. This
    // influences support for strict mode, the set of reserved words, and
    // support for getters and setter.
    ecmaVersion: 5,
    // Turn on `strictSemicolons` to prevent the parser from doing
    // automatic semicolon insertion.
    strictSemicolons: false,
    // When `allowTrailingCommas` is false, the parser will not allow
    // trailing commas in array and object literals.
    allowTrailingCommas: true,
    // By default, reserved words are not enforced. Enable
    // `forbidReserved` to enforce them. When this option has the
    // value "everywhere", reserved words and keywords can also not be
    // used as property names.
    forbidReserved: false,
    // When enabled, a return at the top level is not considered an
    // error.
    allowReturnOutsideFunction: false,
    // When `locations` is on, `loc` properties holding objects with
    // `start` and `end` properties in `{line, column}` form (with
    // line being 1-based and column 0-based) will be attached to the
    // nodes.
    locations: false,
    // A function can be passed as `onComment` option, which will
    // cause Acorn to call that function with `(block, text, start,
    // end)` parameters whenever a comment is skipped. `block` is a
    // boolean indicating whether this is a block (`/* */`) comment,
    // `text` is the content of the comment, and `start` and `end` are
    // character offsets that denote the start and end of the comment.
    // When the `locations` option is on, two more parameters are
    // passed, the full `{line, column}` locations of the start and
    // end of the comments. Note that you are not allowed to call the
    // parser from the callback—that will corrupt its internal state.
    onComment: null,
    // Nodes have their start and end characters offsets recorded in
    // `start` and `end` properties (directly on the node, rather than
    // the `loc` object, which holds line/column data. To also add a
    // [semi-standardized][range] `range` property holding a `[start,
    // end]` array with the same numbers, set the `ranges` option to
    // `true`.
    //
    // [range]: https://bugzilla.mozilla.org/show_bug.cgi?id=745678
    ranges: false,
    // It is possible to parse multiple files into a single AST by
    // passing the tree produced by parsing the first file as
    // `program` option in subsequent parses. This will add the
    // toplevel forms of the parsed file to the `Program` (top) node
    // of an existing parse tree.
    program: null,
    // When `locations` is on, you can pass this to record the source
    // file in every node's `loc` object.
    sourceFile: null,
    // This value, if given, is stored in every node, whether
    // `locations` is on or off.
      directSourceFile: null,

      // JSM extension of the language (metafun, metaret, inline and dotted function names in function declarations)
      jsm: false
  };

  function setOptions(opts) {
    options = opts || {};
    for (var opt in defaultOptions) if (!Object.prototype.hasOwnProperty.call(options, opt))
      options[opt] = defaultOptions[opt];
    sourceFile = options.sourceFile || null;
  }

  // The `getLineInfo` function is mostly useful when the
  // `locations` option is off (for performance reasons) and you
  // want to find the line/column position for a given character
  // offset. `input` should be the code string that the offset refers
  // into.

  var getLineInfo = exports.getLineInfo = function(input, offset) {
    for (var line = 1, cur = 0;;) {
      lineBreak.lastIndex = cur;
      var match = lineBreak.exec(input);
      if (match && match.index < offset) {
        ++line;
        cur = match.index + match[0].length;
      } else break;
    }
    return {line: line, column: offset - cur};
  };

  // Acorn is organized as a tokenizer and a recursive-descent parser.
  // The `tokenize` export provides an interface to the tokenizer.
  // Because the tokenizer is optimized for being efficiently used by
  // the Acorn parser itself, this interface is somewhat crude and not
  // very modular. Performing another parse or call to `tokenize` will
  // reset the internal state, and invalidate existing tokenizers.

  exports.tokenize = function(inpt, opts) {
    input = String(inpt); inputLen = input.length;
    setOptions(opts);
    initTokenState();

    var t = {};
    function getToken(forceRegexp) {
      lastEnd = tokEnd;
      readToken(forceRegexp);
      t.start = tokStart; t.end = tokEnd;
      t.startLoc = tokStartLoc; t.endLoc = tokEndLoc;
      t.type = tokType; t.value = tokVal;
      return t;
    }
    getToken.jumpTo = function(pos, reAllowed) {
      tokPos = pos;
      if (options.locations) {
        tokCurLine = 1;
        tokLineStart = lineBreak.lastIndex = 0;
        var match;
        while ((match = lineBreak.exec(input)) && match.index < pos) {
          ++tokCurLine;
          tokLineStart = match.index + match[0].length;
        }
      }
      tokRegexpAllowed = reAllowed;
      skipSpace();
    };
    return getToken;
  };

  // State is kept in (closure-)global variables. We already saw the
  // `options`, `input`, and `inputLen` variables above.

  // The current position of the tokenizer in the input.

  var tokPos;

  // The start and end offsets of the current token.

  var tokStart, tokEnd;

  // When `options.locations` is true, these hold objects
  // containing the tokens start and end line/column pairs.

  var tokStartLoc, tokEndLoc;

  // The type and value of the current token. Token types are objects,
  // named by variables against which they can be compared, and
  // holding properties that describe them (indicating, for example,
  // the precedence of an infix operator, and the original name of a
  // keyword token). The kind of value that's held in `tokVal` depends
  // on the type of the token. For literals, it is the literal value,
  // for operators, the operator name, and so on.

  var tokType, tokVal;

  // Interal state for the tokenizer. To distinguish between division
  // operators and regular expressions, it remembers whether the last
  // token was one that is allowed to be followed by an expression.
  // (If it is, a slash is probably a regexp, if it isn't it's a
  // division operator. See the `parseStatement` function for a
  // caveat.)

  var tokRegexpAllowed;

  // When `options.locations` is true, these are used to keep
  // track of the current line, and know when a new line has been
  // entered.

  var tokCurLine, tokLineStart;

  // These store the position of the previous token, which is useful
  // when finishing a node and assigning its `end` position.

  var lastStart, lastEnd, lastEndLoc;

  // This is the parser's state. `inFunction` is used to reject
  // `return` statements outside of functions, `labels` to verify that
  // `break` and `continue` have somewhere to jump to, and `strict`
  // indicates whether strict mode is on.

  var inFunction, labels, strict;

    // JSM extension for metafunctions
    var jsmInMetafun;

  // This function is used to raise exceptions on parse errors. It
  // takes an offset integer (into the current `input`) to indicate
  // the location of the error, attaches the position to the end
  // of the error message, and then raises a `SyntaxError` with that
  // message.

  function raise(pos, message) {
    var loc = getLineInfo(input, pos);
    message += " (" + loc.line + ":" + loc.column + ")";
    var err = new SyntaxError(message);
    err.pos = pos; err.loc = loc; err.raisedAt = tokPos;
    throw err;
  }

  // Reused empty array added for node fields that are always empty.

  var empty = [];

  // ## Token types

  // The assignment of fine-grained, information-carrying type objects
  // allows the tokenizer to store the information it has about a
  // token in a way that is very cheap for the parser to look up.

  // All token type variables start with an underscore, to make them
  // easy to recognize.

  // These are the general types. The `type` property is only used to
  // make them recognizeable when debugging.

  var _num = {type: "num"}, _regexp = {type: "regexp"}, _string = {type: "string"};
  var _name = {type: "name"}, _eof = {type: "eof"};

  // Keyword tokens. The `keyword` property (also used in keyword-like
  // operators) indicates that the token originated from an
  // identifier-like word, which is used when parsing property names.
  //
  // The `beforeExpr` property is used to disambiguate between regular
  // expressions and divisions. It is set on all token types that can
  // be followed by an expression (thus, a slash after them would be a
  // regular expression).
  //
  // `isLoop` marks a keyword as starting a loop, which is important
  // to know when parsing a label, in order to allow or disallow
  // continue jumps to that label.

  var _break = {keyword: "break"}, _case = {keyword: "case", beforeExpr: true}, _catch = {keyword: "catch"};
  var _continue = {keyword: "continue"}, _debugger = {keyword: "debugger"}, _default = {keyword: "default"};
  var _do = {keyword: "do", isLoop: true}, _else = {keyword: "else", beforeExpr: true};
  var _finally = {keyword: "finally"}, _for = {keyword: "for", isLoop: true}, _function = {keyword: "function"};
  var _if = {keyword: "if"}, _return = {keyword: "return", beforeExpr: true}, _switch = {keyword: "switch"};
  var _throw = {keyword: "throw", beforeExpr: true}, _try = {keyword: "try"}, _var = {keyword: "var"};
  var _while = {keyword: "while", isLoop: true}, _with = {keyword: "with"}, _new = {keyword: "new", beforeExpr: true};
  var _this = {keyword: "this"};

    // JSM: Additional keywords
    var _jsm_metafun = {keyword: "metafun"}
    , _jsm_metaret = {keyword: "metaret", beforeExpr: true}
    , _jsm_inline  = {keyword: "inline"}
    ;

  // The keywords that denote values.

  var _null = {keyword: "null", atomValue: null}, _true = {keyword: "true", atomValue: true};
  var _false = {keyword: "false", atomValue: false};

  // Some keywords are treated as regular operators. `in` sometimes
  // (when parsing `for`) needs to be tested against specifically, so
  // we assign a variable name to it for quick comparing.

  var _in = {keyword: "in", binop: 7, beforeExpr: true};

  // Map keyword names to token types.

  var keywordTypes = {"break": _break, "case": _case, "catch": _catch,
                      "continue": _continue, "debugger": _debugger, "default": _default,
                      "do": _do, "else": _else, "finally": _finally, "for": _for,
                      "function": _function, "if": _if, "return": _return, "switch": _switch,
                      "throw": _throw, "try": _try, "var": _var, "while": _while, "with": _with,
                      "null": _null, "true": _true, "false": _false, "new": _new, "in": _in,
                      "instanceof": {keyword: "instanceof", binop: 7, beforeExpr: true}, "this": _this,
                      "typeof": {keyword: "typeof", prefix: true, beforeExpr: true},
                      "void": {keyword: "void", prefix: true, beforeExpr: true},
                      "delete": {keyword: "delete", prefix: true, beforeExpr: true},
                     };

    // JSM extension
    var jsmKeywordTypes = {
	"metafun": _jsm_metafun, "metaret": _jsm_metaret, "inline": _jsm_inline
    };

    

  // Punctuation token types. Again, the `type` property is purely for debugging.

  var _bracketL = {type: "[", beforeExpr: true}, _bracketR = {type: "]"}, _braceL = {type: "{", beforeExpr: true};
  var _braceR = {type: "}"}, _parenL = {type: "(", beforeExpr: true}, _parenR = {type: ")"};
  var _comma = {type: ",", beforeExpr: true}, _semi = {type: ";", beforeExpr: true};
  var _colon = {type: ":", beforeExpr: true}, _dot = {type: "."}, _question = {type: "?", beforeExpr: true};

  // Operators. These carry several kinds of properties to help the
  // parser use them properly (the presence of these properties is
  // what categorizes them as operators).
  //
  // `binop`, when present, specifies that this operator is a binary
  // operator, and will refer to its precedence.
  //
  // `prefix` and `postfix` mark the operator as a prefix or postfix
  // unary operator. `isUpdate` specifies that the node produced by
  // the operator should be of type UpdateExpression rather than
  // simply UnaryExpression (`++` and `--`).
  //
  // `isAssign` marks all of `=`, `+=`, `-=` etcetera, which act as
  // binary operators with a very low precedence, that should result
  // in AssignmentExpression nodes.

  var _slash = {binop: 10, beforeExpr: true}, _eq = {isAssign: true, beforeExpr: true};
  var _assign = {isAssign: true, beforeExpr: true};
  var _incDec = {postfix: true, prefix: true, isUpdate: true}, _prefix = {prefix: true, beforeExpr: true};
  var _logicalOR = {binop: 1, beforeExpr: true};
  var _logicalAND = {binop: 2, beforeExpr: true};
  var _bitwiseOR = {binop: 3, beforeExpr: true};
  var _bitwiseXOR = {binop: 4, beforeExpr: true};
  var _bitwiseAND = {binop: 5, beforeExpr: true};
  var _equality = {binop: 6, beforeExpr: true};
  var _relational = {binop: 7, beforeExpr: true};
  var _bitShift = {binop: 8, beforeExpr: true};
  var _plusMin = {binop: 9, prefix: true, beforeExpr: true};
  var _multiplyModulo = {binop: 10, beforeExpr: true};

  // Provide access to the token types for external users of the
  // tokenizer.

  exports.tokTypes = {bracketL: _bracketL, bracketR: _bracketR, braceL: _braceL, braceR: _braceR,
                      parenL: _parenL, parenR: _parenR, comma: _comma, semi: _semi, colon: _colon,
                      dot: _dot, question: _question, slash: _slash, eq: _eq, name: _name, eof: _eof,
                      num: _num, regexp: _regexp, string: _string};
  for (var kw in keywordTypes) exports.tokTypes["_" + kw] = keywordTypes[kw];

  // This is a trick taken from Esprima. It turns out that, on
  // non-Chrome browsers, to check whether a string is in a set, a
  // predicate containing a big ugly `switch` statement is faster than
  // a regular expression, and on Chrome the two are about on par.
  // This function uses `eval` (non-lexical) to produce such a
  // predicate from a space-separated string of words.
  //
  // It starts by sorting the words by length.


  function makePredicate(words) {
    words = words.split(" ");
    var f = "", cats = [];
    out: for (var i = 0; i < words.length; ++i) {
      for (var j = 0; j < cats.length; ++j)
        if (cats[j][0].length == words[i].length) {
          cats[j].push(words[i]);
          continue out;
        }
      cats.push([words[i]]);
    }
    function compareTo(arr) {
      if (arr.length == 1) return f += "return str === " + JSON.stringify(arr[0]) + ";";
      f += "switch(str){";
      for (var i = 0; i < arr.length; ++i) f += "case " + JSON.stringify(arr[i]) + ":";
      f += "return true}return false;";
    }

    // When there are more than three length categories, an outer
    // switch first dispatches on the lengths, to save on comparisons.

    if (cats.length > 3) {
      cats.sort(function(a, b) {return b.length - a.length;});
      f += "switch(str.length){";
      for (var i = 0; i < cats.length; ++i) {
        var cat = cats[i];
        f += "case " + cat[0].length + ":";
        compareTo(cat);
      }
      f += "}";

    // Otherwise, simply generate a flat `switch` statement.

    } else {
      compareTo(words);
    }
    return new Function("str", f);
  }

  // The ECMAScript 3 reserved word list.

  var isReservedWord3 = makePredicate("abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile");

  // ECMAScript 5 reserved words.

  var isReservedWord5 = makePredicate("class enum extends super const export import");

  // The additional reserved words in strict mode.

  var isStrictReservedWord = makePredicate("implements interface let package private protected public static yield");

  // The forbidden variable names in strict mode.

  var isStrictBadIdWord = makePredicate("eval arguments");

  // And the keywords.

  var isKeyword = makePredicate("break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this");

    // JSM extension
    var isKeywordJsm = makePredicate("metafun metaret inline");

  // ## Character categories

  // Big ugly regular expressions that match characters in the
  // whitespace, identifier, and identifier-start categories. These
  // are only applied when a character is found to actually have a
  // code point above 128.

  var nonASCIIwhitespace = /[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/;
  var nonASCIIidentifierStartChars = "\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc";
  var nonASCIIidentifierChars = "\u0300-\u036f\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u0620-\u0649\u0672-\u06d3\u06e7-\u06e8\u06fb-\u06fc\u0730-\u074a\u0800-\u0814\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0840-\u0857\u08e4-\u08fe\u0900-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962-\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09d7\u09df-\u09e0\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2-\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b5f-\u0b60\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62-\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2-\u0ce3\u0ce6-\u0cef\u0d02\u0d03\u0d46-\u0d48\u0d57\u0d62-\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e34-\u0e3a\u0e40-\u0e45\u0e50-\u0e59\u0eb4-\u0eb9\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f41-\u0f47\u0f71-\u0f84\u0f86-\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u1000-\u1029\u1040-\u1049\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u170e-\u1710\u1720-\u1730\u1740-\u1750\u1772\u1773\u1780-\u17b2\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u1920-\u192b\u1930-\u193b\u1951-\u196d\u19b0-\u19c0\u19c8-\u19c9\u19d0-\u19d9\u1a00-\u1a15\u1a20-\u1a53\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1b46-\u1b4b\u1b50-\u1b59\u1b6b-\u1b73\u1bb0-\u1bb9\u1be6-\u1bf3\u1c00-\u1c22\u1c40-\u1c49\u1c5b-\u1c7d\u1cd0-\u1cd2\u1d00-\u1dbe\u1e01-\u1f15\u200c\u200d\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2d81-\u2d96\u2de0-\u2dff\u3021-\u3028\u3099\u309a\ua640-\ua66d\ua674-\ua67d\ua69f\ua6f0-\ua6f1\ua7f8-\ua800\ua806\ua80b\ua823-\ua827\ua880-\ua881\ua8b4-\ua8c4\ua8d0-\ua8d9\ua8f3-\ua8f7\ua900-\ua909\ua926-\ua92d\ua930-\ua945\ua980-\ua983\ua9b3-\ua9c0\uaa00-\uaa27\uaa40-\uaa41\uaa4c-\uaa4d\uaa50-\uaa59\uaa7b\uaae0-\uaae9\uaaf2-\uaaf3\uabc0-\uabe1\uabec\uabed\uabf0-\uabf9\ufb20-\ufb28\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f";
  var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
  var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");

  // Whether a single character denotes a newline.

  var newline = /[\n\r\u2028\u2029]/;

  // Matches a whole line break (where CRLF is considered a single
  // line break). Used to count lines.

  var lineBreak = /\r\n|[\n\r\u2028\u2029]/g;

  // Test whether a given character code starts an identifier.

  var isIdentifierStart = exports.isIdentifierStart = function(code) {
    if (code < 65) return code === 36;
    if (code < 91) return true;
    if (code < 97) return code === 95;
    if (code < 123)return true;
    return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code));
  };

  // Test whether a given character is part of an identifier.

  var isIdentifierChar = exports.isIdentifierChar = function(code) {
    if (code < 48) return code === 36;
    if (code < 58) return true;
    if (code < 65) return false;
    if (code < 91) return true;
    if (code < 97) return code === 95;
    if (code < 123)return true;
    return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code));
  };

  // ## Tokenizer

  // These are used when `options.locations` is on, for the
  // `tokStartLoc` and `tokEndLoc` properties.

  function Position() {
    this.line = tokCurLine;
    this.column = tokPos - tokLineStart;
  }

  // Reset the token state. Used at the start of a parse.

  function initTokenState() {
    tokCurLine = 1;
    tokPos = tokLineStart = 0;
    tokRegexpAllowed = true;
    skipSpace();
  }

  // Called at the end of every token. Sets `tokEnd`, `tokVal`, and
  // `tokRegexpAllowed`, and skips the space after the token, so that
  // the next one's `tokStart` will point at the right position.

  function finishToken(type, val) {
    tokEnd = tokPos;
    if (options.locations) tokEndLoc = new Position;
    tokType = type;
    skipSpace();
    tokVal = val;
    tokRegexpAllowed = type.beforeExpr;
  }

  function skipBlockComment() {
    var startLoc = options.onComment && options.locations && new Position;
    var start = tokPos, end = input.indexOf("*/", tokPos += 2);
    if (end === -1) raise(tokPos - 2, "Unterminated comment");
    tokPos = end + 2;
    if (options.locations) {
      lineBreak.lastIndex = start;
      var match;
      while ((match = lineBreak.exec(input)) && match.index < tokPos) {
        ++tokCurLine;
        tokLineStart = match.index + match[0].length;
      }
    }
    if (options.onComment)
      options.onComment(true, input.slice(start + 2, end), start, tokPos,
                        startLoc, options.locations && new Position);
  }

  function skipLineComment() {
    var start = tokPos;
    var startLoc = options.onComment && options.locations && new Position;
    var ch = input.charCodeAt(tokPos+=2);
    while (tokPos < inputLen && ch !== 10 && ch !== 13 && ch !== 8232 && ch !== 8233) {
      ++tokPos;
      ch = input.charCodeAt(tokPos);
    }
    if (options.onComment)
      options.onComment(false, input.slice(start + 2, tokPos), start, tokPos,
                        startLoc, options.locations && new Position);
  }

  // Called at the start of the parse and after every token. Skips
  // whitespace and comments, and.

  function skipSpace() {
    while (tokPos < inputLen) {
      var ch = input.charCodeAt(tokPos);
      if (ch === 32) { // ' '
        ++tokPos;
      } else if (ch === 13) {
        ++tokPos;
        var next = input.charCodeAt(tokPos);
        if (next === 10) {
          ++tokPos;
        }
        if (options.locations) {
          ++tokCurLine;
          tokLineStart = tokPos;
        }
      } else if (ch === 10 || ch === 8232 || ch === 8233) {
        ++tokPos;
        if (options.locations) {
          ++tokCurLine;
          tokLineStart = tokPos;
        }
      } else if (ch > 8 && ch < 14) {
        ++tokPos;
      } else if (ch === 47) { // '/'
        var next = input.charCodeAt(tokPos + 1);
        if (next === 42) { // '*'
          skipBlockComment();
        } else if (next === 47) { // '/'
          skipLineComment();
        } else break;
      } else if (ch === 160) { // '\xa0'
        ++tokPos;
      } else if (ch >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(ch))) {
        ++tokPos;
      } else {
        break;
      }
    }
  }

  // ### Token reading

  // This is the function that is called to fetch the next token. It
  // is somewhat obscure, because it works in character codes rather
  // than characters, and because operator parsing has been inlined
  // into it.
  //
  // All in the name of speed.
  //
  // The `forceRegexp` parameter is used in the one case where the
  // `tokRegexpAllowed` trick does not work. See `parseStatement`.

  function readToken_dot() {
    var next = input.charCodeAt(tokPos + 1);
    if (next >= 48 && next <= 57) return readNumber(true);
    ++tokPos;
    return finishToken(_dot);
  }

  function readToken_slash() { // '/'
    var next = input.charCodeAt(tokPos + 1);
    if (tokRegexpAllowed) {++tokPos; return readRegexp();}
    if (next === 61) return finishOp(_assign, 2);
    return finishOp(_slash, 1);
  }

  function readToken_mult_modulo() { // '%*'
    var next = input.charCodeAt(tokPos + 1);
    if (next === 61) return finishOp(_assign, 2);
    return finishOp(_multiplyModulo, 1);
  }

  function readToken_pipe_amp(code) { // '|&'
    var next = input.charCodeAt(tokPos + 1);
    if (next === code) return finishOp(code === 124 ? _logicalOR : _logicalAND, 2);
    if (next === 61) return finishOp(_assign, 2);
    return finishOp(code === 124 ? _bitwiseOR : _bitwiseAND, 1);
  }

  function readToken_caret() { // '^'
    var next = input.charCodeAt(tokPos + 1);
    if (next === 61) return finishOp(_assign, 2);
    return finishOp(_bitwiseXOR, 1);
  }

  function readToken_plus_min(code) { // '+-'
    var next = input.charCodeAt(tokPos + 1);
    if (next === code) {
      if (next == 45 && input.charCodeAt(tokPos + 2) == 62 &&
          newline.test(input.slice(lastEnd, tokPos))) {
        // A `-->` line comment
        tokPos += 3;
        skipLineComment();
        skipSpace();
        return readToken();
      }
      return finishOp(_incDec, 2);
    }
    if (next === 61) return finishOp(_assign, 2);
    return finishOp(_plusMin, 1);
  }

  function readToken_lt_gt(code) { // '<>'
    var next = input.charCodeAt(tokPos + 1);
    var size = 1;
    if (next === code) {
      size = code === 62 && input.charCodeAt(tokPos + 2) === 62 ? 3 : 2;
      if (input.charCodeAt(tokPos + size) === 61) return finishOp(_assign, size + 1);
      return finishOp(_bitShift, size);
    }
    if (next == 33 && code == 60 && input.charCodeAt(tokPos + 2) == 45 &&
        input.charCodeAt(tokPos + 3) == 45) {
      // `<!--`, an XML-style comment that should be interpreted as a line comment
      tokPos += 4;
      skipLineComment();
      skipSpace();
      return readToken();
    }
    if (next === 61)
      size = input.charCodeAt(tokPos + 2) === 61 ? 3 : 2;
    return finishOp(_relational, size);
  }

  function readToken_eq_excl(code) { // '=!'
    var next = input.charCodeAt(tokPos + 1);
    if (next === 61) return finishOp(_equality, input.charCodeAt(tokPos + 2) === 61 ? 3 : 2);
    return finishOp(code === 61 ? _eq : _prefix, 1);
  }

  function getTokenFromCode(code) {
    switch(code) {
      // The interpretation of a dot depends on whether it is followed
      // by a digit.
    case 46: // '.'
      return readToken_dot();

      // Punctuation tokens.
    case 40: ++tokPos; return finishToken(_parenL);
    case 41: ++tokPos; return finishToken(_parenR);
    case 59: ++tokPos; return finishToken(_semi);
    case 44: ++tokPos; return finishToken(_comma);
    case 91: ++tokPos; return finishToken(_bracketL);
    case 93: ++tokPos; return finishToken(_bracketR);
    case 123: ++tokPos; return finishToken(_braceL);
    case 125: ++tokPos; return finishToken(_braceR);
    case 58: ++tokPos; return finishToken(_colon);
    case 63: ++tokPos; return finishToken(_question);

      // '0x' is a hexadecimal number.
    case 48: // '0'
      var next = input.charCodeAt(tokPos + 1);
      if (next === 120 || next === 88) return readHexNumber();
      // Anything else beginning with a digit is an integer, octal
      // number, or float.
    case 49: case 50: case 51: case 52: case 53: case 54: case 55: case 56: case 57: // 1-9
      return readNumber(false);

      // Quotes produce strings.
    case 34: case 39: // '"', "'"
      return readString(code);

    // Operators are parsed inline in tiny state machines. '=' (61) is
    // often referred to. `finishOp` simply skips the amount of
    // characters it is given as second argument, and returns a token
    // of the type given by its first argument.

    case 47: // '/'
      return readToken_slash(code);

    case 37: case 42: // '%*'
      return readToken_mult_modulo();

    case 124: case 38: // '|&'
      return readToken_pipe_amp(code);

    case 94: // '^'
      return readToken_caret();

    case 43: case 45: // '+-'
      return readToken_plus_min(code);

    case 60: case 62: // '<>'
      return readToken_lt_gt(code);

    case 61: case 33: // '=!'
      return readToken_eq_excl(code);

    case 126: // '~'
      return finishOp(_prefix, 1);
    }

    return false;
  }

  function readToken(forceRegexp) {
    if (!forceRegexp) tokStart = tokPos;
    else tokPos = tokStart + 1;
    if (options.locations) tokStartLoc = new Position;
    if (forceRegexp) return readRegexp();
    if (tokPos >= inputLen) return finishToken(_eof);

    var code = input.charCodeAt(tokPos);
    // Identifier or keyword. '\uXXXX' sequences are allowed in
    // identifiers, so '\' also dispatches to that.
    if (isIdentifierStart(code) || code === 92 /* '\' */) return readWord();

    var tok = getTokenFromCode(code);

    if (tok === false) {
      // If we are here, we either found a non-ASCII identifier
      // character, or something that's entirely disallowed.
      var ch = String.fromCharCode(code);
      if (ch === "\\" || nonASCIIidentifierStart.test(ch)) return readWord();
      raise(tokPos, "Unexpected character '" + ch + "'");
    }
    return tok;
  }

  function finishOp(type, size) {
    var str = input.slice(tokPos, tokPos + size);
    tokPos += size;
    finishToken(type, str);
  }

  // Parse a regular expression. Some context-awareness is necessary,
  // since a '/' inside a '[]' set does not end the expression.

  function readRegexp() {
    var content = "", escaped, inClass, start = tokPos;
    for (;;) {
      if (tokPos >= inputLen) raise(start, "Unterminated regular expression");
      var ch = input.charAt(tokPos);
      if (newline.test(ch)) raise(start, "Unterminated regular expression");
      if (!escaped) {
        if (ch === "[") inClass = true;
        else if (ch === "]" && inClass) inClass = false;
        else if (ch === "/" && !inClass) break;
        escaped = ch === "\\";
      } else escaped = false;
      ++tokPos;
    }
    var content = input.slice(start, tokPos);
    ++tokPos;
    // Need to use `readWord1` because '\uXXXX' sequences are allowed
    // here (don't ask).
    var mods = readWord1();
    if (mods && !/^[gmsiy]*$/.test(mods)) raise(start, "Invalid regular expression flag");
    try {
      var value = new RegExp(content, mods);
    } catch (e) {
      if (e instanceof SyntaxError) raise(start, "Error parsing regular expression: " + e.message);
      raise(e);
    }
    return finishToken(_regexp, value);
  }

  // Read an integer in the given radix. Return null if zero digits
  // were read, the integer value otherwise. When `len` is given, this
  // will return `null` unless the integer has exactly `len` digits.

  function readInt(radix, len) {
    var start = tokPos, total = 0;
    for (var i = 0, e = len == null ? Infinity : len; i < e; ++i) {
      var code = input.charCodeAt(tokPos), val;
      if (code >= 97) val = code - 97 + 10; // a
      else if (code >= 65) val = code - 65 + 10; // A
      else if (code >= 48 && code <= 57) val = code - 48; // 0-9
      else val = Infinity;
      if (val >= radix) break;
      ++tokPos;
      total = total * radix + val;
    }
    if (tokPos === start || len != null && tokPos - start !== len) return null;

    return total;
  }

  function readHexNumber() {
    tokPos += 2; // 0x
    var val = readInt(16);
    if (val == null) raise(tokStart + 2, "Expected hexadecimal number");
    if (isIdentifierStart(input.charCodeAt(tokPos))) raise(tokPos, "Identifier directly after number");
    return finishToken(_num, val);
  }

  // Read an integer, octal integer, or floating-point number.

  function readNumber(startsWithDot) {
    var start = tokPos, isFloat = false, octal = input.charCodeAt(tokPos) === 48;
    if (!startsWithDot && readInt(10) === null) raise(start, "Invalid number");
    if (input.charCodeAt(tokPos) === 46) {
      ++tokPos;
      readInt(10);
      isFloat = true;
    }
    var next = input.charCodeAt(tokPos);
    if (next === 69 || next === 101) { // 'eE'
      next = input.charCodeAt(++tokPos);
      if (next === 43 || next === 45) ++tokPos; // '+-'
      if (readInt(10) === null) raise(start, "Invalid number");
      isFloat = true;
    }
    if (isIdentifierStart(input.charCodeAt(tokPos))) raise(tokPos, "Identifier directly after number");

    var str = input.slice(start, tokPos), val;
    if (isFloat) val = parseFloat(str);
    else if (!octal || str.length === 1) val = parseInt(str, 10);
    else if (/[89]/.test(str) || strict) raise(start, "Invalid number");
    else val = parseInt(str, 8);
    return finishToken(_num, val);
  }

  // Read a string value, interpreting backslash-escapes.

  function readString(quote) {
    tokPos++;
    var out = "";
    for (;;) {
      if (tokPos >= inputLen) raise(tokStart, "Unterminated string constant");
      var ch = input.charCodeAt(tokPos);
      if (ch === quote) {
        ++tokPos;
        return finishToken(_string, out);
      }
      if (ch === 92) { // '\'
        ch = input.charCodeAt(++tokPos);
        var octal = /^[0-7]+/.exec(input.slice(tokPos, tokPos + 3));
        if (octal) octal = octal[0];
        while (octal && parseInt(octal, 8) > 255) octal = octal.slice(0, -1);
        if (octal === "0") octal = null;
        ++tokPos;
        if (octal) {
          if (strict) raise(tokPos - 2, "Octal literal in strict mode");
          out += String.fromCharCode(parseInt(octal, 8));
          tokPos += octal.length - 1;
        } else {
          switch (ch) {
          case 110: out += "\n"; break; // 'n' -> '\n'
          case 114: out += "\r"; break; // 'r' -> '\r'
          case 120: out += String.fromCharCode(readHexChar(2)); break; // 'x'
          case 117: out += String.fromCharCode(readHexChar(4)); break; // 'u'
          case 85: out += String.fromCharCode(readHexChar(8)); break; // 'U'
          case 116: out += "\t"; break; // 't' -> '\t'
          case 98: out += "\b"; break; // 'b' -> '\b'
          case 118: out += "\u000b"; break; // 'v' -> '\u000b'
          case 102: out += "\f"; break; // 'f' -> '\f'
          case 48: out += "\0"; break; // 0 -> '\0'
          case 13: if (input.charCodeAt(tokPos) === 10) ++tokPos; // '\r\n'
          case 10: // ' \n'
            if (options.locations) { tokLineStart = tokPos; ++tokCurLine; }
            break;
          default: out += String.fromCharCode(ch); break;
          }
        }
      } else {
        if (ch === 13 || ch === 10 || ch === 8232 || ch === 8233) raise(tokStart, "Unterminated string constant");
        out += String.fromCharCode(ch); // '\'
        ++tokPos;
      }
    }
  }

  // Used to read character escape sequences ('\x', '\u', '\U').

  function readHexChar(len) {
    var n = readInt(16, len);
    if (n === null) raise(tokStart, "Bad character escape sequence");
    return n;
  }

  // Used to signal to callers of `readWord1` whether the word
  // contained any escape sequences. This is needed because words with
  // escape sequences must not be interpreted as keywords.

  var containsEsc;

  // Read an identifier, and return it as a string. Sets `containsEsc`
  // to whether the word contained a '\u' escape.
  //
  // Only builds up the word character-by-character when it actually
  // containeds an escape, as a micro-optimization.

  function readWord1() {
    containsEsc = false;
    var word, first = true, start = tokPos;
    for (;;) {
      var ch = input.charCodeAt(tokPos);
      if (isIdentifierChar(ch)) {
        if (containsEsc) word += input.charAt(tokPos);
        ++tokPos;
      } else if (ch === 92) { // "\"
        if (!containsEsc) word = input.slice(start, tokPos);
        containsEsc = true;
        if (input.charCodeAt(++tokPos) != 117) // "u"
          raise(tokPos, "Expecting Unicode escape sequence \\uXXXX");
        ++tokPos;
        var esc = readHexChar(4);
        var escStr = String.fromCharCode(esc);
        if (!escStr) raise(tokPos - 1, "Invalid Unicode escape");
        if (!(first ? isIdentifierStart(esc) : isIdentifierChar(esc)))
          raise(tokPos - 4, "Invalid Unicode escape");
        word += escStr;
      } else {
        break;
      }
      first = false;
    }
    return containsEsc ? word : input.slice(start, tokPos);
  }

  // Read an identifier or keyword token. Will check for reserved
  // words when necessary.

    function readWord() {
        var word = readWord1();
        var type = _name;
        if (!containsEsc) {
            if (isKeyword(word))
                type = keywordTypes[word];
            else if (options.jsm && isKeywordJsm(word))
                type = jsmKeywordTypes[word];
        }
        return finishToken(type, word);
    }

  // ## Parser

  // A recursive descent parser operates by defining functions for all
  // syntactic elements, and recursively calling those, each function
  // advancing the input stream and returning an AST node. Precedence
  // of constructs (for example, the fact that `!x[1]` means `!(x[1])`
  // instead of `(!x)[1]` is handled by the fact that the parser
  // function that parses unary prefix operators is called first, and
  // in turn calls the function that parses `[]` subscripts — that
  // way, it'll receive the node for `x[1]` already parsed, and wraps
  // *that* in the unary operator node.
  //
  // Acorn uses an [operator precedence parser][opp] to handle binary
  // operator precedence, because it is much more compact than using
  // the technique outlined above, which uses different, nesting
  // functions to specify precedence, for all of the ten binary
  // precedence levels that JavaScript defines.
  //
  // [opp]: http://en.wikipedia.org/wiki/Operator-precedence_parser

  // ### Parser utilities

  // Continue to the next token.

  function next() {
    lastStart = tokStart;
    lastEnd = tokEnd;
    lastEndLoc = tokEndLoc;
    readToken();
  }

  // Enter strict mode. Re-reads the next token to please pedantic
  // tests ("use strict"; 010; -- should fail).

  function setStrict(strct) {
    strict = strct;
    tokPos = tokStart;
    if (options.locations) {
      while (tokPos < tokLineStart) {
        tokLineStart = input.lastIndexOf("\n", tokLineStart - 2) + 1;
        --tokCurLine;
      }
    }
    skipSpace();
    readToken();
  }

  // Start an AST node, attaching a start offset.

  function Node() {
    this.type = null;
    this.start = tokStart;
    this.end = null;
  }
  
  exports.Node = Node;

  function SourceLocation() {
    this.start = tokStartLoc;
    this.end = null;
    if (sourceFile !== null) this.source = sourceFile;
  }

  function startNode() {
    var node = new Node();
    if (options.locations)
      node.loc = new SourceLocation();
    if (options.directSourceFile)
      node.sourceFile = options.directSourceFile;
    if (options.ranges)
      node.range = [tokStart, 0];
    return node;
  }

  // Start a node whose start offset information should be based on
  // the start of another node. For example, a binary operator node is
  // only started after its left-hand side has already been parsed.

  function startNodeFrom(other) {
    var node = new Node();
    node.start = other.start;
    if (options.locations) {
      node.loc = new SourceLocation();
      node.loc.start = other.loc.start;
    }
    if (options.ranges)
      node.range = [other.range[0], 0];

    return node;
  }

  // Finish an AST node, adding `type` and `end` properties.

  function finishNode(node, type) {
    node.type = type;
    node.end = lastEnd;
    if (options.locations)
      node.loc.end = lastEndLoc;
    if (options.ranges)
      node.range[1] = lastEnd;
    return node;
  }

  // Test whether a statement node is the string literal `"use strict"`.

  function isUseStrict(stmt) {
    return options.ecmaVersion >= 5 && stmt.type === "ExpressionStatement" &&
      stmt.expression.type === "Literal" && stmt.expression.value === "use strict";
  }

  // Predicate that tests whether the next token is of the given
  // type, and if yes, consumes it as a side effect.

  function eat(type) {
    if (tokType === type) {
      next();
      return true;
    }
  }

  // Test whether a semicolon can be inserted at the current position.

  function canInsertSemicolon() {
    return !options.strictSemicolons &&
      (tokType === _eof || tokType === _braceR || newline.test(input.slice(lastEnd, tokStart)));
  }

  // Consume a semicolon, or, failing that, see if we are allowed to
  // pretend that there is a semicolon at this position.

  function semicolon() {
    if (!eat(_semi) && !canInsertSemicolon()) unexpected();
  }

  // Expect a token of a given type. If found, consume it, otherwise,
  // raise an unexpected token error.

  function expect(type) {
    if (tokType === type) next();
    else unexpected();
  }

  // Raise an unexpected token error.

  function unexpected() {
    raise(tokStart, "Unexpected token");
  }

  // Verify that a node is an lval — something that can be assigned
  // to.

  function checkLVal(expr) {
    if (expr.type !== "Identifier" && expr.type !== "MemberExpression")
      raise(expr.start, "Assigning to rvalue");
    if (strict && expr.type === "Identifier" && isStrictBadIdWord(expr.name))
      raise(expr.start, "Assigning to " + expr.name + " in strict mode");
  }

  // ### Statement parsing

  // Parse a program. Initializes the parser, reads any number of
  // statements, and wraps them in a Program node.  Optionally takes a
  // `program` argument.  If present, the statements will be appended
  // to its body instead of creating a new node.

  function parseTopLevel(program) {
    lastStart = lastEnd = tokPos;
    if (options.locations) lastEndLoc = new Position;
    inFunction = strict = null;
    labels = [];
    readToken();

    var node = program || startNode(), first = true;
    if (!program) node.body = [];
    while (tokType !== _eof) {
      var stmt = parseStatement();
      node.body.push(stmt);
      if (first && isUseStrict(stmt)) setStrict(true);
      first = false;
    }
    return finishNode(node, "Program");
  }

  var loopLabel = {kind: "loop"}, switchLabel = {kind: "switch"};

  // Parse a single statement.
  //
  // If expecting a statement and finding a slash operator, parse a
  // regular expression literal. This is to handle cases like
  // `if (foo) /blah/.exec(foo);`, where looking at the previous token
  // does not help.

  function parseStatement() {
    if (tokType === _slash || tokType === _assign && tokVal == "/=")
      readToken(true);

    var starttype = tokType, node = startNode();

    // Most types of statements are recognized by the keyword they
    // start with. Many are trivial to parse, some require a bit of
    // complexity.

    switch (starttype) {
    case _break: case _continue:
      next();
      var isBreak = starttype === _break;
      if (eat(_semi) || canInsertSemicolon()) node.label = null;
      else if (tokType !== _name) unexpected();
      else {
        node.label = parseIdent();
        semicolon();
      }

      // Verify that there is an actual destination to break or
      // continue to.
      for (var i = 0; i < labels.length; ++i) {
        var lab = labels[i];
        if (node.label == null || lab.name === node.label.name) {
          if (lab.kind != null && (isBreak || lab.kind === "loop")) break;
          if (node.label && isBreak) break;
        }
      }
      if (i === labels.length) raise(node.start, "Unsyntactic " + starttype.keyword);
      return finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement");

    case _debugger:
      next();
      semicolon();
      return finishNode(node, "DebuggerStatement");

    case _do:
      next();
      labels.push(loopLabel);
      node.body = parseStatement();
      labels.pop();
      expect(_while);
      node.test = parseParenExpression();
      semicolon();
      return finishNode(node, "DoWhileStatement");

      // Disambiguating between a `for` and a `for`/`in` loop is
      // non-trivial. Basically, we have to parse the init `var`
      // statement or expression, disallowing the `in` operator (see
      // the second parameter to `parseExpression`), and then check
      // whether the next token is `in`. When there is no init part
      // (semicolon immediately after the opening parenthesis), it is
      // a regular `for` loop.

    case _for:
      next();
      labels.push(loopLabel);
      expect(_parenL);
      if (tokType === _semi) return parseFor(node, null);
      if (tokType === _var) {
        var init = startNode();
        next();
        parseVar(init, true);
        finishNode(init, "VariableDeclaration");
        if (init.declarations.length === 1 && eat(_in))
          return parseForIn(node, init);
        return parseFor(node, init);
      }
      var init = parseExpression(false, true);
      if (eat(_in)) {checkLVal(init); return parseForIn(node, init);}
      return parseFor(node, init);

    case _function:
      next();
      return parseFunction(node, true);

    case _if:
      next();
      node.test = parseParenExpression();
      node.consequent = parseStatement();
      node.alternate = eat(_else) ? parseStatement() : null;
      return finishNode(node, "IfStatement");

    case _jsm_inline:
        next();
        return parseJsmInline(node);

    case _jsm_metafun:
        next();
        return parseJsmMetafun(node, true);

    case _jsm_metaret:
      if (!jsmInMetafun  &&  !options.jsmAllowMetaretOutsideFunction)
        raise(tokStart, "'metaret' outside of metafun");
      next();

      // In `return` (and `break`/`continue`), the keywords with
      // optional arguments, we eagerly look for a semicolon or the
      // possibility to insert one.

      if (eat(_semi) || canInsertSemicolon()) node.argument = null;
      else { node.argument = parseExpression(); semicolon(); }
      return finishNode(node, "JsmMetaretStatement");


    case _return:
      if (!inFunction && !options.allowReturnOutsideFunction)
        raise(tokStart, "'return' outside of function");
      next();

      // In `return` (and `break`/`continue`), the keywords with
      // optional arguments, we eagerly look for a semicolon or the
      // possibility to insert one.

      if (eat(_semi) || canInsertSemicolon()) node.argument = null;
      else { node.argument = parseExpression(); semicolon(); }
      return finishNode(node, "ReturnStatement");

    case _switch:
      next();
      node.discriminant = parseParenExpression();
      node.cases = [];
      expect(_braceL);
      labels.push(switchLabel);

      // Statements under must be grouped (by label) in SwitchCase
      // nodes. `cur` is used to keep the node that we are currently
      // adding statements to.

      for (var cur, sawDefault; tokType != _braceR;) {
        if (tokType === _case || tokType === _default) {
          var isCase = tokType === _case;
          if (cur) finishNode(cur, "SwitchCase");
          node.cases.push(cur = startNode());
          cur.consequent = [];
          next();
          if (isCase) cur.test = parseExpression();
          else {
            if (sawDefault) raise(lastStart, "Multiple default clauses"); sawDefault = true;
            cur.test = null;
          }
          expect(_colon);
        } else {
          if (!cur) unexpected();
          cur.consequent.push(parseStatement());
        }
      }
      if (cur) finishNode(cur, "SwitchCase");
      next(); // Closing brace
      labels.pop();
      return finishNode(node, "SwitchStatement");

    case _throw:
      next();
      if (newline.test(input.slice(lastEnd, tokStart)))
        raise(lastEnd, "Illegal newline after throw");
      node.argument = parseExpression();
      semicolon();
      return finishNode(node, "ThrowStatement");

    case _try:
      next();
      node.block = parseBlock();
      node.handler = null;
      if (tokType === _catch) {
        var clause = startNode();
        next();
        expect(_parenL);
        clause.param = parseIdent();
        if (strict && isStrictBadIdWord(clause.param.name))
          raise(clause.param.start, "Binding " + clause.param.name + " in strict mode");
        expect(_parenR);
        clause.guard = null;
        clause.body = parseBlock();
        node.handler = finishNode(clause, "CatchClause");
      }
      node.guardedHandlers = empty;
      node.finalizer = eat(_finally) ? parseBlock() : null;
      if (!node.handler && !node.finalizer)
        raise(node.start, "Missing catch or finally clause");
      return finishNode(node, "TryStatement");

    case _var:
      next();
      parseVar(node);
      semicolon();
      return finishNode(node, "VariableDeclaration");

    case _while:
      next();
      node.test = parseParenExpression();
      labels.push(loopLabel);
      node.body = parseStatement();
      labels.pop();
      return finishNode(node, "WhileStatement");

    case _with:
      if (strict) raise(tokStart, "'with' in strict mode");
      next();
      node.object = parseParenExpression();
      node.body = parseStatement();
      return finishNode(node, "WithStatement");

    case _braceL:
      return parseBlock();

    case _semi:
      next();
      return finishNode(node, "EmptyStatement");

      // If the statement does not start with a statement keyword or a
      // brace, it's an ExpressionStatement or LabeledStatement. We
      // simply start parsing an expression, and afterwards, if the
      // next token is a colon and the expression was a simple
      // Identifier node, we switch to interpreting it as a label.

    default:
      var maybeName = tokVal, expr = parseExpression();
      if (starttype === _name && expr.type === "Identifier" && eat(_colon)) {
        for (var i = 0; i < labels.length; ++i)
          if (labels[i].name === maybeName) raise(expr.start, "Label '" + maybeName + "' is already declared");
        var kind = tokType.isLoop ? "loop" : tokType === _switch ? "switch" : null;
        labels.push({name: maybeName, kind: kind});
        node.body = parseStatement();
        labels.pop();
        node.label = expr;
        return finishNode(node, "LabeledStatement");
      } else {
        node.expression = expr;
        semicolon();
        return finishNode(node, "ExpressionStatement");
      }
    }
  }

  // Used for constructs like `switch` and `if` that insist on
  // parentheses around their expression.

  function parseParenExpression() {
    expect(_parenL);
    var val = parseExpression();
    expect(_parenR);
    return val;
  }

  // Parse a semicolon-enclosed block of statements, handling `"use
  // strict"` declarations when `allowStrict` is true (used for
  // function bodies).

  function parseBlock(allowStrict) {
    var node = startNode(), first = true, strict = false, oldStrict;
    node.body = [];
    expect(_braceL);
    while (!eat(_braceR)) {
      var stmt = parseStatement();
      node.body.push(stmt);
      if (first && allowStrict && isUseStrict(stmt)) {
        oldStrict = strict;
        setStrict(strict = true);
      }
      first = false;
    }
    if (strict && !oldStrict) setStrict(false);
    return finishNode(node, "BlockStatement");
  }

  // Parse a regular `for` loop. The disambiguation code in
  // `parseStatement` will already have parsed the init statement or
  // expression.

  function parseFor(node, init) {
    node.init = init;
    expect(_semi);
    node.test = tokType === _semi ? null : parseExpression();
    expect(_semi);
    node.update = tokType === _parenR ? null : parseExpression();
    expect(_parenR);
    node.body = parseStatement();
    labels.pop();
    return finishNode(node, "ForStatement");
  }

  // Parse a `for`/`in` loop.

  function parseForIn(node, init) {
    node.left = init;
    node.right = parseExpression();
    expect(_parenR);
    node.body = parseStatement();
    labels.pop();
    return finishNode(node, "ForInStatement");
  }

    // JSM extension: inline var x = f();  or  inline f();  or  inline x = f();

    function parseJsmInline( node )
    {
        if (tokType === _var)
        {
            var varDecl = parseStatement();
            
            if (varDecl.type !== "VariableDeclaration")  
                throw new Error("parseJsmInline: incorrect variable declaration.");

            if (varDecl.declarations.length !== 1)  
                throw new Error("parseJsmInline: VariableDeclaration: only a single variable declaration!");

            var d = varDecl.declarations[ 0 ];
            node.jsmVarDeclId   = d.id;
            node.jsmVarDeclInit = d.init;

            if (node.jsmVarDeclInit.type !== "CallExpression")
                throw new Error("parseJsmInline: VariableDeclaration: only the form 'inline var x = f(); is permitted.");
        }
        else
        {
            var stmt = parseStatement();
            if (stmt.type !== "ExpressionStatement")   
                throw new Error("parseJsmInline: ExpressionStatement: either var or expression stmt.");
            var expr = stmt.expression
            ,   expr_type = expr.type
            ;
            if (expr_type !== "AssignmentExpression"  &&  expr_type !== "CallExpression")
                throw new Error("parseJsmInline: ExpressionStatement: either AssignmentExpression or CallExpression!");

            if (expr_type === "AssignmentExpression")
            {
                if (expr.left.type !== "Identifier"  ||  expr.right.type !== "CallExpression")
                    throw new Error("parseJsmInline: ExpressionStatement: only the form 'inline x = f(); is permitted.");

                node.jsmAssignLeft  = expr.left;
                node.jsmAssignRight = expr.right;
            }
            else
            {
                node.jsmCall = expr;
            }
        }
        
        return finishNode(node, "JsmInlineStatement");
    }
    

  // Parse a list of variable declarations.

  function parseVar(node, noIn) {
    node.declarations = [];
    node.kind = "var";
    for (;;) {
      var decl = startNode();
      decl.id = parseIdent();
      if (strict && isStrictBadIdWord(decl.id.name))
        raise(decl.id.start, "Binding " + decl.id.name + " in strict mode");
      decl.init = eat(_eq) ? parseExpression(true, noIn) : null;
      node.declarations.push(finishNode(decl, "VariableDeclarator"));
      if (!eat(_comma)) break;
    }
    return node;
  }

  // ### Expression parsing

  // These nest, from the most general expression type at the top to
  // 'atomic', nondivisible expression types at the bottom. Most of
  // the functions will simply let the function(s) below them parse,
  // and, *if* the syntactic construct they handle is present, wrap
  // the AST node that the inner parser gave them in another node.

  // Parse a full expression. The arguments are used to forbid comma
  // sequences (in argument lists, array literals, or object literals)
  // or the `in` operator (in for loops initalization expressions).

  function parseExpression(noComma, noIn) {
    var expr = parseMaybeAssign(noIn);
    if (!noComma && tokType === _comma) {
      var node = startNodeFrom(expr);
      node.expressions = [expr];
      while (eat(_comma)) node.expressions.push(parseMaybeAssign(noIn));
      return finishNode(node, "SequenceExpression");
    }
    return expr;
  }

  // Parse an assignment expression. This includes applications of
  // operators like `+=`.

  function parseMaybeAssign(noIn) {
    var left = parseMaybeConditional(noIn);
    if (tokType.isAssign) {
      var node = startNodeFrom(left);
      node.operator = tokVal;
      node.left = left;
      next();
      node.right = parseMaybeAssign(noIn);
      checkLVal(left);
      return finishNode(node, "AssignmentExpression");
    }
    return left;
  }

  // Parse a ternary conditional (`?:`) operator.

  function parseMaybeConditional(noIn) {
    var expr = parseExprOps(noIn);
    if (eat(_question)) {
      var node = startNodeFrom(expr);
      node.test = expr;
      node.consequent = parseExpression(true);
      expect(_colon);
      node.alternate = parseExpression(true, noIn);
      return finishNode(node, "ConditionalExpression");
    }
    return expr;
  }

  // Start the precedence parser.

  function parseExprOps(noIn) {
    return parseExprOp(parseMaybeUnary(), -1, noIn);
  }

  // Parse binary operators with the operator precedence parsing
  // algorithm. `left` is the left-hand side of the operator.
  // `minPrec` provides context that allows the function to stop and
  // defer further parser to one of its callers when it encounters an
  // operator that has a lower precedence than the set it is parsing.

  function parseExprOp(left, minPrec, noIn) {
    var prec = tokType.binop;
    if (prec != null && (!noIn || tokType !== _in)) {
      if (prec > minPrec) {
        var node = startNodeFrom(left);
        node.left = left;
        node.operator = tokVal;
        var op = tokType;
        next();
        node.right = parseExprOp(parseMaybeUnary(), prec, noIn);
        var exprNode = finishNode(node, (op === _logicalOR || op === _logicalAND) ? "LogicalExpression" : "BinaryExpression");
        return parseExprOp(exprNode, minPrec, noIn);
      }
    }
    return left;
  }

  // Parse unary operators, both prefix and postfix.

  function parseMaybeUnary() {
    if (tokType.prefix) {
      var node = startNode(), update = tokType.isUpdate;
      node.operator = tokVal;
      node.prefix = true;
      tokRegexpAllowed = true;
      next();
      node.argument = parseMaybeUnary();
      if (update) checkLVal(node.argument);
      else if (strict && node.operator === "delete" &&
               node.argument.type === "Identifier")
        raise(node.start, "Deleting local variable in strict mode");
      return finishNode(node, update ? "UpdateExpression" : "UnaryExpression");
    }
    var expr = parseExprSubscripts();
    while (tokType.postfix && !canInsertSemicolon()) {
      var node = startNodeFrom(expr);
      node.operator = tokVal;
      node.prefix = false;
      node.argument = expr;
      checkLVal(expr);
      next();
      expr = finishNode(node, "UpdateExpression");
    }
    return expr;
  }

  // Parse call, dot, and `[]`-subscript expressions.

  function parseExprSubscripts() {
    return parseSubscripts(parseExprAtom());
  }

  function parseSubscripts(base, noCalls) {
    if (eat(_dot)) {
      var node = startNodeFrom(base);
      node.object = base;
      node.property = parseIdent(true);
      node.computed = false;
      return parseSubscripts(finishNode(node, "MemberExpression"), noCalls);
    } else if (eat(_bracketL)) {
      var node = startNodeFrom(base);
      node.object = base;
      node.property = parseExpression();
      node.computed = true;
      expect(_bracketR);
      return parseSubscripts(finishNode(node, "MemberExpression"), noCalls);
    } else if (!noCalls && eat(_parenL)) {
      var node = startNodeFrom(base);
      node.callee = base;
      node.arguments = parseExprList(_parenR, false);
      return parseSubscripts(finishNode(node, "CallExpression"), noCalls);
    } else return base;
  }

  // Parse an atomic expression — either a single token that is an
  // expression, an expression started by a keyword like `function` or
  // `new`, or an expression wrapped in punctuation like `()`, `[]`,
  // or `{}`.

  function parseExprAtom() {
    switch (tokType) {
    case _this:
      var node = startNode();
      next();
      return finishNode(node, "ThisExpression");
    case _name:
      return parseIdent();
    case _num: case _string: case _regexp:
      var node = startNode();
      node.value = tokVal;
      node.raw = input.slice(tokStart, tokEnd);
      next();
      return finishNode(node, "Literal");

    case _null: case _true: case _false:
      var node = startNode();
      node.value = tokType.atomValue;
      node.raw = tokType.keyword;
      next();
      return finishNode(node, "Literal");

    case _parenL:
      var tokStartLoc1 = tokStartLoc, tokStart1 = tokStart;
      next();
      var val = parseExpression();
      val.start = tokStart1;
      val.end = tokEnd;
      if (options.locations) {
        val.loc.start = tokStartLoc1;
        val.loc.end = tokEndLoc;
      }
      if (options.ranges)
        val.range = [tokStart1, tokEnd];
      expect(_parenR);
      return val;

    case _bracketL:
      var node = startNode();
      next();
      node.elements = parseExprList(_bracketR, true, true);
      return finishNode(node, "ArrayExpression");

    case _braceL:
      return parseObj();

    case _function:
      var node = startNode();
      next();
      return parseFunction(node, false);

    case _new:
      return parseNew();

    default:
      unexpected();
    }
  }

  // New's precedence is slightly tricky. It must allow its argument
  // to be a `[]` or dot subscript expression, but not a call — at
  // least, not without wrapping it in parentheses. Thus, it uses the

  function parseNew() {
    var node = startNode();
    next();
    node.callee = parseSubscripts(parseExprAtom(), true);
    if (eat(_parenL)) node.arguments = parseExprList(_parenR, false);
    else node.arguments = empty;
    return finishNode(node, "NewExpression");
  }

  // Parse an object literal.

  function parseObj() {
    var node = startNode(), first = true, sawGetSet = false;
    node.properties = [];
    next();
    while (!eat(_braceR)) {
      if (!first) {
        expect(_comma);
        if (options.allowTrailingCommas && eat(_braceR)) break;
      } else first = false;

      var prop = {key: parsePropertyName()}, isGetSet = false, kind;
      if (eat(_colon)) {
        prop.value = parseExpression(true);
        kind = prop.kind = "init";
      } else if (options.ecmaVersion >= 5 && prop.key.type === "Identifier" &&
                 (prop.key.name === "get" || prop.key.name === "set")) {
        isGetSet = sawGetSet = true;
        kind = prop.kind = prop.key.name;
        prop.key = parsePropertyName();
        if (tokType !== _parenL) unexpected();
        prop.value = parseFunction(startNode(), false);
      } else unexpected();

      // getters and setters are not allowed to clash — either with
      // each other or with an init property — and in strict mode,
      // init properties are also not allowed to be repeated.

      if (prop.key.type === "Identifier" && (strict || sawGetSet)) {
        for (var i = 0; i < node.properties.length; ++i) {
          var other = node.properties[i];
          if (other.key.name === prop.key.name) {
            var conflict = kind == other.kind || isGetSet && other.kind === "init" ||
              kind === "init" && (other.kind === "get" || other.kind === "set");
            if (conflict && !strict && kind === "init" && other.kind === "init") conflict = false;
            if (conflict) raise(prop.key.start, "Redefinition of property");
          }
        }
      }
      node.properties.push(prop);
    }
    return finishNode(node, "ObjectExpression");
  }

  function parsePropertyName() {
    if (tokType === _num || tokType === _string) return parseExprAtom();
    return parseIdent(true);
  }

    // JSM extension: parse a metafunction
    function parseJsmMetafun(node, isStatement)
    {
        if (!isStatement)
            throw new Error( 'metafunction can only be declarations, not expressions.' );

        var isJsmMetafunction = true;
        return parseFunction(node, isStatement, isJsmMetafunction);
    }

  // Parse a function declaration or literal (depending on the
  // `isStatement` parameter).

    function parseFunction(node, isStatement, isJsmMetafunction) {
        if (!isJsmMetafunction) {
            if (tokType === _name) node.id = parseIdent();
            else if (isStatement) unexpected();
            else node.id = null;
        }
        else {
            // JSM extension: `metafun <identifier or dotted identifier>(...){...}`
            if (tokType !== _name) unexpected();
            node.id = parseJsmIdentifierOrDottedIdentifer();
        }
    node.params = [];
    var first = true;
    expect(_parenL);
    while (!eat(_parenR)) {
      if (!first) expect(_comma); else first = false;
      node.params.push(parseIdent());
    }

    // Start a new scope with regard to labels and the `inFunction`
    // flag (restore them to their old value afterwards).
        var oldInFunc = inFunction, oldLabels = labels, oldJsmInMetafun = jsmInMetafun;
        inFunction = true; labels = []; jsmInMetafun = isJsmMetafunction;
        node.body = parseBlock(true);
        inFunction = oldInFunc; labels = oldLabels; jsmInMetafun = oldJsmInMetafun;

    // If this is a strict mode function, verify that argument names
    // are not repeated, and it does not try to bind the words `eval`
    // or `arguments`.
    if (strict || node.body.body.length && isUseStrict(node.body.body[0])) {
      for (var i = node.id ? -1 : 0; i < node.params.length; ++i) {
        var id = i < 0 ? node.id : node.params[i];
        if (isStrictReservedWord(id.name) || isStrictBadIdWord(id.name))
          raise(id.start, "Defining '" + id.name + "' in strict mode");
        if (i >= 0) for (var j = 0; j < i; ++j) if (id.name === node.params[j].name)
          raise(id.start, "Argument name clash in strict mode");
      }
    }

        return finishNode(node, (isJsmMetafunction ? 'JsmMetafun' : 'Function') + 
                          (isStatement ? "Declaration" : "Expression"));
  }

  // Parses a comma-separated list of expressions, and returns them as
  // an array. `close` is the token type that ends the list, and
  // `allowEmpty` can be turned on to allow subsequent commas with
  // nothing in between them to be parsed as `null` (which is needed
  // for array literals).

  function parseExprList(close, allowTrailingComma, allowEmpty) {
    var elts = [], first = true;
    while (!eat(close)) {
      if (!first) {
        expect(_comma);
        if (allowTrailingComma && options.allowTrailingCommas && eat(close)) break;
      } else first = false;

      if (allowEmpty && tokType === _comma) elts.push(null);
      else elts.push(parseExpression(true));
    }
    return elts;
  }

    // JSM extension: metafunctions support both identifiers and dotted identifiers

    function parseJsmIdentifierOrDottedIdentifer(liberal)
    {
        return parseIdent(liberal,/*jsmDotted:*/true);
    }

  // Parse the next token as an identifier. If `liberal` is true (used
  // when parsing properties), it will also convert keywords into
  // identifiers.

    function parseIdent(liberal, jsmDotted) {
    var node = startNode();
    if (liberal && options.forbidReserved == "everywhere") liberal = false;
    if (tokType === _name) {
      if (!liberal &&
          (options.forbidReserved &&
           (options.ecmaVersion === 3 ? isReservedWord3 : isReservedWord5)(tokVal) ||
           strict && isStrictReservedWord(tokVal)) &&
          input.slice(tokStart, tokEnd).indexOf("\\") == -1)
        raise(tokStart, "The keyword '" + tokVal + "' is reserved");
      node.name = tokVal;
    } else if (liberal && tokType.keyword) {
      node.name = tokType.keyword;
    } else {
        unexpected();
    }
    tokRegexpAllowed = false;
    next();

	
	if (jsmDotted  &&  eat( _dot ))
        {
            // JSM extension: dotted names allowed for metafunctions
	    
            var jsmNameArr = [ node.name ];
            var jsmRest    = parseIdent( liberal, jsmDotted );
            jsmNameArr.push.apply( jsmNameArr, jsmRest.jsmNameArr  ||  [ jsmRest.name ] );
            
            node.jsmNameArr = jsmNameArr;
            node.name       = jsmNameArr.join( '.' );
            return finishNode(node, "JsmDottedIdentifier");
        }
        

    return finishNode(node, "Identifier");
  }


});

}

//#BUILD_END_FILE: "acorn.25.03.2014/acorn.js"



if (typeof acorn.walk === 'undefined')
    
//#BUILD_BEGIN_FILE: "acorn.25.03.2014/util/walk.js"


{
// AST walker module for Mozilla Parser API compatible trees

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") return mod(exports); // CommonJS
  if (typeof define == "function" && define.amd) return define(["exports"], mod); // AMD
  mod((this.acorn || (this.acorn = {})).walk = {}); // Plain browser env
})(function(exports) {
  "use strict";

  // A simple walk is one where you simply specify callbacks to be
  // called on specific nodes. The last two arguments are optional. A
  // simple use would be
  //
  //     walk.simple(myTree, {
  //         Expression: function(node) { ... }
  //     });
  //
  // to do something with all expressions. All Parser API node types
  // can be used to identify node types, as well as Expression,
  // Statement, and ScopeBody, which denote categories of nodes.
  //
  // The base argument can be used to pass a custom (recursive)
  // walker, and state can be used to give this walked an initial
  // state.
  exports.simple = function(node, visitors, base, state) {
    if (!base) base = exports.base;
    function c(node, st, override) {
      var type = override || node.type, found = visitors[type];
      base[type](node, st, c);
      if (found) found(node, st);
    }
    c(node, state);
  };

  // An ancestor walk builds up an array of ancestor nodes (including
  // the current node) and passes them to the callback as the state parameter.
  exports.ancestor = function(node, visitors, base, state) {
    if (!base) base = exports.base;
    if (!state) state = [];
    function c(node, st, override) {
      var type = override || node.type, found = visitors[type];
      if (node != st[st.length - 1]) {
        st = st.slice();
        st.push(node);
      }
      base[type](node, st, c);
      if (found) found(node, st);
    }
    c(node, state);
  };

  // A recursive walk is one where your functions override the default
  // walkers. They can modify and replace the state parameter that's
  // threaded through the walk, and can opt how and whether to walk
  // their child nodes (by calling their third argument on these
  // nodes).
  exports.recursive = function(node, state, funcs, base) {
    var visitor = funcs ? exports.make(funcs, base) : base;
    function c(node, st, override) {
      visitor[override || node.type](node, st, c);
    }
    c(node, state);
  };

  function makeTest(test) {
    if (typeof test == "string")
      return function(type) { return type == test; };
    else if (!test)
      return function() { return true; };
    else
      return test;
  }

  function Found(node, state) { this.node = node; this.state = state; }

  // Find a node with a given start, end, and type (all are optional,
  // null can be used as wildcard). Returns a {node, state} object, or
  // undefined when it doesn't find a matching node.
  exports.findNodeAt = function(node, start, end, test, base, state) {
    test = makeTest(test);
    try {
      if (!base) base = exports.base;
      var c = function(node, st, override) {
        var type = override || node.type;
        if ((start == null || node.start <= start) &&
            (end == null || node.end >= end))
          base[type](node, st, c);
        if (test(type, node) &&
            (start == null || node.start == start) &&
            (end == null || node.end == end))
          throw new Found(node, st);
      };
      c(node, state);
    } catch (e) {
      if (e instanceof Found) return e;
      throw e;
    }
  };

  // Find the innermost node of a given type that contains the given
  // position. Interface similar to findNodeAt.
  exports.findNodeAround = function(node, pos, test, base, state) {
    test = makeTest(test);
    try {
      if (!base) base = exports.base;
      var c = function(node, st, override) {
        var type = override || node.type;
        if (node.start > pos || node.end < pos) return;
        base[type](node, st, c);
        if (test(type, node)) throw new Found(node, st);
      };
      c(node, state);
    } catch (e) {
      if (e instanceof Found) return e;
      throw e;
    }
  };

  // Find the outermost matching node after a given position.
  exports.findNodeAfter = function(node, pos, test, base, state) {
    test = makeTest(test);
    try {
      if (!base) base = exports.base;
      var c = function(node, st, override) {
        if (node.end < pos) return;
        var type = override || node.type;
        if (node.start >= pos && test(type, node)) throw new Found(node, st);
        base[type](node, st, c);
      };
      c(node, state);
    } catch (e) {
      if (e instanceof Found) return e;
      throw e;
    }
  };

  // Find the outermost matching node before a given position.
  exports.findNodeBefore = function(node, pos, test, base, state) {
    test = makeTest(test);
    if (!base) base = exports.base;
    var max;
    var c = function(node, st, override) {
      if (node.start > pos) return;
      var type = override || node.type;
      if (node.end <= pos && (!max || max.node.end < node.end) && test(type, node))
        max = new Found(node, st);
      base[type](node, st, c);
    };
    c(node, state);
    return max;
  };

  // Used to create a custom walker. Will fill in all missing node
  // type properties with the defaults.
  exports.make = function(funcs, base) {
    if (!base) base = exports.base;
    var visitor = {};
    for (var type in base) visitor[type] = base[type];
    for (var type in funcs) visitor[type] = funcs[type];
    return visitor;
  };

  function skipThrough(node, st, c) { c(node, st); }
  function ignore(_node, _st, _c) {}

  // Node walkers.

  var base = exports.base = {};
  base.Program = base.BlockStatement = function(node, st, c) {
    for (var i = 0; i < node.body.length; ++i)
      c(node.body[i], st, "Statement");
  };
  base.Statement = skipThrough;
  base.EmptyStatement = ignore;
  base.ExpressionStatement = function(node, st, c) {
    c(node.expression, st, "Expression");
  };
  base.IfStatement = function(node, st, c) {
    c(node.test, st, "Expression");
    c(node.consequent, st, "Statement");
    if (node.alternate) c(node.alternate, st, "Statement");
  };
  base.LabeledStatement = function(node, st, c) {
    c(node.body, st, "Statement");
  };
  base.BreakStatement = base.ContinueStatement = ignore;
  base.WithStatement = function(node, st, c) {
    c(node.object, st, "Expression");
    c(node.body, st, "Statement");
  };
  base.SwitchStatement = function(node, st, c) {
    c(node.discriminant, st, "Expression");
    for (var i = 0; i < node.cases.length; ++i) {
      var cs = node.cases[i];
      if (cs.test) c(cs.test, st, "Expression");
      for (var j = 0; j < cs.consequent.length; ++j)
        c(cs.consequent[j], st, "Statement");
    }
  };
  base.ReturnStatement = function(node, st, c) {
    if (node.argument) c(node.argument, st, "Expression");
  };
  base.ThrowStatement = function(node, st, c) {
    c(node.argument, st, "Expression");
  };
  base.TryStatement = function(node, st, c) {
    c(node.block, st, "Statement");
    if (node.handler) c(node.handler.body, st, "ScopeBody");
    if (node.finalizer) c(node.finalizer, st, "Statement");
  };
  base.WhileStatement = function(node, st, c) {
    c(node.test, st, "Expression");
    c(node.body, st, "Statement");
  };
  base.DoWhileStatement = base.WhileStatement;
  base.ForStatement = function(node, st, c) {
    if (node.init) c(node.init, st, "ForInit");
    if (node.test) c(node.test, st, "Expression");
    if (node.update) c(node.update, st, "Expression");
    c(node.body, st, "Statement");
  };
  base.ForInStatement = function(node, st, c) {
    c(node.left, st, "ForInit");
    c(node.right, st, "Expression");
    c(node.body, st, "Statement");
  };
  base.ForInit = function(node, st, c) {
    if (node.type == "VariableDeclaration") c(node, st);
    else c(node, st, "Expression");
  };
  base.DebuggerStatement = ignore;

  base.FunctionDeclaration = function(node, st, c) {
    c(node, st, "Function");
  };
  base.VariableDeclaration = function(node, st, c) {
    for (var i = 0; i < node.declarations.length; ++i) {
      var decl = node.declarations[i];
      if (decl.init) c(decl.init, st, "Expression");
    }
  };

  base.Function = function(node, st, c) {
    c(node.body, st, "ScopeBody");
  };
  base.ScopeBody = function(node, st, c) {
    c(node, st, "Statement");
  };

  base.Expression = skipThrough;
  base.ThisExpression = ignore;
  base.ArrayExpression = function(node, st, c) {
    for (var i = 0; i < node.elements.length; ++i) {
      var elt = node.elements[i];
      if (elt) c(elt, st, "Expression");
    }
  };
  base.ObjectExpression = function(node, st, c) {
    for (var i = 0; i < node.properties.length; ++i)
      c(node.properties[i].value, st, "Expression");
  };
  base.FunctionExpression = base.FunctionDeclaration;
  base.SequenceExpression = function(node, st, c) {
    for (var i = 0; i < node.expressions.length; ++i)
      c(node.expressions[i], st, "Expression");
  };
  base.UnaryExpression = base.UpdateExpression = function(node, st, c) {
    c(node.argument, st, "Expression");
  };
  base.BinaryExpression = base.AssignmentExpression = base.LogicalExpression = function(node, st, c) {
    c(node.left, st, "Expression");
    c(node.right, st, "Expression");
  };
  base.ConditionalExpression = function(node, st, c) {
    c(node.test, st, "Expression");
    c(node.consequent, st, "Expression");
    c(node.alternate, st, "Expression");
  };
  base.NewExpression = base.CallExpression = function(node, st, c) {
    c(node.callee, st, "Expression");
    if (node.arguments) for (var i = 0; i < node.arguments.length; ++i)
      c(node.arguments[i], st, "Expression");
  };
  base.MemberExpression = function(node, st, c) {
    c(node.object, st, "Expression");
    if (node.computed) c(node.property, st, "Expression");
  };
  base.Identifier = base.Literal = ignore;

    // ---BEGIN: JSM extension (see also ../acorn.js)
  base.JsmMetafunDeclaration = function(node, st, c) {
    c(node, st, "Function");
  };
  base.JsmFunctionDeclaration = function(node, st, c) {
    c(node, st, "Function");
  };
  base.JsmMetaretStatement = function(node, st, c) {
    c(node.argument, st, "Expression");
  };
  base.JsmInlineStatement = function(node, st, c) {
      if (node.jsmVarDeclId)
      {
          c(node.jsmVarDeclId, st);
          c(node.jsmVarDeclInit, st);
      }
      else if (node.jsmAssignLeft)
      {
          c(node.jsmAssignLeft, st);
          c(node.jsmAssignRight, st);
      }
      else
      {
          c(node.jsmCall, st);
      }     
  };
    // ---END: JSM extension (see also ../acorn.js)


  // A custom walker that keeps track of the scope chain and the
  // variables defined in it.
  function makeScope(prev, isCatch) {
    return {vars: Object.create(null), prev: prev, isCatch: isCatch};
  }
  function normalScope(scope) {
    while (scope.isCatch) scope = scope.prev;
    return scope;
  }
  exports.scopeVisitor = exports.make({
    Function: function(node, scope, c) {
      var inner = makeScope(scope);
      for (var i = 0; i < node.params.length; ++i)
        inner.vars[node.params[i].name] = {type: "argument", node: node.params[i]};
      if (node.id) {
        var decl = node.type == "FunctionDeclaration";
        (decl ? normalScope(scope) : inner).vars[node.id.name] =
          {type: decl ? "function" : "function name", node: node.id};
      }
      c(node.body, inner, "ScopeBody");
    },
    TryStatement: function(node, scope, c) {
      c(node.block, scope, "Statement");
      if (node.handler) {
        var inner = makeScope(scope, true);
        inner.vars[node.handler.param.name] = {type: "catch clause", node: node.handler.param};
        c(node.handler.body, inner, "ScopeBody");
      }
      if (node.finalizer) c(node.finalizer, scope, "Statement");
    },
    VariableDeclaration: function(node, scope, c) {
      var target = normalScope(scope);
      for (var i = 0; i < node.declarations.length; ++i) {
        var decl = node.declarations[i];
        target.vars[decl.id.name] = {type: "var", node: decl.id};
        if (decl.init) c(decl.init, scope, "Expression");
      }
    }
  });

});

}

//#BUILD_END_FILE: "acorn.25.03.2014/util/walk.js"




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

             , functionDeclarationArr : []
             , functionExpressionArr : []

             /*dc*/// JSM extensions
             , jsmMetafunArr  : []
             , jsmMetaretArr  : []
             , jsmInlineArr   : []

             /*dc*/// Raw result of acorn.parse
             , rawAP : null

         }/*}1*/


         /*dc*/// Detect comments, and produce a "nakedCode"
         /*dc*/// string where they've all been replaced with spaces.
         , /*vd*/nakedCode/**/ = code
         ;



	 var /*vd*/cA/**/ = ret.commentArr
         ,   /*vd*/ap/**/ = ret.rawAP = acorn.parse( code, /*{1.0*/{ jsm : true
                                                                     , onComment : pushComment
                                                                     , jsmAllowMetaretOutsideFunction : opt  &&  opt.jsmAllowMetaretOutsideFunction
                                                                     , allowReturnOutsideFunction     : opt  &&  opt.allowReturnOutsideFunction
                                                                   }/*}1.0*/ )
         ;

         function pushComment( b, t, start, end  )
         /*{1.1*/{
             cA.push( /*{1.1.1*/{ begin : start, str : code.substring( start, end ) }/*}1.1.1*/ );
             nakedCode = nakedCode.substring( 0, start ) + str_repli( /*sq*/' '/**/, end - start ) + nakedCode.substring( end );
         }/*}1.1*/


         /*dc*/// Walk the tree and extract what we need for metaret.js and inline.js
         
         var /*vd*/tmp/**/
         ,   /*vd*/caA/**/       = ret.callArr
         ,   /*vd*/dA/**/        = ret.dotArr
         ,   /*vd*/dcaA/**/      = ret.dotcallArr
         ,    /*vd*/iA/**/ = ret.identifierArr
         ,   /*vd*/rxA/**/ = ret.regexpArr
         ,    /*vd*/sA/**/ = ret.strArr

         ,   /*vd*/fdA/**/  = ret.functionDeclarationArr
         ,   /*vd*/feA/**/  = ret.functionExpressionArr

         ,   /*vd*/jMFA/**/ = ret.jsmMetafunArr
         ,   /*vd*/jMRA/**/ = ret.jsmMetaretArr
         ,   /*vd*/jINA/**/ = ret.jsmInlineArr
         
         /*dc*/// Detect strings and RegExps, and produce a "nakedCodeNoStrNoRx"
         /*dc*/// string where they've all been replaced with spaces.
         , /*vd*/nakedCodeNoStrNoRx/**/ = nakedCode
         ;

         acorn.walk.simple( ap, /*{1.2*/{
             CallExpression          : meet_CallExpression
             , FunctionDeclaration   : meet_FunctionDeclaration
             , FunctionExpression    : meet_FunctionExpression
             , Identifier            : meet_Identifier
             , JsmInlineStatement    : meet_JsmInlineStatement
             , JsmMetafunDeclaration : meet_JsmMetafunDeclaration
             , JsmMetafunExpression  : meet_JsmMetafunExpression
             , Literal               : meet_Literal
             , MemberExpression      : meet_MemberExpression
             , NewExpression         : meet_CallExpression
             , ObjectExpression      : meet_ObjectExpression
             , VariableDeclaration   : meet_VariableDeclaration
         }/*}1.2*/);

         caA .sort( compare_begin );
         dA  .sort( compare_begin );
         dcaA.sort( compare_begin );
         iA  .sort( compare_begin );
         rxA .sort( compare_begin );
         sA  .sort( compare_begin );
         
         function meet_CallExpression( node )
         /*{1.3*/{
             var /*vd*/callee/**/ = node.callee;
             if (callee.type === /*dq*/"Identifier"/**/)
             /*{1.3.1*/{
                 
                 var /*vd*/begin/**/ = callee.start
                 ,   /*vd*/parI/**/  = nakedCode.indexOf( /*dq*/"("/**/, callee.end )
                 ;
                 if (parI < 0)
                     throw new Error( /*sq*/'meet_CallExpression bug'/**/ );
                 
                 var /*vd*/str/**/ = code.substring( begin, parI + 1 );
                 
                 caA.push( /*{1.3.1.1*/{ begin : begin, str : str, name : callee.name, acornNode : node }/*}1.3.1.1*/ );

                 for (var /*vd*/i/**/ = iA.length; i--;)
                 /*{1.3.1.2*/{
                     if (callee === iA[ i ].acornNode)
                     /*{1.3.1.2.1*/{
                         iA.splice( i, 1 );
                         break;
                     }/*}1.3.1.2.1*/
                     else if (iA[ i ].begin < callee.start)
                     /*{1.3.1.2.2*/{
                         break;
                     }/*}1.3.1.2.2*/
                 }/*}1.3.1.2*/
             }/*}1.3.1*/
             else if (callee.type === /*dq*/"MemberExpression"/**/)
             /*{1.3.2*/{
                 var /*vd*/cp/**/ = callee.property
                 , /*vd*/name/**/ = cp.name
                 , /*vd*/dotI/**/ = nakedCode.lastIndexOf( /*sq*/'.'/**/, cp.start )
                 , /*vd*/parI/**/ = nakedCode.indexOf( /*dq*/"("/**/, cp.end )
                 ;
                 if (dotI < 0  ||  parI < 0)
                     throw new Error( /*sq*/'meet_CallExpression bug'/**/ );

                 dcaA.push( /*{1.3.2.1*/{ begin : dotI, str : code.substring( dotI, parI + 1 ), name : name, acornNode : node }/*}1.3.2.1*/ );

                 for (var /*vd*/i/**/ = dA.length; i--;)
                 /*{1.3.2.2*/{
                     if (cp === dA[ i ].acornNode)
                     /*{1.3.2.2.1*/{
                         dA.splice( i, 1 );
                         break;
                     }/*}1.3.2.2.1*/
                     else if (dA[ i ].begin < cp.start)
                     /*{1.3.2.2.2*/{
                         break;
                     }/*}1.3.2.2.2*/
                 }/*}1.3.2.2*/
             }/*}1.3.2*/     
             else if (callee.type === /*dq*/"FunctionExpression"/**/)
             /*{1.3.3*/{
                 /*dc*/// No need to do anything here
             }/*}1.3.3*/
             else
                 throw new Error( /*dq*/"bug"/**/ );
         }/*}1.3*/

         function meet_FunctionDeclaration( node )
         /*{1.35*/{
             var /*vd*/name/**/ = node.id.name;
             (name  ||  0).substring.call.a;

             var /*vd*/begin/**/ = node.id.start;
             begin.toPrecision.call.a;

             var /*vd*/parI/**/ = nakedCode.indexOf( /*dq*/"("/**/, node.id.end )
             ,   /*vd*/str/**/  = nakedCode.substring( begin, parI + 1 )
             ;
             
             caA.push( /*{1.35.1*/{ begin : begin, str : str, name : name, acornNode : node }/*}1.35.1*/ );

             node.params.forEach( meet_Identifier );

             fdA.push( /*{1.35.2*/{ begin : node.start, str : nakedCode.substring( node.start, node.end ), type : node.type, name : name, acornNode : node }/*}1.35.2*/ );
         }/*}1.35*/

         function meet_FunctionExpression( node )
         /*{1.37*/{
             node.params.forEach( meet_Identifier );

             var /*vd*/begin/**/ = node.start
             ,   /*vd*/end/**/   = node.end
             ,   /*vd*/str/**/
             ;
             while (!/*rr*//^function//**/.test( str = nakedCode.substring( begin, end )))
             /*{1.37.1*/{
                 var /*vd*/mo_begin/**/ = /*rr*//^\s*\(\s*//**/.exec( str )
                 ,   /*vd*/mo_end/**/   = /*rr*//\s*\)\s*$//**/.exec( str )
                 ;
                 begin += mo_begin[ 0 ].length;
                 end   -= mo_end[ 0 ].length;
                 if (begin > end)
                     throw new Error( /*sq*/'bug'/**/)
             }/*}1.37.1*/
             
             feA.push( /*{1.37.2*/{ begin : begin, str : str, type : node.type, name : node.id ? node.id.name : /*sq*/''/**/, acornNode : node }/*}1.37.2*/ );
         }/*}1.37*/

         function meet_JsmInlineStatement( node)
         /*{1.380*/{
             jINA.push( /*{1.380.1*/{ begin : node.start, end : node.end, str : nakedCode.substring( node.start, node.end ), type : node.type, name : /*sq*/'inline'/**/, acornNode : node }/*}1.380.1*/ );
         }/*}1.380*/

         function meet_JsmMetafunDeclaration( node )
         /*{1.381*/{

             var /*vd*/name/**/ = node.id.name;
             (name  ||  0).substring.call.a;

             jMFA.push( /*{1.3811*/{ begin : node.start, str : nakedCode.substring( node.start, node.end ), type : node.type, name : name, acornNode : node }/*}1.3811*/ );
         }/*}1.381*/

         function meet_JsmMetafunExpression( node )
         /*{1.382*/{
             
         }/*}1.382*/

         function meet_Identifier( node )
         /*{1.4*/{
             iA.push( /*{1.41*/{ begin : node.start, str : node.name, name : node.name, acornNode : node }/*}1.41*/ );
         }/*}1.4*/

         function meet_Literal( node ) 
         /*{1.5*/{
             var /*vd*/v/**/ = node.value
             , /*vd*/wto/**/ = null
             , /*vd*/isString/**/
             , /*vd*/isRegExp/**/
             ;
             
             if (isString = (/*sq*/'string'/**/ === typeof v))    wto = sA;
             else if (isRegExp = (v instanceof RegExp)) wto = rxA;

             if (wto)
                 wto.push( /*{1.5.1*/{ begin : node.start, str : node.raw, acornNode : node }/*}1.5.1*/ );

             if (isString  ||  isRegExp)
             /*{1.5.2*/{
                 nakedCodeNoStrNoRx = nakedCodeNoStrNoRx.substring( 0, node.start ) + str_repli( /*sq*/' '/**/, node.end - node.start ) + 
                     nakedCodeNoStrNoRx.substring( node.end );
             }/*}1.5.2*/

         }/*}1.5*/
         
         function meet_MemberExpression( node )
         /*{1.6*/{
             var /*vd*/p/**/ = node.property;
             if (!node.computed  &&  p.type === /*dq*/"Identifier"/**/)
             /*{1.6.1*/{
              
                 var /*vd*/dotI/**/ = nakedCode.lastIndexOf( /*sq*/'.'/**/, p.start );
                 if (dotI < 0)
                     throw new Error( /*sq*/'meet_MemberExpression bug'/**/ );

                 dA.push( /*{1.6.1.1*/{ begin : dotI, str : code.substring( dotI, p.start + p.name.length ), name : p.name, acornNode : p }/*}1.6.1.1*/ );

             }/*}1.6.1*/
         }/*}1.6*/
         
         function meet_ObjectExpression( node )
         /*{1.65*/{
             node.properties.forEach( function (p) /*{1.65.1*/{
                 var /*vd*/k/**/ = p.key;
                 if (k.type === /*dq*/"Identifier"/**/)
                     meet_Identifier( k );
                 else
                     throw new Error( /*dq*/"Whatever"/**/ );
             }/*}1.65.1*/);
         }/*}1.65*/

         function meet_VariableDeclaration( node )
         /*{1.7*/{
             node.declarations.forEach( function (n) /*{1.7.1*/{ meet_Identifier( n.id ); }/*}1.7.1*/ );
         }/*}1.7*/
         
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
         
         find_bracket( find_bracket_cfg, nakedCodeNoStrNoRx, code, bA );
                 
         build_bracket_tree( bA, ret.bracketTree );
         build_bracket_sep_split( bA, nakedCodeNoStrNoRx, code, reservedArr );
         build_bracket_var_leftstr_rightstr( bA, cA );


         jMRA.push.apply( jMRA, bA.filter( function (b) /*{7ee*/{ return b.typebracket === /*sq*/'metaret'/**/; }/*}7ee*/ ) );

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

         /*dc*/// Detect identifiers and reserved words
         
         /* xxx reservedArr/Set first not thought as necessary outside, now that we are using acorn
         // var /*vd*/reservedSet/**/ = /*{2a*/{}/*}2a*/;
         // for (var /*vd*/i/**/ = reservedArr.length; i--;)  
         //     reservedSet[ reservedArr[ i ] ] = 1;
         // 
         // var /*vd*/resA/**/      = ret.reservedArr
         // */


         // /*dc*/// Reserved words: a few derived values, for convenience
         // var /*vd*/rA/**/ = ret.reservedArr
         // ,   /*vd*/rO/**/ = ret.reservedObj
         // ;
         // for (var /*vd*/n/**/ = rA.length, /*vd*/i/**/ = 0; i < n ; i++)
         // /*{6a*/{
         //     var /*vd*/x/**/ = rA[ i ];
         //     (
	 //      rO[ x.name ] !== _emptyObj[ x.name ]  ? rO[ x.name ] :  (rO[ x.name ] = [])
         //     )
         //         .push( x.begin );
         // }/*}6a*/


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


     function build_bracket_sep_split( /*array*/bA, /*string*/nakedCodeNoStrNoRx, /*string*/code, /*array of string*/reservedArr )
     {
         for (var i = bA.length; i--;)
         {
             var      x = bA[ i ]
             ,     kids = x.bracketchildren
             , nakedOne = nakedCodeNoStrNoRx.substring( x.begin, x.end )
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
                 if (!str  ||  /^\s*$/.test(nakedCodeNoStrNoRx.substring( begin, end )))
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


     function find_bracket( /*array*/cfgA, /*string*/nakedCodeNoStrNoRx, /*string*/code, /*array*/bA )
     {
         // First, find all open & close occurences, in a single pass
         // to keep the order they appear in `nakedCodeNoStrNoRx`.
         
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
         while (mo = rx.exec( nakedCodeNoStrNoRx ))
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



if (typeof cp2fmtree === 'undefined')
    
//#BUILD_BEGIN_FILE: "cp2fmtree.js"


{
(function (global) {

    // xxx common constants in a separate file
    var METAFUN        = 'jsmMetafun'
    ,   METARET        = 'jsmMetaret'
    ,   FUNCTION_EXPRESSION       = 'functionExpression'
    ,   FUNCTION_DECLARATION       = 'functionDeclaration'
    ,   RESERVED       = 'reserved'

    ,   CALL    = 'call'
    ,   DOTCALL = 'dotcall'

    ,   TYPE_BRACKET      = 'bracket'
    ,   TYPEBRACKET_CURLY = 'curly'

    ,  _emptyObj = {}
    ;

    // ---------- Public API

    global.cp2fmtree = cp2fmtree;

    // ---------- Public API implementation

    function cp2fmtree( cp, /*?array of string?*/namespace, /*?object?*/workspace, /*?fm?*/parent )
    // Input:  object returned by `codeparse`.
    // 
    // Output: array of function/metafun declaration trees.
    //
    // Comment:
    // 
    // `cp2fmtree` is used by ./metaret.js to support local metafuns
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
        
        var at = cp  instanceof Array  ?  cp  :  cp.allTree
        ,  ret = []
        ;
        if (isTopLevel)
            ret.lastname2fmarr = workspace.lastname2fmarr;  // Convenience access (mainly for ./inline.js)
        
        for (var n = at.length, i = 0; i < n; i++)
        {
            var one  = at[ i ];

            // Detect a named function/metafunction declaration,
            
            var isFunction     = one.type === FUNCTION_EXPRESSION  ||  one.type === FUNCTION_DECLARATION
            ,   isMetafunction = one.type === METAFUN

            ,   isAnonymousFunction = isFunction  &&  !one.name
            ;


            if (isAnonymousFunction  ||  isFunction  ||  isMetafunction)
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
                    dot_arr = one.name.split( '.' );
                }
                
                var ocnc = one.children.filter( function (c) { return c.type !== 'comment'; } )
                ,   c0   = ocnc[ 0 ]
                ;
                if (c0.type === 'call')
                {
                    if (c0.name !== one.name)
                        throw new Error( 'Inconsistency! Probably a bug here.' );

                    ocnc.shift();
                }
                
                if (ocnc.length !== 2)
                    throw new Error( 'Unexpected metafun declaration or function declaration' );

                var param_node = ocnc[ 0 ]
                ,   param_arr  = param_node.sepSplit.map( strip_comment_and_space )
                ,   param_set  = {}
                ;
                for (var pi = param_arr.length; pi--;)
                    param_set[ param_arr[ pi ] ] = 1;
                               

                var body_node = ocnc[ 1 ]
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
                
                var children = body_node.children  ?  cp2fmtree( body_node.children, fullname_arr, workspace, /*parent:*/out )  :  [];
                
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
                ret.push.apply( ret, cp2fmtree( one.children, namespace, workspace ) );
            }
        }

        // When done with the tree, walk it from the top
        if (isTopLevel)
        {
            find_out_who_has_what( ret, [].concat( cp.vardeclArr ), 'vardecl' );
            find_out_who_has_what( ret, cp.identifierArr.filter( function (x) { return !x.isVardecl; } ), 'varuse' );

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

//#BUILD_END_FILE: "cp2fmtree.js"



if (typeof metaparse === 'undefined')
    
//#BUILD_BEGIN_FILE: "metaret.js"


{
/*global document console load codeparse need$ cp2fmtree JSON*/

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



if (typeof cp2fmtree === 'undefined')
    
//#BUILD_BEGIN_FILE: "cp2fmtree.js"


{

}

//#BUILD_END_FILE: "cp2fmtree.js"



;(function (global) {

    // The place of `self` in the parameters: 0:first place, 1:second
    // place, etc.
    var ACTION_PARAM = 0
    , METAFUN        = 'metafun'
    , METARET        = 'metaret'
    , EXTRA_RESERVED_ARR = [ METAFUN, METARET ]
    ,  EXTRA_BRACKET_ARR  = [ { open : METARET, close : ';', typebracket : METARET, ignore_unbalanced : true } ]
    ,     CODEPARSE_OPT = { extraReservedArr : EXTRA_RESERVED_ARR, extraBracketArr : EXTRA_BRACKET_ARR }
    ,     ALLOW_RET_OPT = { jsmAllowMetaretOutsideFunction : true, allowReturnOutsideFunction : true }
    , CODEPARSE_ALLOW_RET_OPT = mixOwn( {}, CODEPARSE_OPT, ALLOW_RET_OPT )
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
            ,   cp       = codeparse( metacode, CODEPARSE_OPT )
            ,   fmtree   = cp2fmtree( cp )
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
            var body_cp = codeparse( body, ALLOW_RET_OPT )
            ,   body_argumentsArr = body_cp.identifierObj[ 'arguments' ]  ||  []
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
        var cp = codeparse( body, CODEPARSE_ALLOW_RET_OPT )
        ,   iA = cp.identifierArr
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
        var cp = codeparse( body, CODEPARSE_ALLOW_RET_OPT )
        ,  beA = cp.bracketextraArr
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

    function mixOwn( /*...*/ )
    {
        var ret = arguments[ 0 ];
        for (var i = 1, n = arguments.length; i < n; i++)
        {
            var one = arguments[ i ];
            for (var k in one) { if (one.hasOwnProperty( k )) {
                ret[ k ] = one[ k ];
            }}
        }
        return ret;
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
        
        var cp = codeparse( jscode, CONST.CODEPARSE_OPT )
        ,   fm = cp2fmtree( cp )
        ,   mretArr = cp.jsmMetaretArr  ||  []
        ,   mfunArr = cp.jsmMetafunArr  ||  []
        ;
        
        if (mfunArr.length  ||  mretArr.length)
        {
            // Consider looking at `mfunArr` and `mretArr`
            // for detailed information useful to debug.
            
            if ('undefined' !== typeof console)
            {
                console.error( 'mfunArr:', mfunArr );
                console.error( 'mretArr:', mretArr );
            }
            throw new Error( 'jsm2js:check_leftover: found remaining `metafun` and/or `metaret` within function(s): ' +
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
/*global need$ load codeparse cp2fmtree console print JSON*/

if (typeof codeparse === 'undefined')
    
//#BUILD_BEGIN_FILE: "codeparse.js"


{

}

//#BUILD_END_FILE: "codeparse.js"



if (typeof cp2fmtree === 'undefined')
    
//#BUILD_BEGIN_FILE: "cp2fmtree.js"


{

}

//#BUILD_END_FILE: "cp2fmtree.js"



(function (global) {

    var       INLINE = 'inline'
    , CODEPARSE_OPT = { 
        extraReservedArr  : [ INLINE ]
    }
    , CODEPARSE_OPT_BODY = {
        extraReservedArr  : [ INLINE ]
        , jsmAllowMetaretOutsideFunction : true
        , allowReturnOutsideFunction : true 
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

        var      cp = codeparse( code, CODEPARSE_OPT )
        ,        fm = cp2fmtree( cp )
        
        ,       all = cp.all
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
            , cp : cp
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
            ,   argumentsArr = cp.identifierObj[ 'arguments' ]  ||  []
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
            inline( getInlineCodeHygienic( cp.identifierObj, fm, one ), workspace, /*opt_code_info:*/null, error_inline_stack ) + 
                
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

        ,   oc_length = o.children.length

        ,   oc_0 = o.children[ 0 ]
        ,   oc_1 = o.children[ 1 ]
        ,   oc_2 = o.children[ 2 ]
        ;

        if (oc_length === 2  &&  
            (call = oc_0).type === CALL  &&  
            (args = oc_1).type === BRACKET  &&  args.typebracket === ROUND
           )
        {
            return {
                o            : o
                , ind        : ind
                , inlinetype : CALL
                , call       : call
                , args       : args
            };
        }

        if (oc_length === 3  &&
            (identifier = oc_0).type  === IDENTIFIER  &&  
            (call = oc_1).type === CALL  &&  
            (args = oc_2).type === BRACKET  &&  args.typebracket === ROUND  &&
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
        if (oc_length === 1  &&
            (v = oc_0).type === BRACKET   &&  v.typebracket === VAR  &&
            (vc = v.children).length === 3  &&
            (identifier = vc[ 0 ]).type === VARDECL  &&  
            (call       = vc[ 1 ]).type === CALL  &&  
            (args       = vc[ 2 ]).type === BRACKET  &&  args.typebracket === ROUND  &&  
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

        , body_cp = codeparse( body, CODEPARSE_OPT_BODY )
        ;
        
        // Prepare: Will replace variable names

        for (var i = body_cp.identifierArr.length; i--;)
        {
            var ident = body_cp.identifierArr[ i ]
            ,  newstr = paramN_map[ ident.name ]  ||  vardeclN_map[ ident.name ]
            ;
            if (newstr)
                toReplace.push( { o : ident, newstr : newstr } );
        }
        
        // Prepare: Will replace function names in calls

        for (var i = body_cp.callArr.length; i--;)
        {
            var call = body_cp.callArr[ i ]
            , newstr = paramN_map[ call.name ]  ||  vardeclN_map[ call.name ]
            ;
            if (newstr)
                toReplace.push( { o : call, newstr : call.str.replace( call.name, newstr ) } );
        }
        
        // Prepare: Will replace returns

        for (var i = body_cp.bracketextraArr.length; i--;)
        {
            var brack = body_cp.bracketextraArr[ i ];
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

        for (var n = body_cp.bracketextraArr.length, i = 0; i < n; i++)
        {
            var brack = body_cp.bracketextraArr[ i ];
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


