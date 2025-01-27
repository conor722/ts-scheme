import {expect, test} from "vitest";
import {interpret} from "./interpreter";
import {parse} from "./parse";

test("evaluates a basic expression", () => {
    expect(
        interpret(
            parse("(begin (define r 10) (* pi (* r r)))")
        )
    ).closeTo(314.159, 0.001);
});

test("evaluates a multiple conditional", () => {
    expect(
        interpret(
            parse("(begin (cond((= 1 2) 3) ((= 4 4) 2)))")
        )
    ).toEqual(2);
});

test("evaluates a multiple conditional with an else clause", () => {
    expect(
        interpret(
            parse("(begin (cond((= 1 2) 3) ((= 4 3) 2) (else 9)))")
        )
    ).toEqual(9);
});

test("creates a list", () => {
    expect(interpret(parse("(begin (list 1 2 3 4))"))).toEqual([1, 2, 3, 4]);
});

test("does not require an outer begin wrapper", () => {
    expect(interpret(parse("(list 1 2 3 4)"))).toEqual([1, 2, 3, 4]);
});

test("runs a function defined in code", () => {
    expect(interpret(parse("(begin (define (add-1 x) (+ 1 x)) (add-1 4))"))).toEqual(5);
});

test("runs a recursive function defined in code", () => {
    expect(interpret(parse("(begin (define (fib n)" +
        "  (cond ((= n 1) 1) ((= n 0) 1) (else (+ (fib (- n 1)) (fib (- n 2))))))" +
        "(fib 3))"))).toEqual(3);
});

test("handles a string literal", () => {
    expect(interpret(parse("(begin \"hello world\")"))).toEqual("hello world");
});
