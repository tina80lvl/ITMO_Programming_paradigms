var Var = {"x": 0, "y": 1, "z": 2};

var cnst = function (arg) {
    return function () {
        return arg;
    }
};

var variable = function (name) {
    return function () {
        return arguments[Var[name]];
    }
};

var x = variable("x");

var y = variable("y");

var z = variable("z");

var polyOperation = function (operation) {
    return function () {
        var args = arguments;
        return function () {
            var res = args[0].apply(this, arguments);
            for (var i = 1; i < args.length; i++) {
                res = operation(res, args[i].apply(this, arguments));
            }
            return res;
        }
    }
};

var binaryOperation = function (operation) {
    return function (firstArg, secondArg) {
        return function () {
            return operation(firstArg.apply(this, arguments),
                secondArg.apply(this, arguments));
        };
    }
};

var add = binaryOperation(function (x, y) {
    return x + y;
});

var subtract = binaryOperation(function (x, y) {
    return x - y;
});
var multiply = binaryOperation(function (x, y) {
    return x * y;
});

var divide = binaryOperation(function (x, y) {
    return x / y;
});

var unaryOperation = function (operation) {
    return function (arg) {
        return function () {
            return operation(arg.apply(this, arguments));
        }
    }
};

var negate = unaryOperation(function (x) {
    return -x;
});
var cube = unaryOperation(function (x) {
    return Math.pow(x, 3);
});
var cuberoot = unaryOperation(function (x) {
    return Math.pow(x, 1 / 3);
});

//////////////////////////////////////////////

function Const(x) {
    this.getValue = function () {
        return x;
    };
}
Const.prototype.toString = function () {
    return this.getValue().toString();
}
Const.prototype.evaluate = function () {
    return this.getValue();
}


function Variable(x) {
    this.getName = function () {
        return x;
    };
    this.getId = function () {
        return Var[x];
    };
}
Variable.prototype.evaluate = function () {
    return arguments[this.getId()];
}
Variable.prototype.toString = function () {
    return this.getName();
};


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

Operation.prototype.toString = function () {
    return this.getArgs().join(' ') + ' ' + this.getOperation();
};

function DefineOperation(constructor, action, symbol) {
    this.constructor = constructor;
    this.performAction = action;
    //this.performDiff = diff;
    this.getOperation = function () {
        return symbol;
    };
}

DefineOperation.prototype = Operation.prototype;

function wrapOperation(action, symbol) {
    var constructor = function () {
        var args = arguments;
        Operation.apply(this, args);
    };
    constructor.prototype = new DefineOperation(
        constructor,
        action,
        //diff,
        symbol
    );
    return constructor;
}

function Negate() {
    return new wrapOperation(function (x) {
        return -x;
    }, " negate");
}

function Square() {
    return new wrapOperation(function (x) {
        return Math.pow(x, 2);
    }, " square");
}

function Sqrt() {
    return new wrapOperation(function (x) {
        return Math.sqrt(Math.abs(x));
    }, " sqrt");
}

function Add() {
    return new wrapOperation(function (x, y) {
        return x + y;
    }, "+");
}

function Subtract() {
    return new wrapOperation(function (x, y) {
        return x - y;
    }, "-");
}

function Multiply() {
    return new wrapOperation(function (x, y) {
        return x * y;
    }, "*");
}

function Divide() {
    return new wrapOperation(function (x, y) {
        return x / y;
    }, "/");
}