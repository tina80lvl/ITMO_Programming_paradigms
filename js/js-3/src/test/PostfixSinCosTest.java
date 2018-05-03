package test;

/**
 * @author Georgiy Korneev (kgeorgiy@kgeorgiy.info)
 */
public class PostfixSinCosTest extends PrefixSinCosTest {
    public static final Dialect POSTFIX = dialect(
            "%s",
            "%s",
            (op, args) -> "(" + String.join(" ", args) + " " + op + ")"
    );

    protected PostfixSinCosTest(final int mode) {
        super(mode, new Language(ARITHMETIC_OBJECT, POSTFIX, new FunctionalExpressionTest.ArithmeticTests()), "postfix");
    }

    @Override
    protected void testParsing() {
        printParsingError("Empty input", "");
        printParsingError("Unknown variable", "a");
        printParsingError("Invalid number", "-a");
        printParsingError("Missing )", "(z (x y +) *");
        printParsingError("Unknown operation", "( x y @@)");
        printParsingError("Excessive info", "(x y +) x");
        printParsingError("Empty op", "()");
        printParsingError("Invalid unary (0 args)", "(negate)");
        printParsingError("Invalid unary (2 args)", "(x y negate)");
        printParsingError("Invalid binary (0 args)", "(+)");
        printParsingError("Invalid binary (1 args)", "(x +)");
        printParsingError("Invalid binary (3 args)", "(x y z +)");
    }

    @Override
    protected String parse(final String expression) {
        return "parsePostfix('" + expression + "')";
    }

    private void printParsingError(final String description, final String input) {
        final String message = assertParsingError(input, "", "");
        final int index = message.lastIndexOf("in <eval>");
        System.out.format("%-25s: %s\n", description, message.substring(0, index > 0 ? index : message.length()));
    }

    public static void main(final String... args) {
        PrefixSinCosTest.main(args);
        new PostfixSinCosTest(mode(args, PostfixSinCosTest.class, "easy", "hard")).run();
    }
}
