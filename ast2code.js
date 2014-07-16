/*global minify need$ load codeparse cp2fmtree*/

(function (global) {

    // ---------- Public API

    global.ast2code = ast2code;

    function ast2code( /*object*/ast, /*?object?*/opt )
    // Returns a code string.
    {
        return ast2arr( ast, opt ).join( '' );       
    }

    // ---------- Private implementation

    function ast2arr( /*object | array*/ast, opt, /*?string?*/array_sep )
    // Returns an array of code strings.
    //
    // Notes:
    //
    // When `opt.ret` array defined, modifies it in-place (imperative
    // mode, useful for recursion, avoids creating many small arrays).
    //
    // When `opt.ret` array not defined, a new array is returned
    // (functional mode, useful for the top-level call).
    //
    // Guillaume Lathoud
    // glathoud@yahoo.fr
    {
        opt  ||  (opt = {});
        var ret = opt.ret  ||  (opt.ret = []);
        var jsm = opt.jsm;
        
        if (ast instanceof Array)
        {
            for (var n = ast.length, i = 0; i < n; i++)
            {
                if (0 < i  &&  array_sep)
                    ret.push( array_sep );
                
                ast2arr( ast[ i ], opt );
            }
            
            return ret;           
        }
        
        if (array_sep)
            throw new Error( 'bug' );
        
        switch(ast.type) {

        case 'ArrayExpression':
            ret.push( '[' );
            var elt = ast.elements;
            for (var ne = elt.length, ie = 0; ie < ne; ie++)
            {
                if (0 < ie)
                    ret.push( ',' );
                ast2arr( elt[ ie ], opt );
            }
            ret.push( ']' );
            return ret;

        case 'AssignmentExpression':
            ret.push( '(' );
            ast2arr( ast.left, opt );
            ret.push( ast.operator );
            ast2arr( ast.right, opt );
            ret.push( ')' );
            return ret;
            
        case 'BinaryExpression':
        case 'LogicalExpression':
            var left = ast.left
            ,  right = ast.right
            ,   left_exp = /expression/i.test( ast.left.type )
            ,  right_exp = /expression/i.test( ast.right.type )
            ;
            ret.push( '(' );
            if (left_exp)  ret.push( '(' );  // Could be optimized, using relative priorities of operators 
            ast2arr( left, opt );
            if (left_exp)  ret.push( ')' );
            ret.push( /^\w+$/.test( ast.operator )  ?  ' ' + ast.operator + ' '  :  ast.operator );
            if (right_exp)  ret.push( '(' );  // Could be optimized, using relative priorities of operators 
            ast2arr( right, opt );
            if (right_exp)  ret.push( ')' );
            ret.push( ')' );
            return ret;

        case 'BlockStatement': 
            ret.push( '{' );
            ast2arr( ast.body, opt );
            ret.push( '}' );
            return ret;
            
        case 'BreakStatement':
        case 'ContinueStatement':
            ret.push( ast.type === 'BreakStatement'  ?  'break'  :  'continue' );
            var label = ast.label;
            if (label)
            {
                ret.push( ' ' );
                ast2arr( label, opt );
            }
            ret.push( ';' );
            return ret;

        case 'CallExpression':
            var isFun = /function/i.test( ast.callee.type );
            if (isFun)  ret.push( '(' );
            ast2arr( ast.callee, opt );
            if (isFun)  ret.push( ')' );
            ret.push( '(' );
            ast2arr( ast.arguments, opt, ',' );
            ret.push( ')' );
            return ret;

        case 'CatchClause':
            ret.push( 'catch (' );
            ast2arr( ast.param, opt );
            ret.push( ')' );
            ast2arr( ast.body,  opt );
            return ret;

        case 'ConditionalExpression':
            ret.push( '(' );
            ast2arr( ast.test, opt );
            ret.push( '?' );
            ast2arr( ast.consequent, opt );
            ret.push( ':' );
            ast2arr( ast.alternate, opt );
            ret.push( ')' );
            return ret;

        case 'DoWhileStatement':
            ret.push( 'do ' );
            ast2arr( ast.body, opt );
            ret.push( ' while(' );
            ast2arr( ast.test, opt );
            ret.push( ')' );
            return ret;
        
        case 'EmptyStatement':
            ret.push( ';' );
            return ret;

        case 'ExpressionStatement':
            ast2arr( ast.expression, opt );
            ret.push( ';' );
            return ret;

        case 'ForStatement':
            ret.push( 'for(' );
            
            if (ast.init)
            {
                ast2arr( ast.init, opt );
            }
            else
            {
                ret.push( ';' );
            }
            
            if (ast.test)
            {
                ast2arr( ast.test, opt );
                ret.push( ';' );
            }
            else
            {
                ret.push( ';' );
            }
            
            if (ast.update)
                ast2arr( ast.update, opt );
            
            ret.push( ')' );
            ast2arr( ast.body, opt );
            return ret;

        case 'FunctionDeclaration':
        case 'FunctionExpression':
            ret.push( 'function ' );
            if (ast.id)
                ast2arr( ast.id, opt );
            ret.push( '(' );
            ast2arr( ast.params, opt, ',' );
            ret.push( ')' );
            ast2arr( ast.body, opt );
            return ret;

        case 'ForInStatement': 
            ret.push( 'for (' );
            ast2arr( ast.left, opt );

            var ilast = ret.length - 1;
            ret[ ilast ] = ret[ ilast ].replace( /;\s*$/, '' );
            
            ret.push( ' in ' );
            ast2arr( ast.right, opt );
            ret.push( ')' );
            ast2arr( ast.body, opt );
            return ret;

        case 'Identifier': 
            ret.push( ast.name );
            return ret;

        case 'IfStatement':
            ret.push( 'if (' );
            ast2arr( ast.test, opt );
            ret.push( ')' );
            ast2arr( ast.consequent, opt );
            if (ast.alternate)
            {
                ret.push( ' else ' );
                ast2arr( ast.alternate, opt );
            }
            return ret;

        case 'LabeledStatement':
            ast2arr( ast.label, opt );
            ret.push( ':' );
            ast2arr( ast.body, opt );
            return ret;

        case 'Literal': 
            ret.push( ast.raw );
            return ret;
            
        case 'MemberExpression':
            ast2arr( ast.object, opt );
            ret.push( ast.computed  ?  '['  :  '.' );
            ast2arr( ast.property, opt );
            if (ast.computed)
                ret.push( ']' );
            return ret;

        case 'NewExpression':
            ret.push( 'new ' );
            ast2arr( ast.callee, opt );
            
            var arg = ast.arguments;
            if (arg)
            {
                ret.push( '(' );
                ast2arr( arg, opt, ',' );
                ret.push( ')' );
            }
            return ret;

        case 'ObjectExpression':
            ret.push( '{' );
            var prop = ast.properties;
            for (var np = prop.length, ip = 0; ip < np; ip++)
            {
                if (0 < ip)
                    ret.push( ',' );
                
                var pi = prop[ ip ];
                if (pi.kind !== 'init')
                    throw new Error( 'ast2arr: unknown kind of object property' );

                ast2arr( pi.key, opt );
                ret.push( ':' );
                ast2arr( pi.value, opt );
            }
            
            ret.push( '}' );
            return ret;

        case 'Program': 
            ast2arr( ast.body, opt );
            return ret;

        case 'ReturnStatement':
            ret.push( 'return' );
            if (ast.argument)
            {
                ret.push( ' ' );
                ast2arr( ast.argument, opt );
            }
            ret.push( ';' );
            return ret;

        case 'SequenceExpression':
            var es = ast.expressions;
            for (var nes = es.length, ies = 0; ies < nes; ies++)
            {
                var e = es[ ies ]
                , isAssign = /assign/i.test( e.type )
                ;
                if (0 < ies)   ret.push( ',' );
                if (isAssign)  ret.push( '(' );
                ast2arr( e, opt );
                if (isAssign)  ret.push( ')' );
            }
            return ret;

        case 'SwitchCase':
            if (!ast.test)
            {
                ret.push( 'default:' );
            }
            else
            {
                ret.push( 'case ' );
                ast2arr( ast.test, opt );
                ret.push( ':' );
            }
            ast2arr( ast.consequent, opt );
            return ret;

        case 'SwitchStatement':
            ret.push( 'switch(' );
            ast2arr( ast.discriminant, opt );
            ret.push( '){' );
            ast2arr( ast.cases, opt );
            ret.push( '}' );
            return ret;

        case 'ThisExpression':
            ret.push( 'this' );
            return ret;

        case 'ThrowStatement':
            ret.push( 'throw ' );
            ast2arr( ast.argument, opt );
            ret.push( ';' );
            return ret;
            
        case 'TryStatement':
            ret.push( 'try ' );
            ast2arr( ast.block, opt );
            if (ast.handler)   ast2arr( ast.handler,   opt );
            if (ast.finalizer) ast2arr( ast.finalizer, opt );
            return ret;

        case 'UnaryExpression':
        case 'UpdateExpression':
            var  op = ast.operator
            ,   arg = ast.argument
            ;
            if (ast.prefix)
            {
                ret.push( op );
                if (/^\w+$/.test( op ))  ret.push( ' ' );
                ast2arr( arg, opt );
            }
            else
            {
                ast2arr( arg, opt );
                ret.push( op );                
            }
            return ret;            

        case 'VariableDeclaration':
            var decl = ast.declarations;
            for (var nd = decl.length, id = 0; id < nd; id++)
            {
                ret.push( id < 1  ?  'var '  :  ',' );
                ast2arr( decl[ id ], opt );
            }
            ret.push(';');
            return ret;
        
        case 'VariableDeclarator':
            ret.push( ast.id.name );
            var init = ast.init;
            if (init)
            {
                ret.push( '=' );
                ast2arr( init, opt );
            }
            return ret;

        case 'WhileStatement':
            ret.push( 'while (' );
            ast2arr( ast.test, opt );
            ret.push( ')' );
            ast2arr( ast.body, opt );
            return ret;
        }

        console.error('xxx  unknown type ' + ast.type );
        error.bug;
    }

})(this);
