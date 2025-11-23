import { expect, test } from "vitest";
import { parse } from "./parse";

test("converts the string into a list of scheme objects", () => {
  const result = parse("(define r 10) (* pi (* r r))");

  // Check structure - identifiers are now wrapped with source location metadata
  expect(result[0]).toBe("begin");
  expect(Array.isArray(result[1])).toBe(true);
  expect(Array.isArray(result[2])).toBe(true);

  // Check the define expression
  const defineExpr = result[1] as any[];
  expect(defineExpr[0]).toMatchObject({
    __type: "identifier",
    value: "define",
  });
  expect(defineExpr[1]).toMatchObject({ __type: "identifier", value: "r" });
  expect(defineExpr[2]).toBe(10);

  // Check the multiply expression
  const multiplyExpr = result[2] as any[];
  expect(multiplyExpr[0]).toMatchObject({ __type: "identifier", value: "*" });
  expect(multiplyExpr[1]).toMatchObject({ __type: "identifier", value: "pi" });

  // Check nested multiply
  const nestedMultiply = multiplyExpr[2] as any[];
  expect(nestedMultiply[0]).toMatchObject({ __type: "identifier", value: "*" });
  expect(nestedMultiply[1]).toMatchObject({ __type: "identifier", value: "r" });
  expect(nestedMultiply[2]).toMatchObject({ __type: "identifier", value: "r" });
});
