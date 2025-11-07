import {tokeniseLine} from "./tokenise";
import {describe, expect, test} from "vitest";

describe("tokeniseLine", () => {
    test("converts the string into a list of tokens", () => {
        expect(tokeniseLine("(begin (define r 10) (* pi (* r r)))")).toEqual(
            ["(", "begin", "(", "define", "r", "10", ")", "(", "*", "pi", "(", "*", "r", "r", ")", ")", ")"]);

    });

    test("handles weird whitespace", () => {
        expect(tokeniseLine("(   begin    (define r 10    )  (*    pi (*   r r   )))")).toEqual(
            ["(", "begin", "(", "define", "r", "10", ")", "(", "*", "pi", "(", "*", "r", "r", ")", ")", ")"]);
    });
});
