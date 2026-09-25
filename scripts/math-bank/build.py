"""Build content/math/questions/*.json from the unit files. Every answer is checked with sympy on the way."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
import common
import unit1  # noqa: F401
import unit2  # noqa: F401

OUT = os.path.join(os.path.dirname(__file__), "..", "..", "content", "math", "questions")
os.makedirs(OUT, exist_ok=True)
n1 = common.write(os.path.join(OUT, "unit1-algebra2-review.json"), {"m1-linear", "m1-quadratics", "m1-exponents", "m1-logs"})
n2 = common.write(os.path.join(OUT, "unit2-functions.json"), {"m2-domain-range", "m2-composition", "m2-inverses", "m2-polynomials", "m2-rational", "m2-transformations"})
from collections import Counter
print(f"unit 1: {n1} questions, unit 2: {n2} questions")
print(dict(Counter(q["topic_id"] for q in common.QUESTIONS)))
prompts = [q["prompt"] + str(q["graph"]) for q in common.QUESTIONS]
dups = [p for p, c in Counter(prompts).items() if c > 1]
assert not dups, f"duplicate prompts: {dups[:3]}"
