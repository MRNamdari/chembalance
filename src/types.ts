declare global {
  interface Document {
    //adding definition to Document
    addEventListener<K extends keyof CustomEventMap>(
      type: K,
      listener: (this: Document, ev: CustomEventMap[K]) => void
    ): void;
    dispatchEvent<K extends keyof CustomEventMap>(ev: CustomEventMap[K]): void;
  }
}
export type TwoDimMat = Array<Array<number>>;

export type TwoDimUint8 = Array<Uint8Array>;

export type Glyph = {
  [prop: string]: TwoDimUint8;
};

export type ElementName = string;

export type Match = {
  SUM?: string;
  YIELD?: string;
  ELEMENT?: ElementName;
  BRACKET?: string | Match[];
  COUNT?: number;
  CHARGE?: number;
  FREE_CHARGE?: number;
};

export type AbstractToken = { [k: string]: number; [k: symbol]: number };

export enum TYPE {
  ELEMENT,
  KEY,
  OUTPUT,
  CONSOLE,
  SHIFT,
}

export type TableCell = {
  span?: number;
  mesh?: TwoDimUint8;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
};

export type TableElement = TableCell & {
  key: string;
  type: TYPE.ELEMENT;
  cbFn?: <S extends IState>(s: S) => any;
};

export type TableKey = TableCell & {
  key: string;
  type: TYPE.KEY;
  cbFn?: <S extends IState>(s: S) => any;
};

export type TableShift = TableCell & {
  key: string;
  type: TYPE.SHIFT;
  cbFn?: <S extends IState>(s: S) => any;
};

export type TableConsole = TableCell & {
  type: TYPE.CONSOLE;
};

export type TableOutput = TableCell & {
  type: TYPE.OUTPUT;
};

export type TableItem =
  | TableElement
  | TableKey
  | TableShift
  | TableConsole
  | TableOutput
  | undefined;

export type Table = {
  [n: number]: {
    [n: number]: TableItem;
  };
};

export type ResetRedrawOptions = {
  style?: string;
  outlined?: boolean;
};

export type DrawBlockOptions = {
  fillBlank?: boolean;
};

export type EventGen<T> = {
  Init: CustomEventInit<T>;
  Event: CustomEvent<T>;
};

export type ButtonUpEvent = EventGen<TableKey | TableShift | TableElement>;
export type ButtonDownEvent = EventGen<TableKey | TableShift | TableElement>;
export type BeforeElementChangeEvent = EventGen<TableElement>;
export type ElementChangeEvent = EventGen<TableElement>;
export type FocusAreaChangeEvent = EventGen<TYPE>;
export type ShiftEvent = EventGen<boolean>;
export type ComputationEvent = EventGen<string>;
export type SyntaxErrorEvent = EventGen<SyntaxError>;

export type CustomEventMap = DocumentEventMap & {
  buttonup: ButtonUpEvent["Event"];
  buttondown: ButtonDownEvent["Event"];
  beforeelementchange: BeforeElementChangeEvent["Event"];
  elementchange: ElementChangeEvent["Event"];
  shift: ShiftEvent["Event"];
  [key: `SHIFT+${number}`]: void;
  focusareachange: FocusAreaChangeEvent["Event"];
  computation: ComputationEvent["Event"];
  cursormove: CustomEvent;
  command: CustomEvent;
  syntaxerror: SyntaxErrorEvent["Event"];
};

export type IState = {
  get command(): string[];
  get cursor(): number;
  get currentElement(): TableElement;
  get focusArea(): TYPE;
  get shift(): boolean;
  get result(): string;
  setCursor(idx: number): void;
  setCommand(cmd: string[]): void;
  setCurrentElement(key: TableElement | undefined): void;
  setFocusArea(type: TYPE): void;
  setShift(bool: boolean): void;
  setResult(txt: string): void;
};
