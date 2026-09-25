"""
Helpers for writing the IB Extended Math question bank.

Every question's answer is checked with sympy when the file is built, so a wrong key fails the build
instead of teaching Sachin something false. Run:  python3 scripts/math-bank/build.py
Then `npm test` checks every answer against the app's own grader (scripts/test-bank.ts).
"""
import json
import sympy as sp

x, y = sp.symbols("x y", real=True)
QUESTIONS = []


from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application, convert_xor

_TR = standard_transformations + (implicit_multiplication_application, convert_xor)


def S(s):
    """Parse a sympy expression written in the app's answer syntax (^ and implicit multiplication allowed)."""
    s = s.replace("inf", "oo")
    return parse_expr(s, local_dict={"x": x, "y": y, "sqrt": sp.sqrt, "cbrt": lambda v: sp.real_root(v, 3), "log": sp.log}, transformations=_TR)


def check(cond, msg):
    if not cond:
        raise AssertionError("Answer check failed: " + msg)


def same(a, b):
    return sp.simplify(S(a) - S(b)) == 0 if isinstance(a, str) else sp.simplify(a - S(b)) == 0


def q(topic, prompt, answer, kind="number", tex=None, hint=None, expl=None, diff=2, calc="no-calc", accept=None,
      domain=None, wrong=None, graph=None, qtype="math", choices=None, placeholder=None, form=None, extra_meta=None):
    meta = None
    if qtype == "math":
        meta = {"kind": kind}
        if tex:
            meta["answer_tex"] = tex
        if accept:
            meta["accept"] = accept
        if domain:
            meta["domain"] = domain
        if placeholder:
            meta["placeholder"] = placeholder
        if form:
            meta["form"] = form
    if extra_meta:
        meta = {**(meta or {}), **extra_meta}
    if qtype == "mcq":
        check(choices and answer in choices, f"MCQ answer not among choices: {prompt[:60]}")
        check(len(set(choices)) == len(choices), f"duplicate choices: {prompt[:60]}")
    QUESTIONS.append({
        "topic_id": topic,
        "qtype": qtype,
        "prompt": prompt,
        "choices": choices,
        "answer": answer,
        "meta": meta,
        "graph": graph,
        "calc": calc,
        "hint": hint,
        "explanation": expl,
        "difficulty": diff,
        # Not stored: wrong answers the grader must reject (checked by scripts/test-bank.ts).
        "wrong": wrong or [],
    })


def sketch(topic, prompt, desmos, checklist, graph, expl, hint=None, diff=3):
    QUESTIONS.append({
        "topic_id": topic,
        "qtype": "sketch",
        "prompt": prompt,
        "choices": None,
        "answer": "got-it",
        "meta": {"desmos": desmos, "checklist": checklist},
        "graph": graph,
        "calc": "no-calc",
        "hint": hint,
        "explanation": expl,
        "difficulty": diff,
        "wrong": [],
    })


def win(lo=-10, hi=10, step=None, **kw):
    g = {"xmin": lo, "xmax": hi, "ymin": lo, "ymax": hi, "curves": []}
    if step:
        g["step"] = step
    g.update(kw)
    return g


def fn_graph(expr, lo=-10, hi=10, asym=None, dots=None, arrows="both", step=None, frm=None, to=None):
    c = {"fn": expr, "arrows": arrows}
    if frm is not None:
        c["from"] = frm
    if to is not None:
        c["to"] = to
    g = win(lo, hi, step, curves=[c])
    if asym:
        g["asymptotes"] = asym
    if dots:
        g["dots"] = dots
    return g


def write(path, topics):
    out = [{k: v for k, v in qq.items()} for qq in QUESTIONS if qq["topic_id"] in topics]
    with open(path, "w") as f:
        f.write("[\n" + ",\n".join("  " + json.dumps(o, ensure_ascii=False) for o in out) + "\n]\n")
    return len(out)
