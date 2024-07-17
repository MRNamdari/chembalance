import { table } from "./table.ts";
import { TYPE } from "./types.ts";
import type {
  BeforeElementChangeEvent,
  TableElement,
  ElementChangeEvent,
  FocusAreaChangeEvent,
  ShiftEvent,
  IState,
} from "./types.ts";

const state = new (class State implements IState {
  #command = [
    "[",
    "2",
    "*",
    "Al",

    "[",
    "S",
    " ",
    "O",
    "*",
    "3",
    "]",
    "*",
    "3",
    "]",

    "+",

    "[",
    "Na",
    " ",
    "O",
    " ",
    "H",
    "]",

    "⇒",

    "[",
    "Na",
    "*",
    "2",
    " ",
    "S",
    " ",
    "O",
    "*",
    "3",
    "]",

    "+",

    "[",
    "Al",
    " ",
    "[",
    "O",
    " ",
    "H",
    "]",
    "*",
    "3",
    "]",
    " ",
  ];

  // Store and initialize cursor position in console
  #cursor = 0;

  // Indicate the last selected element
  // if not acts as a starting point when using arrow buttons while focus area is set on TABLE
  #currentElement = table[5][6] as TableElement;

  // Indicate the last visited area whether be CONSOLE or TABLE
  #focusArea = TYPE.CONSOLE;

  // Indicate current state of shift button
  // - true: held in
  // - false: released
  #shift = false;

  // Store the last computed value
  #result = "";

  get cursor() {
    return this.#cursor;
  }

  /**
   * Sets cursor position and dispatches corresponding custom event
   * @param {number}idx - Position of cursor in console in number
   */
  setCursor(idx: number) {
    idx = idx <= 0 ? 0 : idx;
    idx = idx > this.#command.length - 1 ? this.#command.length - 1 : idx;
    this.#cursor = idx;
    document.dispatchEvent(new CustomEvent("cursormove"));
  }

  get command() {
    if (!this.#command.length) return [" "];
    return this.#command;
  }

  /**
   * Sets new command and dispatches corresponding custom event
   * @param {string[]}cmd - Array of strings as command
   */
  setCommand(cmd: string[]) {
    this.#command = cmd;
    this.#result = "";
    document.dispatchEvent(new CustomEvent("command"));
  }

  get currentElement() {
    return this.#currentElement || table[5][6];
  }

  /**
   * Sets selected table element
   * @param {TableElement | undefined} key - representing the last pressed / addressed table element
   * @returns {TableElement | undefined}
   * @description This function performs following steps:
   * - Checks if the provided key is valid, if not stops furthur execution
   * - Dispatches "beforeelementchange" with previous value.
   * - Dispatches "elementchange" with new value
   * - Stores and return new value
   */
  setCurrentElement(key: TableElement | undefined) {
    // 1. Check if the key is valid
    if (!key) return;

    // 2. Dispatch previous value
    document.dispatchEvent(
      new CustomEvent("beforeelementchange", {
        detail: this.#currentElement || table[5][6],
      } satisfies BeforeElementChangeEvent["Init"])
    );

    // 3. Dispatch new value
    document.dispatchEvent(
      new CustomEvent("elementchange", {
        detail: key,
      } satisfies ElementChangeEvent["Init"])
    );

    // 4. Store and return new value
    return (this.#currentElement = key);
  }

  get focusArea() {
    return this.#focusArea;
  }

  /**
   * Assigns the last manuplated area and dispatches new custom event corresponding to the latest changes
   * @param {TYPE} type - constant value representing the area
   */
  setFocusArea(type: TYPE) {
    this.#focusArea = type;
    document.dispatchEvent(
      new CustomEvent("focusareachange", {
        detail: type,
      } satisfies FocusAreaChangeEvent["Init"])
    );
  }

  get shift() {
    return this.#shift;
  }

  /**
   * Assigns the latest state of Shift button and fires new custom event containing the botton's state
   * @param {boolean} bool - true if is held, false if not
   */
  setShift(bool: boolean) {
    this.#shift = bool;
    document.dispatchEvent(
      new CustomEvent("shift", { detail: bool } satisfies ShiftEvent["Init"])
    );
  }

  get result() {
    return this.#result;
  }

  /**
   * Stores the latests computed value as text
   * @param {string} txt - the latest computed value which printed in output
   */
  setResult(txt: string) {
    this.#result = txt;
  }
})();

export type State = typeof state;
export default state;
