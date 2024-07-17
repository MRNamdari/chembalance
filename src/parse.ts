import solve from "./solver.ts";
import state from "./state.ts";
import type {
  AbstractToken,
  ComputationEvent,
  ElementName,
  Match,
} from "./types.ts";

const subscript = new Map(
    Object.entries({
      0: "₀",
      1: "₁",
      2: "₂",
      3: "₃",
      4: "₄",
      5: "₅",
      6: "₆",
      7: "₇",
      8: "₈",
      9: "₉",
      ".": ".",
    })
  ),
  superscript = new Map(
    Object.entries({
      "0": "⁰",
      "1": "¹",
      "2": "²",
      "3": "³",
      "4": "⁴",
      "5": "⁵",
      "6": "⁶",
      "7": "⁷",
      "8": "⁸",
      "9": "⁹",
      ".": "·",
    })
  ),
  chargescript = "⁻⁺",
  _default: symbol = Symbol("COEFF");

/**
 * Converts a number to its superscript representation, including a charge symbol if applicable.
 *
 * @param {number} n - The number to convert.
 * @returns {string} The superscript representation of the number with an optional charge symbol.
 *
 * @example
 * console.log(num2super(2));     // Output: "⁺²"
 * console.log(num2super(-5)); // Output: "⁻⁵"
 */
function num2super(n: number) {
  let charge;
  if (n > 0) charge = 1;
  if (n < 0) charge = 0;

  return `${charge != undefined ? chargescript[charge] : ""}${n
    .toString()
    .split("")
    .map((d) => superscript.get(d))
    .join("")}`;
}

/**
 * Converts a number to its subscript representation.
 *
 * @param {number} n - The number to convert.
 * @returns {string} The subscript representation of the number.
 *
 * @example
 * console.log(num2sub(123));    // Output: "₁₂₃"
 */
function num2sub(n: number) {
  return `${n
    .toString()
    .split("")
    .map((d) => subscript.get(d))
    .join("")}`;
}

/**
 * Ensures the provided abstract syntax tree (AST) representing an equation
 * contains exactly one "YIELD" element.
 *
 * @param {Match[]} ast - The AST representing the equation.
 * @throws {SyntaxError} Thrown if the equation doesn't have exactly one "YIELD" element.
 */
function mustHaveOneYield(ast: Match[]) {
  // Initialize variables to track index and potential error
  let index = -1;
  let err: SyntaxError | undefined;

  // Use a switch statement with a single condition (true) to simplify logic
  switch (true) {
    // Case 1: No "YIELD" found
    case (index = ast.findIndex((e) => "YIELD" in e)) === -1:
      // Create a SyntaxError with a descriptive message
      err = new SyntaxError('Equation must have one yield "⇒"');
      break;

    // Case 2: More than one "YIELD" found
    case ast.findLastIndex((e) => "YIELD" in e) !== index:
      // Create a SyntaxError with a descriptive message
      err = new SyntaxError('Equation must have only one yield "⇒"');
      break;
  }

  // If an error was found, dispatch a custom event and re-throw the error
  if (err) {
    document.dispatchEvent(new CustomEvent("syntaxerror", { detail: err }));
    throw err;
  }
}

/**
 * Ensures that two arrays of abstract tokens representing chemical compounds
 * contain the same elements (excluding charges).
 *
 * @param {AbstractToken[]} left - The array of abstract tokens representing the left-hand side.
 * @param {AbstractToken[]} right - The array of abstract tokens representing the right-hand side.
 * @throws {SyntaxError} Thrown if the elements on both sides are not the same.
 */
function mustHaveTheSameElements(
  left: AbstractToken[],
  right: AbstractToken[]
) {
  // Prepare a SyntaxError to throw if elements don't match
  let err = new SyntaxError("Elements on both sides must be the same");

  // Create sets to store elements from each side, ignoring charges
  const elementsLeft = new Set<ElementName>();
  const elementsRight = new Set<ElementName>();

  for (const comp of left) {
    Object.keys(comp)
      .filter((key) => key !== "CHARGE") // Exclude "CHARGE" property
      .forEach((elementName) => elementsLeft.add(elementName));
  }

  for (const comp of right) {
    Object.keys(comp)
      .filter((key) => key !== "CHARGE")
      .forEach((elementName) => elementsRight.add(elementName));
  }

  // Check if elements match by trying to remove elements from the right set
  // If any element cannot be removed, it means elements don't match
  let mismatchFound = false;
  for (const element of elementsLeft) {
    mismatchFound = !elementsRight.delete(element);
    if (mismatchFound) break;
  }

  // If any elements remain in the right set after removal attempts, it also indicates a mismatch
  if (elementsRight.size > 0) mismatchFound = true;

  // If a mismatch was found, dispatch a custom event and throw the error
  if (mismatchFound) {
    document.dispatchEvent(new CustomEvent("syntaxerror", { detail: err }));
    throw err;
  }
}

/**
 * Ensures that the provided arrays of abstract tokens representing chemical compounds
 * contain at most one token with a default coefficient, which serves as a reference for
 * other compounds' coefficients.
 *
 * @param {AbstractToken[]} left - The array of abstract tokens representing the left-hand side.
 * @param {AbstractToken[]} right - The array of abstract tokens representing the right-hand side.
 * @throws {SyntaxError} Thrown if the equation has more than one token with a default coefficient.
 */
function mustHaveLessThanTwoCoefficient(
  left: AbstractToken[],
  right: AbstractToken[]
) {
  // Initialize a counter to track tokens with the default coefficient
  let count = 0;

  // Define a helper function to increment the counter for tokens with the default coefficient
  function checkCoefficient(token: AbstractToken) {
    // Check if the token has the symbol representing the default coefficient
    if (token[_default]) {
      // Increment the counter only if the token has the default coefficient
      count++;
    }
  }

  // Apply the helper function to each token in both arrays
  left.forEach(checkCoefficient);
  right.forEach(checkCoefficient);

  // Prepare a SyntaxError to throw if there are more than one token with the default coefficient
  const err = new SyntaxError(
    "Equation must have zero or one formula with default coefficient."
  );

  // Check if the count exceeds the allowed limit and throw an error if necessary
  if (count > 1) {
    document.dispatchEvent(new CustomEvent("syntaxerror", { detail: err }));
    throw err;
  }
}

/**
 * Converts a formula object within the AST (representing a compound) to a human-readable string.
 * Handles nested parentheses for sub-formulas based on the `main` flag.
 *
 * @param {Match} ast - The formula object (typically with "BRACKET" property)
 * @param {boolean} main - Flag indicating whether the formula is the primary one (affects parentheses)
 * @returns {string} The string representation of the formula.
 *
 * @example
 * const formula = { BRACKET: [{ ELEMENT: "H" }, { ELEMENT: "2", COUNT: 2 }],  COUNT: 3 };
 * const str = stringifyFormula(formula);
 * console.log(str); // Output: "(H₂O)₃" (assuming main is true)
 */
function stringifyFormula(ast: Match, main = true) {
  let { CHARGE = 0, COUNT = 1, BRACKET } = ast;
  let str = "";
  if (typeof BRACKET === "object") {
    for (let obj of BRACKET) {
      if ("ELEMENT" in obj) {
        str += stringifyElement(obj);
      }
      if ("BRACKET" in obj) {
        if (obj.COUNT)
          // Handle nested formula with parentheses based on `main` flag
          str += `(${stringifyFormula(obj, false)})${
            obj.COUNT != 1 ? num2sub(obj.COUNT) : ""
          }`;
      }
    }
  }
  // Combine coefficient, formula string, and charge with conditional formatting
  return `${main && COUNT != 1 ? COUNT : ""}${str}${
    CHARGE ? num2super(CHARGE) : ""
  }`;
}

/**
 * Converts an element object within the AST to a human-readable string,
 * including its symbol and optional coefficient and charge.
 *
 * @param {Match} ast - The element object (token with "ELEMENT" property)
 * @returns {string} The string representation of the element.
 *
 * @example
 * const element = { ELEMENT: "O", COUNT: 2, CHARGE: -1 };
 * const str = stringifyElement(element);
 * console.log(str); // Output: "O₂⁻"
 */
function stringifyElement(ast: Match) {
  let { CHARGE = 0, COUNT = 1, ELEMENT } = ast;

  // Combine element symbol, coefficient, and charge with conditional formatting
  return `${ELEMENT}${COUNT != 1 ? num2sub(COUNT) : ""}${
    CHARGE ? num2super(CHARGE) : ""
  }`;
}

/**
 * Extracts the operator string from an AST object representing an operator
 * (e.g., "YIELD" or "SUM").
 *
 * @param {Match} ast - The operator object (token with "YIELD" or "SUM" property)
 * @returns {string} The operator symbol (e.g., "⇒" or "+" depending on the object type).
 *
 * @example
 * const yieldObj = { YIELD: "⇒" };
 * const yieldStr = stringifyOperator(yieldObj);
 * console.log(yieldStr); // Output: "⇒"
 */
function stringifyOperator(ast: Match) {
  // Extract and return the value associated with "YIELD" or "SUM" property
  return Object.values(ast).pop();
}

/**
 * Formats a free charge object within the AST into a string,
 * including the "e" symbol and superscript charge representation.
 *
 * @param {Match} ast - The free charge object (token with "FREE_CHARGE" property)
 * @returns {string} The string representation of the free charge (e.g., "+e¹").
 *
 * @example
 * const freeCharge = { FREE_CHARGE: -1 };
 * const str = stringifyFreeCharge(freeCharge);
 * console.log(str); // Output: "+e⁻¹"
 */
function stringifyFreeCharge(ast: Match) {
  if (!ast.FREE_CHARGE) return "";
  return `+e${num2super(ast.FREE_CHARGE)}`;
}

/**
 * Finds the index of the first element in an abstract syntax tree (AST)
 * that contains the "YIELD" property, indicating a yield symbol in a chemical equation.
 *
 * @param {Match[]} ast - The array representing the AST.
 * @returns {number} The index of the first element with "YIELD", or -1 if not found.
 */
function indexOfYield(ast: Match[]): number {
  // Use the `findIndex` method to efficiently locate the element with "YIELD"
  return ast.findIndex((element) => "YIELD" in element);
}

/**
 * Simplifies a chemical compound representation by:
 * - Converting element names and their coefficients to abstract token format (object).
 * - Handling nested brackets with recursive calls and appropriate coefficient adjustments.
 * - Combining like terms based on element names.
 * - Merging charges from different parts of the compound.
 *
 * @param {Match} token - The token representing the compound to be simplified.
 * @param {boolean} branch - Internal flag used for handling nested bracket coefficients.
 * @returns {AbstractToken | void} The simplified abstract token representing the compound.
 */
function simplifyCompound(token: Match, branch = false) {
  // Create an empty abstract token object to store the simplified representation
  const abstract: AbstractToken = { CHARGE: 0 };

  // Handle different cases based on the token type:

  // Case 1: "ELEMENT" token - Extract element name and coefficient, set charge
  switch (true) {
    case "ELEMENT" in token:
      const element = token["ELEMENT"]!; // Extract element name (assume non-null)
      abstract[element] = token.COUNT || 1; // Set coefficient (default to 1)
      abstract.CHARGE = token.CHARGE || 0; // Set charge (default to 0)
      break;

    // Case 2: "BRACKET" token - Handle nested compounds and coefficients
    case "BRACKET" in token:
      // If BRACKET is not nested then its coefficient is default coefficient
      if (!branch && token.COUNT) abstract[_default] = token.COUNT;
      const count = branch ? token.COUNT || 1 : 1; // Adjust coefficient for branches
      abstract.CHARGE = token.CHARGE || 0; // Set charge (default to 0)

      // If BRACKET is an array (nested compounds), recursively simplify each element
      if (Array.isArray(token.BRACKET)) {
        for (let item of token.BRACKET) {
          const abs = simplifyCompound(item, true); // Recursive call with branch flag
          for (let elm in abs) {
            // Skip "CHARGE" property, combine coefficients for other elements
            if (elm === "CHARGE") continue;
            if (abstract[elm] === undefined) {
              abstract[elm] = count * abs[elm]; // Set new coefficient
            } else {
              abstract[elm] += count * abs[elm]; // Add coefficients
            }
          }
        }
      }
      break;

    // Case 3: "FREE_CHARGE" token - Set the overall charge
    case "FREE_CHARGE" in token:
      abstract.CHARGE = token.FREE_CHARGE!; // Extract and set charge
      break;

    // Default: Ignore other token types
    default:
      return;
  }

  // Return the simplified abstract token
  return abstract;
}

/**
 * Constructs the matrices A and B for a system of linear equations that represents
 * a chemical equation balancing problem.
 *
 * @param {AbstractToken[]} left - Abstract tokens for compounds on the left side of the equation.
 * @param {AbstractToken[]} right - Abstract tokens for compounds on the right side of the equation.
 * @returns {[Array<Array<number>>, Array<Array<number>>]} A tuple containing the matrices A and B.
 */
function makeAandB(
  left: AbstractToken[],
  right: AbstractToken[]
): [Array<Array<number>>, Array<Array<number>>] {
  // 1. Extract unique elements and default coefficient information:
  const elementsSet = new Set<ElementName>(); // Store unique element names
  let index = 0,
    coeff = 1; // Track index and coefficient of the default compound

  function extractElementsAndDefault(token: AbstractToken, i: number) {
    Object.keys(token).forEach((k) => elementsSet.add(k)); // Add all elements from the token
    if (token[_default]) {
      // If it's the default compound:
      index = i;
      coeff = token[_default];
    }
  }

  [...left, ...right].forEach(extractElementsAndDefault);

  // 2. Create matrices A and B based on elements and coefficients:
  const numEquations = elementsSet.size;
  const numUnknowns = left.length + right.length;
  const elements = [...elementsSet];

  const A = new Array<Array<number>>(numEquations + 1);
  const B = new Array<Array<number>>(numEquations + 1).fill([0]);

  const nle = left.length; // number of elements on the left
  const nre = right.length; // number of elements on the right

  for (let i = 0; i < numEquations + 1; i++) {
    A[i] = new Array(numUnknowns).fill(0);
    for (let j = 0; j < nle; j++) {
      A[i][j] = left[j][elements[i]] || 0; // Fill coefficients for left-side compounds
    }
    for (let j = nle; j < nle + nre; j++) {
      A[i][j] = -right[j - nle][elements[i]] || 0; // Fill coefficients for right-side compounds (negative)
    }
  }

  // 3. Add equation to ensure a unique solution for the default coefficient:
  A[numEquations][index] = 1;
  B[numEquations] = [coeff];

  return [A, B];
}

/**
 * Scans a chemical equation string and parses it into an AST (Abstract Syntax Tree).
 * Uses regular expressions to identify various elements, coefficients, charges, and operators.
 *
 * @param {string} str - The chemical equation string to be parsed.
 * @returns {Match[]} An array of objects representing the parsed AST.
 *
 * @example
 * const equation = "2*[H 2*O] + [O*2] ⇒ [H*2 O]";
 * const ast = scan(equation);
 * console.log(ast);
 * // Output: Array representing the parsed AST structure
 */
export function scan(str: string) {
  // Define regular expression pattern for matching different elements
  const NumberPattern = "[\\+\\-]?\\s*[0-9]*\\s*[.]{0,1}\\s*[0-9]+";

  // Capture groups for different components:
  const regex = new RegExp(
    "(?<SUM>[\\+])" +
      "|" +
      "(?:" +
      `(?:\\s*(?<FRM_MULT_A>${NumberPattern})\\s*\\*\\s*)?` +
      "\\[" +
      `(?<BRACKET>[\\w\\s\\d\\*\\[\\]\\.]*)` +
      "\\]" +
      `(?:\\s*\\*\\s*\\+{0,1}\\s*(?<FRM_MULT_B>${NumberPattern})\s*)?` +
      `(?:\\s*\\^\\s*(?<FRM_CHARGE>${NumberPattern})\\s*)?` +
      ")" +
      "|" +
      "(?:" +
      `(?:\\s*(?<ELM_MULT_A>${NumberPattern})\\s*\\*\\s*)?` +
      "(?<ELEMENT>[A-Z][a-z]?)" +
      `(?:\\s*\\*\\s*\\+{0,1}\\s*(?<ELM_MULT_B>${NumberPattern})\\s*)?` +
      `(?:\\s*\\^\\s*(?<ELM_CHARGE>${NumberPattern})\\s*)` +
      "?)" +
      "|" +
      `(?<FREE_CHARGE>${NumberPattern})` +
      "|" +
      "(?<YIELD>[⇒])",
    "gim"
  );

  let m: RegExpExecArray | null;
  let n = 0;
  const matches: Match[] = [];

  // Iterate through matches using the regular expression
  while ((m = regex.exec(str)) !== null) {
    // Handle potential infinite loop caused by zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    const match: Match = {};
    if (m.groups) {
      // Extract values from captured groups and handle potential conflicts
      for (let [group_name, value] of Object.entries(m.groups)) {
        const key = group_name
          .replace(/(ELM|FRM)_/g, "") // Remove prefixes
          .replace(/MULT_(A|B)/g, "COUNT") as keyof Match; // Convert to "COUNT"

        if (value) {
          const res = /COUNT|CHARGE/g.test(key) // Check if key is count or charge
            ? Number(value.replace(/\s*/g, "")) // Convert to number (removing spaces)
            : value;

          const preVal = match[key];
          if (typeof preVal === "number") {
            Object.assign(match, { [key]: preVal * (res as number) }); // Multiply existing value if number
          } else if (preVal === undefined) {
            Object.assign(match, { [key]: res }); // Assign value if not already set
          }
        }
      }
    }

    if ("BRACKET" in match && match.BRACKET!.length > 2) {
      match.BRACKET = scan(match.BRACKET as string);
    }
    matches.push(match);
    n++;
  }
  return matches;
}

/**
 * Computes the coefficients for a balanced chemical equation represented by an AST.
 * Performs various checks, simplifications, matrix generation, and solution steps.
 *
 * @param {Match[]} ast - The AST representing the chemical equation.
 *
 * @example
 * const ast = [
 *   { ELEMENT: "H", COUNT: 2 },
 *   { SUM: "+" },
 *   { ELEMENT: "O" COUNT: 2 },
 *   { YIELD: "⇒" },
 *   { BRACKET: [
 *      { ELEMENT: "H", COUNT: 2 },
 *      { ELEMENT: "O" COUNT: 2 },
 *    ]},
 * ];
 * compute(ast);
 */
export function compute(ast: Array<Match>) {
  // 1. Ensure exactly one yield symbol:
  mustHaveOneYield(ast);

  // 2. Find the index of the yield symbol:
  const index = indexOfYield(ast);

  // 3. Create a mapping dictionary for simplified compounds:
  const remap: { [index: number]: AbstractToken | undefined } = {};
  function abstract(tok: Match, index: number) {
    remap[index] = simplifyCompound(tok);
    return remap[index];
  }

  // 4. Simplify and map each element of the AST:
  const mappedAST = ast.map(abstract);

  // 5. Separate left and right sides based on the yield index:
  const leftTokens = mappedAST
    .slice(0, index)
    .filter((t) => t) as AbstractToken[];
  const rightTokens = mappedAST
    .slice(index + 1, ast.length)
    .filter((t) => t) as AbstractToken[];

  // 6. Ensure left and right sides have the same elements:
  mustHaveTheSameElements(leftTokens, rightTokens);

  // 7. Ensure at most one default coefficient:
  mustHaveLessThanTwoCoefficient(leftTokens, rightTokens);

  // 8. Generate matrices A and B for the system of linear equations:
  const [A, B] = makeAandB(leftTokens, rightTokens);

  // 9. Solve the system of linear equations for coefficients:
  const coeffs = solve(A, B).map((c) => Math.round(c * 1e4) / 1e4);

  // 10. Update original token coefficients:
  [...leftTokens, ...rightTokens].forEach((t, i) => (t.COEFF = coeffs[i]));

  // 11. Update original AST with computed coefficients:
  for (let [index, token] of Object.entries(remap)) {
    const idx = parseInt(index);
    if (token) {
      const tok = ast[idx];
      if (tok && tok.FREE_CHARGE) {
        tok.FREE_CHARGE *= token.COEFF;
      } else {
        tok.COUNT = token.COEFF;
      }
    }
  }

  // 12. Set and dispatch the computed equation string:
  state.setResult(stringify(ast));
  document.dispatchEvent(
    new CustomEvent("computation", {
      detail: stringify(ast),
    } satisfies ComputationEvent["Init"])
  );
}

/**
 * Converts an abstract syntax tree (AST) representing a chemical equation into a human-readable string.
 *
 * @param {Match[]} ast - The AST to be stringified.
 * @returns {string} The string representation of the chemical equation.
 *
 * @example
 * const ast = [
 *   { ELEMENT: "H", COUNT: 2 },
 *   { SUM: "+" },
 *   { ELEMENT: "O" COUNT: 2 },
 *   { YIELD: "⇒" },
 *   { BRACKET: [
 *      { ELEMENT: "H", COUNT: 2 },
 *      { ELEMENT: "O" COUNT: 2 },
 *    ]},
 * ];
 * const equationString = stringify(ast);
 * console.log(equationString); // Output: "H₂ + O₂ ⇒ H₂O"
 */
export function stringify(ast: Match[]) {
  let txt = "";
  for (let obj of ast) {
    switch (true) {
      case "BRACKET" in obj:
        txt += stringifyFormula(obj);
        break;
      case "ELEMENT" in obj:
        txt += stringifyElement(obj);
        break;
      case "FREE_CHARGE" in obj:
        txt += stringifyFreeCharge(obj);
        break;
      case "YIELD" in obj:
      case "SUM" in obj:
        txt += stringifyOperator(obj);
    }
    txt += " ";
  }

  return txt;
}
