import {tokenise} from "./tokenise";
import {expect, test} from "vitest";

test("converts the string into a list of tokens", () => {
    expect(tokenise("(begin (define r 10) (* pi (* r r)))")).toEqual(
        ["(", "begin", "(", "define", "r", "10", ")", "(", "*", "pi", "(", "*", "r", "r", ")", ")", ")"]);

});

test("handles weird whitespace", () => {
    expect(tokenise("(   begin    (define r 10    )  (*    pi (*   r r   )))")).toEqual(
        ["(", "begin", "(", "define", "r", "10", ")", "(", "*", "pi", "(", "*", "r", "r", ")", ")", ")"]);

});