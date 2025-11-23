import { SourceLocation } from "./parse";

export class SchemeError extends Error {
  sourceLocation?: SourceLocation;

  constructor(message: string, sourceLocation?: SourceLocation) {
    if (sourceLocation) {
      super(
        `${message}\n  at line ${sourceLocation.lineNumber}: ${sourceLocation.line}`
      );
    } else {
      super(message);
    }
    this.name = "SchemeError";
    this.sourceLocation = sourceLocation;
  }
}

/**
 * Helper function to extract source location from a scheme object
 */
export const getSourceLocation = (obj: any): SourceLocation | undefined => {
  if (obj && typeof obj === "object" && "__sourceLocation" in obj) {
    return obj.__sourceLocation;
  }
  return undefined;
};
