// --- Expressions ---

var variableIds = {x: 0, y: 1, z: 2};

function Const(x) {
    this.getValue = function () {
        return x;
    };
}

Const.prototype.evaluate = function () {
    return this.getValue();
};
Const.prototype.diff = function (d) {
    return ZERO;
};
Const.prototype.toString = function () {
    return this.getValue().toString();
};
Const.prototype.prefix = Const.prototype.toString;
Const.prototype.postfix = Const.prototype.toString;

var ZERO = new Const(0);
var ONE = new Const(1);
var TWO = new Const(2);
var E = new Const(Math.E);

//Variable
function Variable(x) {
    var id = variableIds[x];
    this.getName = function () {
        return x;
    };
    this.getId = function () {
        return id;
    };
}

Variable.prototype.evaluate = function () {
    return arguments[this.getId()];
};
Variable.prototype.diff = function (d) {
    if (d === this.getName()) {
        return ONE;
    }
    return ZERO;
};
Variable.prototype.toString = function () {
    return this.getName();
};
Variable.prototype.prefix = Variable.prototype.toString;
Variable.prototype.postfix = Variable.prototype.toString;

//Operations
function Operation() {
    var args = [].slice.call(arguments);
    this.getArgs = function () {
        return args;
    };
}

Operation.prototype.evaluate = function () {
    var args = this.getArgs();
    var values = [];

    for (var i = 0; i < args.length; i++) {
        values.push(args[i].evaluate.apply(args[i], arguments));
    }

    return this.performAction.apply(null, values);
};
Operation.prototype.diff = function (d) {
    var args = this.getArgs();
    var values = [];

    for (var i = 0; i < args.length; i++) {
        values.push(args[i].diff(d));
    }
    values = args.concat(values);

    return this.performDiff.apply(this, values);
};
Operation.prototype.toString = function () {
    return this.getArgs().join(' ') + ' ' + this.getOperation();
};
Operation.prototype.prefix = function () {
    return (
        '(' +
        this.getOperation() +
        ' ' +
        this.getArgs()
            .map(function (x) {
                return x.prefix();
            })
            .join(' ') +
        ')'
    );
};
Operation.prototype.postfix = function () {
    return (
        '(' +
        this.getArgs()
            .map(function (x) {
                return x.postfix();
            })
            .join(' ') +
        ' ' +
        this.getOperation() +
        ')'
    );
};

function DefineOperation(constructor, action, diff, symbol) {
    this.constructor = constructor;
    this.performAction = action;
    this.performDiff = diff;
    this.getOperation = function () {
        return symbol;
    };
}

DefineOperation.prototype = Operation.prototype;

function wrapOperation(action, diff, symbol) {
    var constructor = function () {
        var args = arguments;
        Operation.apply(this, args);
    };
    constructor.prototype = new DefineOperation(
        constructor,
        action,
        diff,
        symbol
    );
    return constructor;
}

var Add = wrapOperation(
    function (x, y) {
        return x + y;
    },
    function (x, y, dx, dy) {
        return new Add(dx, dy);
    },
    '+'
);

var Subtract = wrapOperation(
    function (x, y) {
        return x - y;
    },
    function (x, y, dx, dy) {
        return new Subtract(dx, dy);
    },
    '-'
);

var Multiply = wrapOperation(
    function (x, y) {
        return x * y;
    },
    function (x, y, dx, dy) {
        return new Add(new Multiply(x, dy), new Multiply(y, dx));
    },
    '*'
);

var Divide = wrapOperation(
    function (x, y) {
        return x / y;
    },
    function (x, y, dx, dy) {
        return new Divide(
            new Subtract(new Multiply(dx, y), new Multiply(x, dy)),
            new Multiply(y, y)
        );
    },
    '/'
);

var Negate = wrapOperation(
    function (x) {
        return -x;
    },
    function (x, dx) {
        return new Negate(dx);
    },
    'negate'
);

var ArcTan = wrapOperation(
    function (x) {
        return Math.atan(x);
    },
    function (x, dx) {
        return new Divide(dx, new Add(ONE, new Multiply(x, x)));
    },
    'atan'
);

var Exp = wrapOperation(
    function (x) {
        return Math.pow(Math.E, x);
    },
    function (x, dx) {
        return new Multiply(new Exp(x), dx);
    },
    'exp'
);

var create = function (constructor, args) {
    var env = Object.create(constructor.prototype);
    constructor.apply(env, args);
    return env;
};







// --- Exceptions ---
function pointToError(id) {
    var res = '';
    for (var i = 0; i < ind; i++) {
        res += ' ';
    }
    res += '^\n';
    return res;
}

function Exception(message) {
    this.message = message;
}

Exception.prototype = Error.prototype;
Exception.prototype.name = 'Exception';

function defineException(name) {
    this.name = name;
}

defineException.prototype = Exception.prototype;

function messageCreator(message) {
    return function (expr, id) {
        return message + ' ' + id + '\n' + expr + '\n' + pointToError(id);
    };
}

function wrapException(name, message) {
    var result = function () {
        var args = arguments;
        Exception.call(this, messageCreator(message).apply(null, args));
    };
    result.prototype = new defineException(name);
    return result;
}

var ExtraParenthesisException = wrapException('ExtraParenthesisException', 'Extra parenthesis at position');

var MissingParenthesisException = wrapException('MissingParenthesisException', 'Missing parenthesis at position');

var ExtraOperatorException = wrapException('ExtraOperatorException', 'Extra operator at position');

var MissingOperatorException = wrapException('MissingOperatorException', 'Missing operator at position');

var ExtraOperandException = wrapException('ExtraOperandException', 'Extra operand at position');

var MissingOperandException = wrapException('MissingOperandException', 'Missing operand at position');

var UnknownIdentifierException = wrapException('UnknownIdentifierException', 'Unknown identifier at position');

var UnexpectedEndOfInputException = wrapException('UnexpectedEndOfInputException', 'Unexpected end of input at position');



// --- Parsers ---

var operations = {
    '/': Divide,
    '*': Multiply,
    '+': Add,
    '-': Subtract,
    negate: Negate,
    atan: ArcTan,
    exp: Exp,
};
var argumentsCount = {
    '/': 2,
    '*': 2,
    '+': 2,
    '-': 2,
    negate: 1,
    atan: 1,
    exp: 1,
};

var stack = [];
var errIndices = [];
var ind = 0;
var balance = 0;
var expr = '';

function skipWhitespace() {
    while (ind < expr.length && /\s/.test(expr.charAt(ind))) {
        ++ind;
    }
}

function parseNumber() {
    if (!/[-0-9]/.test(expr.charAt(ind))) {
        return undefined;
    }

    res = '';
    if (expr.charAt(ind) === '-') {
        res += '-';
        ind++;
    }

    while (ind < expr.length && /\d/.test(expr.charAt(ind))) {
        res += expr.charAt(ind);
        ++ind;
    }

    if (res === '-' || res === '') {
        if (res === '-') {
            ind--;
        }
        return undefined;
    }
    return parseInt(res);
}

function parseIdentifier() {
    if (!/[A-Za-z]/.test(expr.charAt(ind))) {
        throw new UnknownIdentifierException(expr, ind);
    }

    res = '';
    while (ind < expr.length && /[A-Za-z]/.test(expr.charAt(ind))) {
        res += expr.charAt(ind);
        ++ind;
    }

    return res;
}

function back() {
    return stack[stack.length - 1];
}

function execute(mode) {
    var operands = [];

    if (mode) {
        // prefix

        while (back() !== '(' && !(back() in operations)) {
            operands.push(stack.pop());
            errIndices.pop();
        }

        if (back() === '(') {
            throw new MissingOperatorException(expr, errIndices.pop());
        }

        var operation = stack.pop();
        var index = errIndices.pop();

        if (stack.pop() !== '(') {
            throw new MissingParenthesisException(expr, errIndices.pop());
        }
        errIndices.pop();

        if (operands.length !== argumentsCount[operation]) {
            if (operands.length > argumentsCount[operation]) {
                throw new ExtraOperandException(expr, index);
            } else {
                throw new MissingOperandException(expr, index);
            }
        } else {
            stack.push(create(operations[operation], operands.reverse()));
        }
    } else {
        // postfix

        var operation = undefined;
        var index = undefined;

        if (!(back() in operations)) {
            throw new MissingOperatorException(expr, ind);
        } else {
            operation = stack.pop();
            index = errIndices.pop();
        }

        if (stack.length < argumentsCount[operation]) {
            throw new MissingOperandException(expr, index);
        }

        operands = stack.slice(-argumentsCount[operation]);

        errIndices = errIndices.slice(0, -argumentsCount[operation]);
        stack = stack.slice(0, -argumentsCount[operation]);

        if (!operands.every(function (x) {
                return (
                    x instanceof Const || x instanceof Variable || x instanceof Operation
                );
            })) {
            throw new MissingOperandException(expr, index);
        }

        if (stack.pop() !== '(') {
            throw new ExtraOperandException(expr, errIndices.pop());
        }
        errIndices.pop();

        stack.push(create(operations[operation], operands));
    }
}

function parse(expression, mode) {
    balance = 0;
    ind = 0;
    expr = expression;
    stack = [];
    errIndices = [];

    if (!/\S/.test(expr)) {
        throw new Exception('Empty input\n');
    }

    while (true) {
        skipWhitespace();

        if (ind >= expr.length) {
            break;
        }

        if (expr.charAt(ind) === ')') {
            balance--;
            if (balance < 0) {
                throw new ExtraParenthesisException(expr, ind);
            } else {
                execute(mode);
                ind++;
                continue;
            }
        }

        errIndices.push(ind);

        if (expr.charAt(ind) === '(') {
            stack.push('(');
            ind++;
            balance++;
            continue;
        }

        var num = parseNumber();
        if (num !== undefined) {
            stack.push(new Const(num));
            continue;
        }

        if (expr.charAt(ind) in operations) {
            stack.push(expr.charAt(ind));
            ind++;
            continue;
        }

        var identifier = parseIdentifier();

        if (identifier in operations) {
            stack.push(identifier);
        } else if (identifier in variableIds) {
            stack.push(new Variable(identifier));
        } else {
            throw new UnknownIdentifierException(expr, ind);
        }
    }

    skipWhitespace();

    if (ind !== expr.length) {
        throw new UnexpectedEndOfInputException(expr, ind);
    }
    else if (balance > 0 || stack.length > 1) {
        throw new MissingParenthesisException(expr, ind);
    }

    var res = stack.pop();

    if (!(res instanceof Const ||
            res instanceof Variable ||
            res instanceof Operation)) {
        throw new MissingParenthesisException(expr, errIndices.pop());
    }

    return res;
}

function parsePrefix(expression) {
    return parse(expression, 1);
}

function parsePostfix(expression) {
    return parse(expression, 0);
}
