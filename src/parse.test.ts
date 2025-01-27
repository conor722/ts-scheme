import {expect, test} from "vitest";
import {parse} from "./parse";

test("converts the string into a list of scheme objects", () => {
    expect(parse("(define r 10) (* pi (* r r))")).toEqual(
        ["begin", ["define", "r", 10], ["*", "pi", ["*", "r", "r"]]]);
});
