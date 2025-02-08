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

test("if (false branch)", () => {
    expect(interpret(parse("(if (= 1 2) \"Yes\" \"No\")"))).toEqual("No");
});

test("if (true branch)", () => {
    expect(interpret(parse("(if (= 1 1) \"Yes\" \"No\")"))).toEqual("Yes");
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

test("apply", () => {
    expect(interpret(parse("(apply + (list 1 2 3 4))"))).toEqual(10);
});

test("handles rest arguments", () => {
    expect(interpret(parse("(begin (define (contrived-list . args) (apply list args)) (contrived-list 1 2 3 4))"))).toEqual([1, 2, 3, 4]);
});

test("sqrt", () => {
    expect(interpret(parse("(define (square x) (* x x))" +
        "(define (sqrt x)" +
        "  (define (average lhs rhs)" +
        "    (/ (+ lhs rhs) 2))" +
        "  (define (good-enough? guess)" +
        "    (< (abs (- (square guess) x)) .0001))" +
        "  (define (improve guess)" +
        "    (average guess (/ x guess)))" +
        "  (define (try guess)" +
        "    (if (good-enough? guess)" +
        "guess" +
        "(try (improve guess))))" +
        "  (try 1))" +
        "(sqrt 25)"))).closeTo(5, 0.0001);
});

test("let", () => {
    expect(interpret(parse("(let ((a 3)) a)"))).toEqual(3);
});

test("lambda", () => {
    expect(interpret(parse("((lambda (x) (* x x)) 3)"))).toEqual(9);
});

test("lambda as an argument", () => {
    expect(interpret(parse("(apply (lambda (x y z) (+ x y z)) (list 1 2 3))"))).toEqual(6);
});

test("lambda as a returned value", () => {
    expect(interpret(parse("(define (add-x x) (lambda (y) (+ x y))) ((add-x 4) 5)"))).toEqual(9);
});

test("map", () => {
    expect(interpret(parse("(define (map fn args)(cond ((empty? args) (list)) (else (push-left (map fn (cdr args)) (fn (car args))))))" +
        "(map (lambda (x) (* x x)) (list 1 2 3 4))"))).toEqual([1, 4, 9, 16]);
});
