"""Unit 1: Algebra 2 review (linear, quadratics, exponents/scientific notation, logs)."""
import sympy as sp
from common import q, check, S, same, x

# ---------------------------------------------------------------- linear
T = "m1-linear"
check(sp.Rational(5 - (-3), 6 - 2) == 2, "slope 1")
q(T, "Find the slope of the line through $(2, -3)$ and $(6, 5)$.", "2", tex="2", diff=1,
  hint="Slope is rise over run: $\\dfrac{y_2 - y_1}{x_2 - x_1}$.",
  expl="$m = \\dfrac{5 - (-3)}{6 - 2} = \\dfrac{8}{4} = 2$.")
check(sp.Rational(-2 - 7, 2 - (-4)) == sp.Rational(-3, 2), "slope 2")
q(T, "Find the slope of the line through $(-4, 7)$ and $(2, -2)$.", "-3/2", tex="-\\tfrac{3}{2}", diff=1, wrong=["3/2", "-2/3"],
  hint="Subtract in the same order on top and bottom.",
  expl="$m = \\dfrac{-2 - 7}{2 - (-4)} = \\dfrac{-9}{6} = -\\dfrac{3}{2}$.")
q(T, "Write the equation of the line with slope $-3$ that passes through $(2, 1)$, in slope-intercept form.", "y = -3x + 7", kind="equation",
  tex="y = -3x + 7", diff=1, wrong=["y = -3x + 1", "y = -3x - 5"],
  hint="Point-slope first: $y - y_1 = m(x - x_1)$, then solve for $y$.",
  expl="$y - 1 = -3(x - 2)$, so $y = -3x + 6 + 1 = -3x + 7$.")
q(T, "Write the equation of the line through $(1, 2)$ and $(3, 8)$.", "y = 3x - 1", kind="equation", tex="y = 3x - 1", diff=2,
  hint="Find the slope first, then use either point.",
  expl="$m = \\dfrac{8 - 2}{3 - 1} = 3$. $y - 2 = 3(x - 1) \\Rightarrow y = 3x - 1$.")
q(T, "Write the equation of the line parallel to $y = -2x + 1$ that passes through $(-4, 0)$.", "y = -2x - 8", kind="equation",
  tex="y = -2x - 8", diff=2, wrong=["y = -2x + 1", "y = 0.5x + 2", "y = -2x + 8"],
  hint="Parallel lines have the same slope.",
  expl="Slope $-2$. $y - 0 = -2(x + 4) \\Rightarrow y = -2x - 8$.")
q(T, "Write the equation of the line perpendicular to $y = -2x + 1$ that passes through the origin.", "y = x/2", kind="equation",
  tex="y = \\tfrac{1}{2}x", diff=2, wrong=["y = 2x", "y = -x/2", "y = -2x"],
  hint="Perpendicular slopes are negative reciprocals: flip the fraction and change the sign.",
  expl="The negative reciprocal of $-2$ is $\\tfrac{1}{2}$. Through $(0, 0)$ the intercept is 0, so $y = \\tfrac{1}{2}x$.")
check(same(sp.Rational(-4, 3) * (x - 3) - 1, "-4x/3 + 3"), "perp 3x-4y")
q(T, "Find the equation of the line perpendicular to $3x - 4y = 12$ through $(3, -1)$.", "y = -4x/3 + 3", kind="equation",
  tex="y = -\\tfrac{4}{3}x + 3", diff=3, wrong=["y = 3x/4 - 13/4", "y = 4x/3 - 5"],
  hint="Solve $3x - 4y = 12$ for $y$ to read its slope first.",
  expl="$y = \\tfrac{3}{4}x - 3$, so the perpendicular slope is $-\\tfrac{4}{3}$. $y + 1 = -\\tfrac{4}{3}(x - 3) \\Rightarrow y = -\\tfrac{4}{3}x + 3$.")
q(T, "Fill in the blank: the slope of a ______ line is zero.", "horizontal", qtype="mcq", choices=["horizontal", "vertical", "perpendicular", "diagonal"], diff=1,
  hint="Zero rise, any run.", expl="A horizontal line has rise 0, so $m = 0$. A vertical line has run 0, so its slope is undefined.")
q(T, "Two lines are ______ if they intersect to form right angles.", "perpendicular", qtype="mcq", choices=["perpendicular", "parallel", "collinear", "congruent"], diff=1,
  hint="Right angles.", expl="Perpendicular lines meet at $90^\\circ$; their slopes multiply to $-1$.")
q(T, "What is the slope of the line $x = 4$?", "undefined", qtype="mcq", choices=["undefined", "0", "4", "1"], diff=1,
  hint="$x = 4$ is a vertical line. What is its run?", expl="Vertical line: run is 0, and you cannot divide by 0, so the slope is undefined.")
q(T, "Find the $x$-intercept of $2x + 5y = 10$.", "(5, 0)", kind="point", tex="(5, 0)", diff=1, wrong=["(0, 2)", "(2, 0)"],
  hint="On the $x$-axis, $y = 0$.", expl="Set $y = 0$: $2x = 10$, $x = 5$. The intercept is $(5, 0)$.")
q(T, "Write the equation of the horizontal line through $(3, -7)$.", "y = -7", kind="equation", tex="y = -7", diff=1,
  hint="Horizontal lines are $y = $ a constant.", expl="Every point on a horizontal line has the same $y$, so $y = -7$.")
q(T, "How are the lines $y = 2x + 3$ and $4x - 2y = 7$ related?", "parallel", qtype="mcq", choices=["parallel", "perpendicular", "the same line", "neither"], diff=2,
  hint="Rewrite the second line in slope-intercept form.",
  expl="$4x - 2y = 7 \\Rightarrow y = 2x - \\tfrac{7}{2}$. Same slope 2, different intercepts, so parallel.")
check(same(sp.Rational(2, 3) * (x + 6) + 4, "2x/3 + 8"), "pt slope")
q(T, "Rewrite $y - 4 = \\tfrac{2}{3}(x + 6)$ in slope-intercept form.", "y = 2x/3 + 8", kind="equation", tex="y = \\tfrac{2}{3}x + 8", diff=2,
  wrong=["y = 2x/3 + 10", "y = 2x/3 + 4"],
  hint="Distribute, then add 4 to both sides.", expl="$y - 4 = \\tfrac{2}{3}x + 4 \\Rightarrow y = \\tfrac{2}{3}x + 8$.")

# ---------------------------------------------------------------- quadratics
T = "m1-quadratics"
F = "factored"
def fq(poly, ans, tex, diff, hint, expl, wrong=None):
    check(sp.expand(S(ans) - S(poly)) == 0, f"factor {poly}")
    q(T, f"Factor completely: ${tex}$", ans, kind="expr", tex=sp.latex(S(ans)), diff=diff, form=F, wrong=wrong,
      placeholder="A product, e.g. (x + 2)(x - 5)", hint=hint, expl=expl)

fq("x^2 + 7x + 12", "(x+3)(x+4)", "x^2 + 7x + 12", 1, "Two numbers that multiply to 12 and add to 7.",
   "$3 \\cdot 4 = 12$ and $3 + 4 = 7$, so $(x + 3)(x + 4)$.", wrong=["x^2+7x+12", "(x+2)(x+6)"])
fq("x^2 - 5x - 14", "(x-7)(x+2)", "x^2 - 5x - 14", 1, "Multiply to $-14$, add to $-5$.",
   "$-7 \\cdot 2 = -14$ and $-7 + 2 = -5$: $(x - 7)(x + 2)$.", wrong=["(x+7)(x-2)"])
fq("6x^2 + 7x - 3", "(3x-1)(2x+3)", "6x^2 + 7x - 3", 3, "AC method: $6 \\cdot (-3) = -18$. Which pair multiplies to $-18$ and adds to $7$?",
   "$9$ and $-2$. $6x^2 + 9x - 2x - 3 = 3x(2x + 3) - 1(2x + 3) = (3x - 1)(2x + 3)$.")
fq("4x^2 - 25", "(2x-5)(2x+5)", "4x^2 - 25", 1, "Difference of squares: $a^2 - b^2 = (a - b)(a + b)$.",
   "$4x^2 = (2x)^2$ and $25 = 5^2$, so $(2x - 5)(2x + 5)$.", wrong=["(2x-5)^2"])
fq("3x^3 - 12x", "3x(x-2)(x+2)", "3x^3 - 12x", 2, "Take out the GCF first, then look again.",
   "$3x(x^2 - 4) = 3x(x - 2)(x + 2)$. Stopping at $3x(x^2 - 4)$ is not complete.", wrong=["3x(x^2-4)"])
fq("x^3 - 8", "(x-2)(x^2+2x+4)", "x^3 - 8", 3, "Difference of cubes: $a^3 - b^3 = (a - b)(a^2 + ab + b^2)$.",
   "$a = x$, $b = 2$: $(x - 2)(x^2 + 2x + 4)$. The quadratic factor does not factor further.")
fq("2x^2 - 8x + 8", "2(x-2)^2", "2x^2 - 8x + 8", 2, "GCF first.",
   "$2(x^2 - 4x + 4) = 2(x - 2)^2$.", wrong=["2(x^2-4x+4)"])

check(set(sp.solve(x**2 - 5*x - 14, x)) == {7, -2}, "solve quad")
q(T, "Solve $x^2 - 5x - 14 = 0$.", "7, -2", kind="set", tex="x = 7,\\ x = -2", diff=1, wrong=["-7, 2", "7"],
  hint="Factor, then set each factor to zero.", expl="$(x - 7)(x + 2) = 0$, so $x = 7$ or $x = -2$.")
def vq(poly, ans, tex, diff, expl, wrong=None):
    check(sp.expand(S(ans) - S(poly)) == 0, f"vertex {poly}")
    q(T, f"Complete the square to write ${tex}$ in vertex form $a(x - h)^2 + k$.", ans, kind="expr", tex=ans,
      diff=diff, form="vertex", wrong=wrong, placeholder="e.g. (x + 1)^2 - 3", hint="Half the $x$-coefficient, squared, is what you add and subtract.", expl=expl)
vq("x^2 + 6x + 5", "(x+3)^2 - 4", "x^2 + 6x + 5", 2, "Half of 6 is 3, $3^2 = 9$: $x^2 + 6x + 9 - 9 + 5 = (x + 3)^2 - 4$.", wrong=["(x+3)^2+5", "x^2+6x+5", "(x-3)^2-4"])
vq("x^2 - 8x + 3", "(x-4)^2 - 13", "x^2 - 8x + 3", 2, "Half of $-8$ is $-4$, $(-4)^2 = 16$: $(x - 4)^2 - 16 + 3 = (x - 4)^2 - 13$.", wrong=["(x-4)^2+3", "(x+4)^2-13"])
vq("2x^2 + 12x + 7", "2(x+3)^2 - 11", "2x^2 + 12x + 7", 3, "Factor 2 out of the $x$ terms: $2(x^2 + 6x) + 7 = 2(x^2 + 6x + 9) - 18 + 7 = 2(x + 3)^2 - 11$.", wrong=["2(x+3)^2-2", "2(x+3)^2+7"])
q(T, "Find the vertex of $y = x^2 - 8x + 3$.", "(4, -13)", kind="point", tex="(4, -13)", diff=2, wrong=["(-4, -13)", "(4, 3)"],
  hint="Vertex form $a(x - h)^2 + k$ has vertex $(h, k)$, or use $x = -\\tfrac{b}{2a}$.", expl="$(x - 4)^2 - 13$, so the vertex is $(4, -13)$.")
check(set(sp.solve(x**2 + 4*x - 1, x)) == {-2 + sp.sqrt(5), -2 - sp.sqrt(5)}, "cts")
q(T, "Solve $x^2 + 4x - 1 = 0$ by completing the square. Give exact answers.", "-2 + sqrt(5), -2 - sqrt(5)", kind="set", tex="x = -2 \\pm \\sqrt{5}", diff=3,
  wrong=["2 ± sqrt(5)", "-2 + sqrt(5)"], placeholder="e.g. x = 3 ± √2",
  hint="Move the constant: $x^2 + 4x = 1$. Add $\\left(\\tfrac{4}{2}\\right)^2$ to both sides.",
  expl="$x^2 + 4x + 4 = 5 \\Rightarrow (x + 2)^2 = 5 \\Rightarrow x + 2 = \\pm\\sqrt{5} \\Rightarrow x = -2 \\pm \\sqrt{5}$.")
q(T, "What number completes the square: $x^2 - 10x + \\_\\_\\_$ ?", "25", tex="25", diff=1, wrong=["-25", "100", "5"],
  hint="Take half of $-10$ and square it.", expl="$\\left(\\tfrac{-10}{2}\\right)^2 = (-5)^2 = 25$, giving $(x - 5)^2$.")
check(set(sp.solve(2*x**2 + 3*x - 2, x)) == {sp.Rational(1, 2), -2}, "q2")
q(T, "Solve $2x^2 + 3x - 2 = 0$.", "1/2, -2", kind="set", tex="x = \\tfrac{1}{2},\\ x = -2", diff=2, wrong=["-1/2, 2", "2, -1/2"],
  hint="AC method: $2 \\cdot (-2) = -4$. Pair that adds to 3?", expl="$(2x - 1)(x + 2) = 0$, so $x = \\tfrac{1}{2}$ or $x = -2$.")

# ---------------------------------------------------------------- exponents & scientific notation
T = "m1-exponents"
def sci(prompt, ans, tex, diff, hint, expl, wrong=None, value=None):
    if value is not None:
        check(sp.nsimplify(value) == sp.nsimplify(S(ans.replace("e", "*10^"))), f"sci {prompt}")
    q(T, prompt, ans, tex=tex, diff=diff, form="sci", wrong=wrong, placeholder="e.g. 3.2 × 10^-4", hint=hint, expl=expl)

sci("Write $0.0000456$ in scientific notation.", "4.56e-5", "4.56 \\times 10^{-5}", 1, "Move the decimal until one non-zero digit is in front. Small numbers get negative exponents.",
    "The decimal moves 5 places right: $4.56 \\times 10^{-5}$.", wrong=["4.56 x 10^5", "45.6 x 10^-6", "0.456e-4"], value=sp.Rational(456, 10**7))
sci("Write $78{,}000{,}000$ in scientific notation.", "7.8e7", "7.8 \\times 10^{7}", 1, "Count how many places the decimal moves left.",
    "$78{,}000{,}000 = 7.8 \\times 10^{7}$.", wrong=["78 x 10^6", "7.8 x 10^6"], value=78000000)
sci("Simplify $\\dfrac{1.4 \\times 10^{4}}{0.2 \\times 10^{2}}$. Answer in scientific notation.", "7e2", "7 \\times 10^{2}", 2,
    "Divide the numbers, subtract the exponents.", "$\\tfrac{1.4}{0.2} = 7$, $10^{4-2} = 10^2$: $7 \\times 10^{2}$.", wrong=["700", "7 x 10^6"], value=700)
sci("Simplify $\\dfrac{3.3 \\times 10^{-3}}{1.1 \\times 10^{-5}}$. Answer in scientific notation.", "3e2", "3 \\times 10^{2}", 2,
    "Subtract exponents carefully: $-3 - (-5)$.", "$\\tfrac{3.3}{1.1} = 3$ and $10^{-3-(-5)} = 10^{2}$: $3 \\times 10^{2}$.", wrong=["3 x 10^-8", "300"], value=300)
sci("Simplify $(2 \\times 10^{4})(4 \\times 10^{-5})$. Answer in scientific notation.", "8e-1", "8 \\times 10^{-1}", 2,
    "Multiply the numbers, add the exponents.", "$2 \\cdot 4 = 8$ and $10^{4 + (-5)} = 10^{-1}$: $8 \\times 10^{-1}$ (which equals 0.8).", wrong=["4/5", "0.8", "8 x 10^-20"], value=sp.Rational(8, 10))
sci("Simplify $(7 \\times 10^{3})(3 \\times 10^{-1})$. Answer in scientific notation.", "2.1e3", "2.1 \\times 10^{3}", 2,
    "After multiplying, check the number in front is between 1 and 10.",
    "$7 \\cdot 3 = 21$ and $10^{3 - 1} = 10^2$, so $21 \\times 10^2$. That is not finished: $21 = 2.1 \\times 10^1$, giving $2.1 \\times 10^{3}$.",
    wrong=["21 x 10^2", "2100", "2.1 x 10^2"], value=2100)
q(T, "Simplify $\\dfrac{4x^5}{2x^{-3}}$.", "2x^8", kind="expr", tex="2x^{8}", diff=2, wrong=["2x^2", "2x^(-15)"], domain=[0.5, 3],
  hint="Dividing: subtract exponents. Subtracting a negative adds.", expl="$\\tfrac{4}{2} = 2$ and $x^{5 - (-3)} = x^{8}$: $2x^{8}$.")
q(T, "Simplify $(3x^2)^3$.", "27x^6", kind="expr", tex="27x^{6}", diff=1, wrong=["9x^6", "3x^6", "27x^5"], domain=[0.5, 3],
  hint="The power applies to the 3 and to $x^2$.", expl="$3^3 = 27$ and $(x^2)^3 = x^6$: $27x^6$.")
check(sp.Integer(8) ** sp.Rational(2, 3) == 4, "8^(2/3)")
q(T, "Evaluate $8^{2/3}$ without a calculator.", "4", tex="4", diff=2, wrong=["16/3", "5.33"],
  hint="Denominator is the root, numerator is the power: $\\left(\\sqrt[3]{8}\\right)^2$.", expl="$\\sqrt[3]{8} = 2$ and $2^2 = 4$.")
check(sp.Integer(16) ** sp.Rational(-3, 4) == sp.Rational(1, 8), "16^-3/4")
q(T, "Evaluate $16^{-3/4}$ without a calculator.", "1/8", tex="\\tfrac{1}{8}", diff=3, wrong=["8", "-8", "-12"],
  hint="Negative exponent means reciprocal. Then fourth root, then cube.", expl="$16^{-3/4} = \\dfrac{1}{(\\sqrt[4]{16})^3} = \\dfrac{1}{2^3} = \\dfrac{1}{8}$.")

# ---------------------------------------------------------------- logs
T = "m1-logs"
def L(b, a):
    return sp.nsimplify(sp.log(a, b))
check(L(2, 16) - L(3, 81) == 0, "log1")
q(T, "Evaluate $\\log_2 16 - \\log_3 81$.", "0", tex="0", diff=1, hint="Ask: 2 to what power is 16? 3 to what power is 81?",
  expl="$\\log_2 16 = 4$ and $\\log_3 81 = 4$, so $4 - 4 = 0$.")
check(L(5, 125) + L(4, 16) - L(2, 32) == 0, "log2")
q(T, "Evaluate $\\log_5 125 + \\log_4 16 - \\log_2 32$.", "0", tex="0", diff=1, hint="Evaluate each log separately first.",
  expl="$3 + 2 - 5 = 0$.")
q(T, "Solve $\\log_9 \\tfrac{1}{9} = x$.", "-1", tex="x = -1", diff=1, wrong=["1", "1/9"],
  hint="Rewrite as $9^x = \\tfrac{1}{9}$.", expl="$9^{-1} = \\tfrac{1}{9}$, so $x = -1$.")
check(L(3, 3) + L(2, 8) == 4, "log4")
q(T, "Solve $\\log_3 3 + \\log_2 8 = x$.", "4", tex="x = 4", diff=1, hint="Each log is a small whole number.", expl="$1 + 3 = 4$.")
check(sp.solve(6*x + 7 - 81, x) == [sp.Rational(37, 3)], "log5")
q(T, "Solve $\\log_9 (6x + 7) = 2$.", "37/3", tex="x = \\tfrac{37}{3}", diff=2, wrong=["74/3", "-5/6", "12"],
  hint="Rewrite in exponential form: $9^2 = 6x + 7$.", expl="$6x + 7 = 81 \\Rightarrow 6x = 74 \\Rightarrow x = \\tfrac{74}{6} = \\tfrac{37}{3}$.")
q(T, "Solve $\\log_6 36 = 5x + 3$.", "-1/5", tex="x = -\\tfrac{1}{5}", diff=2, wrong=["1/5", "-1"],
  hint="Evaluate $\\log_6 36$ first.", expl="$\\log_6 36 = 2$, so $2 = 5x + 3 \\Rightarrow 5x = -1 \\Rightarrow x = -\\tfrac{1}{5}$.")
q(T, "Solve $\\log x = -2$.", "1/100", tex="x = \\tfrac{1}{100}", diff=2, wrong=["-100", "100", "-20"],
  hint="No base written means base 10.", expl="$x = 10^{-2} = \\tfrac{1}{100}$.")
check(L(5, sp.sqrt(5)) == sp.Rational(1, 2), "log sqrt")
q(T, "Solve $\\log_5 \\sqrt{5} = x$.", "1/2", tex="x = \\tfrac{1}{2}", diff=2, wrong=["2", "5"],
  hint="Write $\\sqrt{5}$ as a power of 5.", expl="$\\sqrt{5} = 5^{1/2}$, so $x = \\tfrac{1}{2}$.")
check(L(6, sp.Rational(1, 36)) == -2, "log6")
q(T, "Evaluate $\\log_6 \\tfrac{1}{36}$.", "-2", tex="-2", diff=2, wrong=["2", "1/2"],
  hint="$36 = 6^2$, and a reciprocal flips the sign of the exponent.", expl="$6^{-2} = \\tfrac{1}{36}$, so the answer is $-2$.")
check(L(8, 4) == sp.Rational(2, 3), "log8 4")
q(T, "Evaluate $\\log_8 4$.", "2/3", tex="\\tfrac{2}{3}", diff=3, wrong=["2", "1/2", "3/2"],
  hint="Write both 8 and 4 as powers of 2, then match exponents.", expl="$8^x = 4 \\Rightarrow 2^{3x} = 2^2 \\Rightarrow 3x = 2 \\Rightarrow x = \\tfrac{2}{3}$.")
q(T, "Which is $2^5 = 32$ written in logarithmic form?", "$\\log_2 32 = 5$", qtype="mcq",
  choices=["$\\log_2 32 = 5$", "$\\log_5 32 = 2$", "$\\log_{32} 2 = 5$", "$\\log_2 5 = 32$"], diff=1,
  hint="The base stays the base. The log IS the exponent.", expl="$b^c = a \\iff \\log_b a = c$: base 2, exponent 5, result 32.")
q(T, "Which is $\\log_3 \\tfrac{1}{27} = -3$ written in exponential form?", "$3^{-3} = \\tfrac{1}{27}$", qtype="mcq",
  choices=["$3^{-3} = \\tfrac{1}{27}$", "$(-3)^3 = \\tfrac{1}{27}$", "$\\left(\\tfrac{1}{27}\\right)^{3} = -3$", "$27^{-3} = 3$"], diff=1,
  hint="Base to the answer equals the argument.", expl="$\\log_b a = c \\iff b^c = a$: $3^{-3} = \\tfrac{1}{27}$.")
check(sp.Integer(4) ** sp.Rational(3, 2) == 8, "log4 x")
q(T, "Solve $\\log_4 x = \\tfrac{3}{2}$.", "8", tex="x = 8", diff=2, wrong=["6", "16", "3/8"],
  hint="$x = 4^{3/2}$. Square root first.", expl="$4^{3/2} = (\\sqrt{4})^3 = 2^3 = 8$.")
q(T, "Solve $\\log_x 49 = 2$.", "7", tex="x = 7", diff=2, wrong=["-7", "7, -7", "24.5"],
  hint="$x^2 = 49$, and a log base must be positive and not 1.", expl="$x^2 = 49 \\Rightarrow x = \\pm 7$, but a base cannot be negative, so $x = 7$.")
q(T, "Solve $\\log_2 (x - 3) = 4$.", "19", tex="x = 19", diff=2, wrong=["11", "16", "13"],
  hint="Exponential form: $2^4 = x - 3$.", expl="$x - 3 = 16 \\Rightarrow x = 19$.")
q(T, "Evaluate $\\log 1000$.", "3", tex="3", diff=1, hint="Base 10.", expl="$10^3 = 1000$, so $\\log 1000 = 3$.")
check(abs(float(sp.log(20, 3)) - 2.7268) < 1e-3, "change of base")
q(T, "Use change of base to evaluate $\\log_3 20$ to three significant figures.", "log(20)/log(3)", tex="\\dfrac{\\log 20}{\\log 3} \\approx 2.73", calc="calc", diff=2,
  wrong=["0.366", "6.67", "2.99"], placeholder="A decimal, e.g. 1.46",
  hint="$\\log_b a = \\dfrac{\\log a}{\\log b}$ on the TI-84 (or use logBASE).",
  expl="$\\log_3 20 = \\dfrac{\\log 20}{\\log 3} = \\dfrac{1.3010}{0.4771} \\approx 2.73$.")
check(L(2, sp.Rational(1, 8)) + L(3, sp.sqrt(3)) == sp.Rational(-5, 2), "log mix")
q(T, "Evaluate $\\log_2 \\tfrac{1}{8} + \\log_3 \\sqrt{3}$.", "-5/2", tex="-\\tfrac{5}{2}", diff=3, wrong=["5/2", "-7/2", "-3"],
  hint="Do each log on its own: one is negative, one is a fraction.", expl="$\\log_2 \\tfrac{1}{8} = -3$ and $\\log_3 \\sqrt{3} = \\tfrac{1}{2}$: $-3 + \\tfrac{1}{2} = -\\tfrac{5}{2}$.")
