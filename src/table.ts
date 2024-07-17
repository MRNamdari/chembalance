import { compute, scan } from "./parse.ts";
import { TYPE } from "./types.ts";
import type {
  IState,
  Table,
  TableCell,
  TableConsole,
  TableElement,
  TableItem,
  TableKey,
  TableOutput,
  TableShift,
} from "./types.ts";

export const table: Table = {
  0: {
    0: { key: "H", type: TYPE.ELEMENT },
    1: {
      key: "⇧",
      cbFn: (_) => _.setShift(!_.shift),
      type: TYPE.SHIFT,
    },
    2: { type: TYPE.CONSOLE },
    3: undefined,
    4: undefined,
    5: undefined,
    6: undefined,
    7: undefined,
    8: undefined,
    9: undefined,
    10: undefined,
    11: undefined,
    12: undefined,
    13: undefined,
    14: undefined,
    15: undefined,
    16: undefined,
    17: { key: "He", type: TYPE.ELEMENT },
  },
  1: {
    0: { key: "Li", type: TYPE.ELEMENT },
    1: { key: "Be", type: TYPE.ELEMENT },
    2: { type: TYPE.OUTPUT },
    3: undefined,
    4: undefined,
    5: undefined,
    6: undefined,
    7: undefined,
    8: undefined,
    9: undefined,
    10: undefined,
    11: undefined,
    12: { key: "B", type: TYPE.ELEMENT },
    13: { key: "C", type: TYPE.ELEMENT },
    14: { key: "N", type: TYPE.ELEMENT },
    15: { key: "O", type: TYPE.ELEMENT },
    16: { key: "F", type: TYPE.ELEMENT },
    17: { key: "Ne", type: TYPE.ELEMENT },
  },
  2: {
    0: { key: "Na", type: TYPE.ELEMENT },
    1: { key: "Mg", type: TYPE.ELEMENT },
    2: undefined,
    3: undefined,
    4: undefined,
    5: undefined,
    6: undefined,
    7: undefined,
    8: undefined,
    9: undefined,
    10: undefined,
    11: undefined,
    12: { key: "Al", type: TYPE.ELEMENT },
    13: { key: "Si", type: TYPE.ELEMENT },
    14: { key: "P", type: TYPE.ELEMENT },
    15: { key: "S", type: TYPE.ELEMENT },
    16: { key: "Cl", type: TYPE.ELEMENT },
    17: { key: "Ar", type: TYPE.ELEMENT },
  },
  3: {
    0: { key: "K", type: TYPE.ELEMENT },
    1: { key: "Ca", type: TYPE.ELEMENT },
    2: { key: "Sc", type: TYPE.ELEMENT },
    3: { key: "Ti", type: TYPE.ELEMENT },
    4: { key: "V", type: TYPE.ELEMENT },
    5: { key: "Cr", type: TYPE.ELEMENT },
    6: { key: "Mn", type: TYPE.ELEMENT },
    7: { key: "Fe", type: TYPE.ELEMENT },
    8: { key: "Co", type: TYPE.ELEMENT },
    9: { key: "Ni", type: TYPE.ELEMENT },
    10: { key: "Cu", type: TYPE.ELEMENT },
    11: { key: "Zn", type: TYPE.ELEMENT },
    12: { key: "Ga", type: TYPE.ELEMENT },
    13: { key: "Ge", type: TYPE.ELEMENT },
    14: { key: "As", type: TYPE.ELEMENT },
    15: { key: "Se", type: TYPE.ELEMENT },
    16: { key: "Br", type: TYPE.ELEMENT },
    17: { key: "Kr", type: TYPE.ELEMENT },
  },
  4: {
    0: { key: "Rb", type: TYPE.ELEMENT },
    1: { key: "Sr", type: TYPE.ELEMENT },
    2: { key: "Y", type: TYPE.ELEMENT },
    3: { key: "Zr", type: TYPE.ELEMENT },
    4: { key: "Nb", type: TYPE.ELEMENT },
    5: { key: "Mo", type: TYPE.ELEMENT },
    6: { key: "Tc", type: TYPE.ELEMENT },
    7: { key: "Ru", type: TYPE.ELEMENT },
    8: { key: "Rh", type: TYPE.ELEMENT },
    9: { key: "Pd", type: TYPE.ELEMENT },
    10: { key: "Ag", type: TYPE.ELEMENT },
    11: { key: "Cd", type: TYPE.ELEMENT },
    12: { key: "In", type: TYPE.ELEMENT },
    13: { key: "Sn", type: TYPE.ELEMENT },
    14: { key: "Sb", type: TYPE.ELEMENT },
    15: { key: "Te", type: TYPE.ELEMENT },
    16: { key: "I", type: TYPE.ELEMENT },
    17: { key: "Xe", type: TYPE.ELEMENT },
  },
  5: {
    0: { key: "Cs", type: TYPE.ELEMENT },
    1: { key: "Ba", type: TYPE.ELEMENT },
    2: { key: "La", type: TYPE.ELEMENT },
    3: { key: "Hf", type: TYPE.ELEMENT },
    4: { key: "Ta", type: TYPE.ELEMENT },
    5: { key: "W", type: TYPE.ELEMENT },
    6: { key: "Re", type: TYPE.ELEMENT },
    7: { key: "Os", type: TYPE.ELEMENT },
    8: { key: "Ir", type: TYPE.ELEMENT },
    9: { key: "Pt", type: TYPE.ELEMENT },
    10: { key: "Au", type: TYPE.ELEMENT },
    11: { key: "Hg", type: TYPE.ELEMENT },
    12: { key: "Tl", type: TYPE.ELEMENT },
    13: { key: "Pb", type: TYPE.ELEMENT },
    14: { key: "Bi", type: TYPE.ELEMENT },
    15: { key: "Po", type: TYPE.ELEMENT },
    16: { key: "At", type: TYPE.ELEMENT },
    17: { key: "Rn", type: TYPE.ELEMENT },
  },
  6: {
    0: { key: "Fr", type: TYPE.ELEMENT },
    1: { key: "Ra", type: TYPE.ELEMENT },
    2: { key: "Ac", type: TYPE.ELEMENT },
    3: { key: "Rf", type: TYPE.ELEMENT },
    4: { key: "Db", type: TYPE.ELEMENT },
    5: { key: "Sg", type: TYPE.ELEMENT },
    6: { key: "Bh", type: TYPE.ELEMENT },
    7: { key: "Hs", type: TYPE.ELEMENT },
    8: { key: "Mt", type: TYPE.ELEMENT },
    9: { key: "Ds", type: TYPE.ELEMENT },
    10: { key: "Rg", type: TYPE.ELEMENT },
    11: { key: "Cn", type: TYPE.ELEMENT },
    12: { key: "Nh", type: TYPE.ELEMENT },
    13: { key: "Fl", type: TYPE.ELEMENT },
    14: { key: "Mc", type: TYPE.ELEMENT },
    15: { key: "Lv", type: TYPE.ELEMENT },
    16: { key: "Ts", type: TYPE.ELEMENT },
    17: { key: "Og", type: TYPE.ELEMENT },
  },
  7: {
    0: { key: "[", type: TYPE.KEY },
    1: { key: "]", type: TYPE.KEY },
    2: { key: "Ce", type: TYPE.ELEMENT },
    3: { key: "Pr", type: TYPE.ELEMENT },
    4: { key: "Nd", type: TYPE.ELEMENT },
    5: { key: "Pm", type: TYPE.ELEMENT },
    6: { key: "Sm", type: TYPE.ELEMENT },
    7: { key: "Eu", type: TYPE.ELEMENT },
    8: { key: "Gd", type: TYPE.ELEMENT },
    9: { key: "Tb", type: TYPE.ELEMENT },
    10: { key: "Dy", type: TYPE.ELEMENT },
    11: { key: "Ho", type: TYPE.ELEMENT },
    12: { key: "Er", type: TYPE.ELEMENT },
    13: { key: "Tm", type: TYPE.ELEMENT },
    14: { key: "Yb", type: TYPE.ELEMENT },
    15: { key: "Lu", type: TYPE.ELEMENT },
    16: {
      key: "ENTER",
      span: 2,
      /**
       * Enter Key Callback function
       * Performs the following steps:
       * - if the focus area was set on Table, executes the default callbackFn on the latest selected element
       * - if the focus area was set on console, performs computions on current command
       * @param {State}_
       */
      cbFn: (_) => {
        switch (_.focusArea) {
          case TYPE.ELEMENT:
            defaultCallbackFn(_, _.currentElement);
            break;
          case TYPE.CONSOLE:
            compute(scan(_.command.join("")));
        }
      },
      type: TYPE.KEY,
    },
    17: undefined,
  },
  8: {
    0: { key: "*", type: TYPE.KEY },
    1: { key: "^", type: TYPE.KEY },
    2: { key: "Th", type: TYPE.ELEMENT },
    3: { key: "Pa", type: TYPE.ELEMENT },
    4: { key: "U", type: TYPE.ELEMENT },
    5: { key: "Np", type: TYPE.ELEMENT },
    6: { key: "Pu", type: TYPE.ELEMENT },
    7: { key: "Am", type: TYPE.ELEMENT },
    8: { key: "Cm", type: TYPE.ELEMENT },
    9: { key: "Bk", type: TYPE.ELEMENT },
    10: { key: "Cf", type: TYPE.ELEMENT },
    11: { key: "Es", type: TYPE.ELEMENT },
    12: { key: "Fm", type: TYPE.ELEMENT },
    13: { key: "Md", type: TYPE.ELEMENT },
    14: { key: "No", type: TYPE.ELEMENT },
    15: { key: "Lr", type: TYPE.ELEMENT },
    16: {
      key: "↑",
      cbFn: (_) => {
        const [i, j] = getElementIndex(_.currentElement);
        const upperItem = table[i - 1][j];
        if (i && table[i - 1][j] && isElement(upperItem)) {
          _.setCurrentElement(upperItem);
          _.setFocusArea(TYPE.ELEMENT);
        }
      },
      type: TYPE.KEY,
    },
    17: {
      key: "DEL",
      cbFn: (_) => {
        if (_.command.length == 1 && _.command[0] == " ") return; // empty command
        if (_.cursor > 0) _.setCursor(_.cursor - 1);
        const newCommand = [
          ..._.command.slice(0, _.cursor),
          ..._.command.slice(_.cursor + 1),
        ];
        if (_.cursor >= newCommand.length) _.setCursor(_.cursor - 1);

        _.setCommand(newCommand);
      },
      type: TYPE.KEY,
    },
  },
  9: {
    0: { key: "-", type: TYPE.KEY },
    1: { key: "+", type: TYPE.KEY },
    2: { key: ".", type: TYPE.KEY },
    3: { key: "0", type: TYPE.KEY },
    4: { key: "1", type: TYPE.KEY },
    5: { key: "2", type: TYPE.KEY },
    6: { key: "3", type: TYPE.KEY },
    7: { key: "4", type: TYPE.KEY },
    8: { key: "5", type: TYPE.KEY },
    9: { key: "6", type: TYPE.KEY },
    10: { key: "7", type: TYPE.KEY },
    11: { key: "8", type: TYPE.KEY },
    12: { key: "9", type: TYPE.KEY },
    13: { key: "⇒", type: TYPE.KEY },
    14: {
      key: "[-]",
      cbFn: (_) => {
        _.setCommand([
          ..._.command.slice(0, _.cursor),
          " ",
          ..._.command.slice(_.cursor),
        ]);
        _.setCursor(_.cursor + 1);
      },
      type: TYPE.KEY,
    },
    15: {
      key: "←",
      cbFn: (_) => {
        if (_.focusArea == TYPE.CONSOLE) {
          _.setCursor(_.cursor - 1);
          return;
        } else {
          const [i, j] = getElementIndex(_.currentElement);
          const previousItem = table[i][j - 1];
          if (j - 1 in table[i] && isElement(previousItem)) {
            _.setCurrentElement(previousItem);
          }
        }
      },
      type: TYPE.KEY,
    },
    16: {
      key: "↓",
      cbFn: (_) => {
        const [i, j] = getElementIndex(_.currentElement);
        const belowItem = table[i + 1][j];
        if (i + 1 in table && isElement(belowItem)) {
          _.setFocusArea(TYPE.ELEMENT);
          _.setCurrentElement(belowItem);
        }
      },
      type: TYPE.KEY,
    },
    17: {
      key: "→",
      cbFn: (_) => {
        if (_.focusArea == TYPE.CONSOLE) {
          _.setCursor(_.cursor + 1);
          return;
        } else {
          const [i, j] = getElementIndex(_.currentElement);
          const nextItem = table[i][j + 1];
          if (j + 1 in table[i] && isElement(nextItem)) {
            _.setCurrentElement(nextItem);
          }
        }
      },
      type: TYPE.KEY,
    },
  },
};

/**
 * Default callback function for handling TableItem interactions.
 *
 * @param {State extends IState} state - The state object of the application.
 * @param {TableItem} btn - The TableItem that triggered the callback.
 *
 * @description
 * This function handles different interactions with TableItems based on their type and the current shift state.
 * - If the item is not an element, key, or shift, it does nothing.
 * - If shift is held:
 *   - Dispatches a custom event `SHIFT+${btn.key}` with the button details.
 *   - Sets the shift state to false.
 * - If the item is an element:
 *   - Sets the current element in the state.
 *   - Updates the command in the state by inserting the element's key at the cursor position.
 *   - Increments the cursor position by 2.
 * - Otherwise (key or other valid item):
 *   - Updates the command in the state by inserting the element's key at the cursor position.
 *   - Increments the cursor position by 1.
 */
export function defaultCallbackFn<State extends IState>(
  state: State,
  btn: TableItem
) {
  if (!(isElement(btn) || isKey(btn) || isShift(btn))) return;
  if (state.shift) {
    document.dispatchEvent(
      new CustomEvent(`SHIFT+${btn.key}`, { detail: btn })
    );
    state.setShift(false);
    return;
  }
  if (isElement(btn)) {
    state.setCurrentElement(btn);
    state.setCommand([
      ...state.command.slice(0, state.cursor),
      btn.key,
      // " ",
      ...state.command.slice(state.cursor),
    ]);
    state.setCursor(state.cursor + 2);
  } else {
    state.setCommand([
      ...state.command.slice(0, state.cursor),
      btn.key,
      ...state.command.slice(state.cursor),
    ]);
    state.setCursor(state.cursor + 1);
  }
}

/**
 * Finds the index of a given TableElement, TableConsole, or TableOutput in the table.
 *
 * @param {TableElement | TableConsole | TableOutput} currentElement - The element to find the index of.
 * @returns {number[]} An array containing the row and column index of the element, or [0, 0] if not found.
 */
export function getElementIndex(
  currentElement: TableElement | TableConsole | TableOutput
) {
  for (let [i, row] of Object.entries(table)) {
    for (let [j, col] of Object.entries(row)) {
      if (col?.type != TYPE.ELEMENT) continue;
      if (currentElement == col) return [i, j].map((s) => parseInt(s));
    }
  }
  return [0, 0];
}

/**
 * Checks if a given TableItem is of type TableElement.
 *
 * @param {TableItem} element - The item to check.
 * @returns {element is TableElement} True if the item is a TableElement, false otherwise.
 */
export function isElement(element: TableItem): element is TableElement {
  if (!element) return false;
  else return element?.type === TYPE.ELEMENT;
}

/**
 * Checks if a given TableItem is of type TableKey.
 *
 * @param {TableItem} key - The item to check.
 * @returns {key is TableKey} True if the item is a TableKey, false otherwise.
 */
export function isKey(key: TableItem): key is TableKey {
  if (!key) return false;
  else return key?.type === TYPE.KEY;
}

/**
 * Checks if a given TableItem is of type TableShift.
 *
 * @param {TableItem} key - The item to check.
 * @returns {key is TableShift} True if the item is a TableShift, false otherwise.
 */
export function isShift(key: TableItem): key is TableShift {
  if (!key) return false;
  else return key?.type === TYPE.SHIFT;
}

/**
 * Checks if a given TableItem is of type TableConsole.
 *
 * @param {TableItem} panel - The item to check.
 * @returns {panel is TableConsole} True if the item is a TableConsole, false otherwise.
 */
export function isConsole(panel: TableItem): panel is TableConsole {
  if (!panel) return false;
  else return panel?.type === TYPE.CONSOLE;
}

/**
 * Checks if a given TableItem is of type TableOutput.
 *
 * @param {TableItem} panel - The item to check.
 * @returns {panel is TableOutput} True if the item is a TableOutput, false otherwise.
 */
export function isOutput(panel: TableItem): panel is TableOutput {
  if (!panel) return false;
  else return panel?.type === TYPE.OUTPUT;
}

/**
 * Checks if a given TableCell object has all its properties defined (not undefined).
 *
 * @param {TableCell} cell - The cell object to check.
 * @returns {cell is Required<TableCell>} True if all properties are defined, false otherwise.
 */
export function isPainted(cell: TableCell): cell is Required<TableCell> {
  const nu = (v: undefined | unknown) => v !== undefined;
  if (nu(cell.x) && nu(cell.y) && nu(cell.w) && nu(cell.h) && nu(cell.mesh))
    return true;
  return false;
}
