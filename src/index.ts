import glyphs from "./glyphs.ts";
import state from "./state.ts";
import { compute, scan, stringify } from "./parse.ts";
import readme from "./description.ts";
import {
  isConsole,
  isElement,
  isPainted,
  isKey,
  isOutput,
  isShift,
  table,
  defaultCallbackFn,
} from "./table.ts";
import {
  TYPE,
  type ResetRedrawOptions,
  type TableCell,
  type ButtonUpEvent,
  type ButtonDownEvent,
  type TableShift,
  type BeforeElementChangeEvent,
  type ElementChangeEvent,
  type FocusAreaChangeEvent,
  type ComputationEvent,
  type DrawBlockOptions,
  type TableItem,
  type CustomEventMap,
  type SyntaxErrorEvent,
  type TwoDimUint8,
} from "./types.ts";

function init() {
  // 01. Assign viewport width and height
  let {
    innerWidth: vw /* viewport width */,
    innerHeight: vh /* viewport height */,
  } = window;

  const canvas = document.getElementById("viewport") as HTMLCanvasElement;

  // 02. Measure pixel size, gap between each pixel and gap between each block
  const dpr = window.devicePixelRatio;
  var nr = 10, // number of rows
    nc = 18, // number of columns
    nmr = 15, // number of rows in mesh
    nmc = 20, // number of columns in mesh
    gr = 0.2; // gap ratio = gap / unit

  var u = 0; // unit
  const uw = (vw - 50) / ((nmc + nmc * gr + 1) * nc);
  const uh = (vh - 50) / ((nmr + nmr * gr + 1) * nr);
  u = uw >= uh ? uh : uw;

  const pixel = {
    side: u,
    gap: gr * u,
    cx: (nmc + nmc * gr + 1) * u,
    cy: (nmr + nmr * gr + 1) * u,
  };

  // 03. Assign color for canvas fill style
  const styles = {
    background: "#d7ead6",
    blank: "#ffffff",
    element: "#404040",
    elementFocus: "#404040",
    key: "#1d2562",
    keyFocus: "#1d2562",
    output: "rgb(20,0,40)",
    error: "#692828",
  };

  const ctx = canvas.getContext("2d", { alpha: false })!;

  // 04. Calculate & scale canvas height and width
  // Find Total number of lines in `readme`
  const readmeLines = readme.split("").filter((s) => s == "\n").length;
  // Add Top margin, logo height, table height and readme height
  const h = (nr * nmr + readmeLines * 15) * (u + gr * u) + u + 12.5 + 10;
  vh = h > vh ? h : vh;
  // Scale canvas based on display pixel ratio for HQ canvas
  canvas.height = dpr * vh;
  canvas.width = dpr * vw;
  ctx.scale(dpr, dpr);

  // 05. Draw table and store table height and width
  const [, , tw, th] = drawTable(vw, vh, canvas);

  // 06. Add Table border
  addBorder(tw!, th!);

  // 07. Add Readme
  addReadme();

  // 08. Add Page Outline
  addPageOutline(vw, vh);

  // 09. Add Logo on top
  addLogo();

  /**
   * Horizontally concatenates two-dimensional matrices.
   *
   * @param {...TwoDimUint8[]} mat - An array of two-dimensional matrices to be concatenated.
   * @returns {TwoDimUint8[]} A new two-dimensional matrix containing the concatenated matrices.
   *
   * @example
   * const mat1 = [[1, 2], [3, 4]];
   * const mat2 = [[5, 6], [7, 8]];
   * const result = horConcat(mat1, mat2);
   * console.log(result); // Output: [[1, 2, 5, 6], [3, 4, 7, 8]]
   */
  function horConcat(...mat: TwoDimUint8[]) {
    let matCount;
    if ((matCount = mat.length) == 0) return [];

    const len = mat.map((m) => m[0].length);
    const totalLen = len.reduce((a, c) => a + c, 0);
    len.unshift(0);
    let offset = len[0];
    const rows = mat[0].length;
    const arr: TwoDimUint8 = new Array(rows);
    for (let i = 0; i < rows; ++i) arr[i] = new Uint8Array(totalLen);
    for (let m = 0; m < mat.length; m++) {
      offset += len[m];
      for (let i = 0; i < rows; ++i) {
        arr[i].set(mat[m][i], offset);
      }
    }

    return arr;
  }
  /**
   * Vertically concatenates two-dimensional matrices.
   *
   * @param {...TwoDimUint8[]} mat - An array of two-dimensional matrices to be concatenated.
   * @returns {TwoDimUint8[]} A new two-dimensional matrix containing the vertically concatenated matrices.
   *
   * @example
   * const mat1 = [[1, 2], [3, 4]];
   * const mat2 = [[5, 6], [7, 8]];
   * const result = verConcat(mat1, mat2);
   * console.log(result); // Output: [[1, 2], [3, 4], [5, 6], [7, 8]]
   */
  function verConcat(...mat: TwoDimUint8[]) {
    return mat.flat(1);
  }

  /**
   * Convert string to two-dimensional matrice of 0s and 1s.
   * A binary matrice representation of each character in the given string called Mesh.
   * @param {string} str
   * @returns {TwoDimUint8}
   * @example toGlyph("t") // [Array,Array,...]
   */
  function toGlyph(str: string): TwoDimUint8 {
    if (str.length > 1) {
      return horConcat(...str.split("").map(toGlyph));
    }
    return glyphs[str];
  }

  /**
   * Generates Mesh for each cell in `table` based on their type
   * and populates `TableCell.mesh`
   */
  function createTableCellMesh() {
    for (let row in table) {
      for (let col in table[row]) {
        const item = table[row][col];
        if (isElement(item))
          item.mesh = createBlockMesh(item.key, "filled", item);
        if (isKey(item)) item.mesh = createBlockMesh(item.key, "filled", item);
        if (isShift(item))
          item.mesh = createBlockMesh(item.key, "filled", item);
      }
    }
  }

  function drawTable(vw: number, vh: number, canvas: HTMLCanvasElement) {
    // 01. Fill Canvas with background color
    ctx.fillStyle = styles.background;
    ctx.fillRect(0, 0, vw, vh);

    // 02. Translate canvas origin to center the table
    // Calculate total marginal space between table and screen edge
    const x_m = vw - nc * pixel.cx;

    // Divide horizental margin by 2
    const xi = x_m / 2;
    const yi = nmc * (pixel.side + pixel.gap) + 12.5;
    ctx.translate(xi, yi);

    // 03. Storing boundary of each cell in the table
    const range = new Array<Float32Array>();
    /**
     * Checks if the PointerEvent is within boundary of the given cordinate
     * @param {PointerEvent} e
     * @param {number}x1
     * @param {number}x2
     * @param {number}y1
     * @param {number}y2
     * @returns {boolean} `true` if in-rage otherwise `false`
     * @example inRage(e,0,10,0,10) // true or false
     */
    const inRange = (
      e: PointerEvent,
      x1: number,
      x2: number,
      y1: number,
      y2: number
    ) => e.pageX >= x1 && e.pageX <= x2 && e.pageY >= y1 && e.pageY <= y2;

    // 04. Populating table cells
    createTableCellMesh();

    // 05. Draw each item in table
    const { cx, cy, side } = pixel;
    for (let i = 0; i < nr; i++) {
      for (let j = 0; j < nc; j++) {
        const item = table[i][j];

        if (isElement(item) || isKey(item) || isShift(item)) {
          // for elements, keys & shift
          // findind cordinates of top-left
          const x = j * cx;
          const y = i * cy;
          let w, h;
          // assiging fill style
          switch (true) {
            case isElement(item):
              ctx.fillStyle = styles.element;
              break;
            case isShift(item):
            case isKey(item):
              ctx.fillStyle = styles.key;
              break;
          }
          // drawing cell and storing cordinates
          [w, h] = drawBlock(item.mesh!, x, y);
          Object.assign(item, { x, y, w, h });
          // populating `range` with cordinates of top-left
          // and bottom-right point of the cell
          const buff = new ArrayBuffer(4 * 6);
          const cords = new Float32Array(buff);
          [xi + x, xi + x + w, yi + y, yi + y + h, i, j].forEach(
            (n, i) => (cords[i] = n)
          );
          range.push(cords);
        } else if (isConsole(item) || isOutput(item)) {
          // if console or output
          // drawing console and output
          switch (true) {
            case isConsole(item):
              // assinging cordinates of top-left point of console
              const x = (j * cx) / 2;
              const y = 0;
              const [w, h] = drawConsole(x, y);
              // Adding cordinates of console to `range`
              const buff = new ArrayBuffer(4 * 6);
              const cords = new Float32Array(buff);
              [xi + x, xi + x + w, yi + y, yi + y + h, i, j].forEach(
                (n, i) => (cords[i] = n)
              );
              range.push(cords);
              break;
            case isOutput(item):
              // Setting fill style of output and draw
              // We don't need output cordinates (it's Pointer insensitive)
              ctx.fillStyle = styles.output;
              drawOutput((j * cx) / 2, (i * cy) / 2);
              break;
          }
        }
      }
    }

    // 06. Setting current element
    handleElementChange({
      detail: state.currentElement,
    } as ElementChangeEvent["Event"]);

    // 07. Adding listeners to DOM events and custom events
    // Registering listeners to `CleaningQueue`.
    // Listeners must be removed when `Window.resize` was fired
    // since cordinates will be different.

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointerup", handlePointerUp);

    registerCleanup("pointerdown", canvas, handlePointerDown);
    registerCleanup("pointerup", canvas, handlePointerUp);

    document.addEventListener("scroll", handleBottonUp);
    document.addEventListener("contextmenu", handleBottonUp);
    document.addEventListener("buttonup", handleBottonUp);
    document.addEventListener("buttondown", handleBottonDown);
    document.addEventListener("cursormove", handleConsoleUpdate);
    document.addEventListener("focusareachange", handleFocusAreaChange);
    document.addEventListener("command", handleConsoleUpdate);
    document.addEventListener("command", handleOutputUpdate);
    document.addEventListener("shift", handleStickyShift);

    document.addEventListener("SHIFT+0", handleAllClear);
    document.addEventListener("SHIFT+1", handleCompution);
    document.addEventListener("SHIFT+2", handleCopyToClipboard);

    document.addEventListener("elementchange", handleElementChange);
    document.addEventListener("beforeelementchange", handleBeforeElementChange);
    document.addEventListener("computation", handleOutputUpdate);
    document.addEventListener("syntaxerror", handleErrors);

    registerCleanup("scroll", document, handleBottonUp);
    registerCleanup("contextmenu", document, handleBottonUp);
    registerCleanup("buttonup", document, handleBottonUp);
    registerCleanup("buttondown", document, handleBottonDown);
    registerCleanup("cursormove", document, handleConsoleUpdate);
    registerCleanup("focusareachange", document, handleFocusAreaChange);
    registerCleanup("command", document, handleConsoleUpdate);
    registerCleanup("command", document, handleOutputUpdate);
    registerCleanup("shift", document, handleStickyShift);

    registerCleanup("SHIFT+0", document, handleAllClear);
    registerCleanup("SHIFT+1", document, handleCompution);
    registerCleanup("SHIFT+2", document, handleCopyToClipboard);

    registerCleanup("elementchange", document, handleElementChange);
    registerCleanup("beforeelementchange", document, handleBeforeElementChange);
    registerCleanup("computation", document, handleOutputUpdate);
    registerCleanup("syntaxerror", document, handleErrors);

    /**
     *  Refills cell with background color and redraws
     * @param {TableCell} btn
     * @param {ResetRedrawOptions}opt
     */
    function reset_redraw<T extends TableCell>(
      btn: T,
      opt: ResetRedrawOptions = { style: "", outlined: false }
    ) {
      // if the cell is not drew once stops execution.
      if (!isPainted(btn)) return;
      // filling the cell with background color
      ctx.fillStyle = styles.background;
      ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
      // redrawing cell to given specification
      if (opt.style) ctx.fillStyle = opt.style;
      if (opt.outlined) {
        drawBlock(
          addOutline(btn.mesh.map((r) => r.map((c) => (c == 0 ? 1 : 0)))),
          btn.x,
          btn.y
        );
      } else {
        drawBlock(btn.mesh, btn.x, btn.y);
      }
    }

    function handlePointerDown(e: PointerEvent) {
      // Iterating over all stored cordinates to find a match in table cells
      for (let [x1, x2, y1, y2, i, j] of range) {
        const val = table[i][j];
        if (val && inRange(e, x1, x2, y1, y2)) {
          switch (true) {
            case isShift(val):
              // Shift key is a sticky key and requires unique behaviour
              // Calling Shift key callback function
              ctx.fillStyle = styles.keyFocus;
              val.cbFn!(state);
              break;

            case isKey(val):
              reset_redraw(val, { style: styles.keyFocus, outlined: true });

              // We need to reset the key after long-press
              lastPressedButton = () =>
                reset_redraw(val, { style: styles.key });

              document.dispatchEvent(
                new CustomEvent("buttondown", {
                  detail: val,
                } satisfies ButtonDownEvent["Init"])
              );
              break;

            case isElement(val):
              reset_redraw(val, {
                style: styles.elementFocus,
                outlined: true,
              });

              // We need to reset the key after long-press
              lastPressedButton = () =>
                reset_redraw(val, { style: styles.element });

              document.dispatchEvent(
                new CustomEvent("buttondown", {
                  detail: val,
                } satisfies ButtonDownEvent["Init"])
              );
              break;

            case isConsole(val):
              state.setFocusArea(TYPE.CONSOLE);
              return;
          }
          break;
        }
      }
    }

    function handlePointerUp(e: PointerEvent) {
      // Iterating over all stored cordinates to find a match in table cells
      for (let [x1, x2, y1, y2, i, j] of range) {
        const val = table[i][j];
        if (inRange(e, x1, x2, y1, y2)) {
          switch (true) {
            case isShift(val):
              ctx.fillStyle = styles.key;
              break;
            case isKey(val):
              reset_redraw(val, { style: styles.key });

              document.dispatchEvent(
                new CustomEvent("buttonup", {
                  detail: val,
                } satisfies ButtonUpEvent["Init"])
              );

              break;
            case isElement(val):
              reset_redraw(val, { style: styles.element });

              state.setFocusArea(TYPE.ELEMENT);

              document.dispatchEvent(
                new CustomEvent("buttonup", {
                  detail: val,
                } satisfies ButtonUpEvent["Init"])
              );

              break;
            case isConsole(val):
              state.setFocusArea(TYPE.CONSOLE);
              return;
          }

          break;
        }
      }
    }
    /**
     * * * * * * * Implementation of long press feature * * * * * * * * * * *
     * when a key is pressed it will be stored in `lastPressedButton`.
     * then `BottonDownEvent` will be dipatched and hence `handleBottomDown`
     * when `handlePointerUp` fired `BottonUpEvent` `handleBottomUp` will be called
     */
    let lastPressedButton: undefined | Function;
    let zero = performance.now();
    let done: boolean;
    /**
     *  when still pointer is down sets `done` to `false` and
     *  initates the sequence of calling key's callback function
     * @param {ButtonDownEvent["Event"]} e
     */
    function handleBottonDown(e: ButtonDownEvent["Event"]) {
      done = false;
      requestAnimationFrame(callbackIterator(e));
    }
    /**
     * generates a recursive function that calls itself
     * every t > 200ms based on render time of browser
     * and calls callback function of the bottom if available
     * otherwise calls a default callback function
     * @param {ButtonDownEvent["Event"]}e
     * @returns recursive function
     */
    function callbackIterator(e: ButtonDownEvent["Event"]) {
      return function call(timeStamp: number) {
        if (!done) {
          const value = (performance.now() - zero) / 200;
          if (value >= 1) {
            zero = performance.now();
            if (!e.detail.cbFn) {
              defaultCallbackFn(state, e.detail);
            } else {
              e.detail.cbFn(state);
            }
          }
          requestAnimationFrame(call);
        }
      };
    }
    /**
     * Resets and redraws the bottom if available and ends
     * the repetetive execution of bottom's callback function.
     * Ends of long press feature
     * @param {ButtonUpEvent["Event"] | Event} e
     */
    function handleBottonUp(e: ButtonUpEvent["Event"] | Event) {
      e.preventDefault(); // preventing contextmenu to pop up
      if (lastPressedButton != undefined) {
        lastPressedButton();
        lastPressedButton = undefined;
      }
      done = true;
    }

    /**
     * Resets Shift key back to released state when ShiftEvent dispatched
     */
    function handleStickyShift() {
      const shiftKey = table[0][1] as TableShift;
      reset_redraw(shiftKey, {
        style: styles.key,
        outlined: state.shift,
      });
    }

    /**
     * Resetes and redraws previous selected element to released state
     * @param {BeforeElementChangeEvent}e
     */
    function handleBeforeElementChange(e: BeforeElementChangeEvent["Event"]) {
      const elm = e.detail;
      reset_redraw(elm, { outlined: false, style: styles.element });
    }
    /**
     * Sets and redraws selected element to focused state
     * @param {ElementChangeEvent}e
     */
    function handleElementChange(e: ElementChangeEvent["Event"]) {
      const elm = e.detail;
      reset_redraw(elm, { outlined: true, style: styles.elementFocus });
    }

    /**
     * Resets and redraws console when command event fired
     */
    function handleConsoleUpdate() {
      ctx.fillStyle = styles.background;
      // refill console
      ctx.fillRect(cx * 2, 0, 15 * cx, cy);
      // reset fill style
      ctx.fillStyle = styles.key;
      drawConsole(cx, 0, {
        fillBlank:
          state.focusArea == TYPE.CONSOLE || state.focusArea == TYPE.KEY,
      });
    }
    /**
     * if console is the focused area it will be highlighted
     * and needs to be redrew, calls console update handle
     * while preserving filling style of canvas for next operations
     * @param e
     */
    function handleFocusAreaChange(e: FocusAreaChangeEvent["Event"]) {
      let style = ctx.fillStyle;
      handleConsoleUpdate();
      ctx.fillStyle = style;
    }

    /**
     * when shift + 1 or enter (focus area == console)
     * pressed runs solver based on current command in console
     */
    function handleCompution() {
      compute(scan(state.command.join("")));
    }

    /**
     * Resets and redraws output when `computation`|`command` events fired
     * @param {ComputationEvent}e
     */
    function handleOutputUpdate(e: ComputationEvent["Event"]) {
      ctx.fillStyle = styles.background;
      // refill output
      ctx.fillRect(cx * 2, cy, 10 * cx, cy * 2);
      // reset fill style
      ctx.fillStyle = styles.output;
      if (e.detail) drawOutput(cx, cy / 2, e.detail);
      else drawOutput(cx, cy / 2);
    }
    /**
     * Resets and redraws output when `error` events fired
     * @param {SyntaxErrorEvent}e
     */
    function handleErrors(e: SyntaxErrorEvent["Event"]) {
      ctx.fillStyle = styles.background;
      // refill output
      ctx.fillRect(cx * 2, cy, 10 * cx, cy * 2);
      // reset fill style
      ctx.fillStyle = styles.error;
      drawOutput(cx, cy / 2, e.detail.message);
    }

    /**
     * Clears command and resets cursor position back to 0
     * when `shift + 0` event fired
     */
    function handleAllClear() {
      state.setCursor(0);
      state.setCommand([" "]);
    }

    /**
     * Writes latest computation result to clipboard when
     * `shift + 2` event fired
     */
    function handleCopyToClipboard() {
      navigator.clipboard.writeText(state.result);
    }

    /**
     * Draws console
     * @param {number}x
     * @param {number}y
     * @param {DrawBlockOptions}option
     * @returns void
     */
    function drawConsole(
      x: number,
      y: number,
      option: DrawBlockOptions = { fillBlank: false }
    ) {
      ctx.save();
      ctx.translate(x, y);
      let meshes = state.command.map(toGlyph);

      // Applying top & bottom paddings to char(s)
      const [leftTri, rightTri] = [
        Array.from(glyphs["◀"]),
        Array.from(glyphs["▶"]),
      ];

      makeRectangle(leftTri, nmr, leftTri[0].length);
      makeRectangle(rightTri, nmr, rightTri[0].length);

      meshes = meshes.map((m) => {
        const newM = [...m];
        makeRectangle(newM, nmr, newM[0].length);
        return newM;
      });

      // Inverting colors where cursor is located
      meshes[state.cursor] = meshes[state.cursor].map((r) =>
        r.map((c) => (c == 0 ? 1 : 0))
      );

      // Spliting meshes into lines
      const meshSizes = meshes.map((m) => m[0].length);
      const chunks: number[][] = [];
      let chunk: number[] = [];
      let currIdx = 0;
      while (true) {
        var currSize = chunk.reduce((a, c) => a + meshSizes[c], 0);
        if (currIdx == meshSizes.length) {
          if (chunk.length != 0) chunks.push(chunk);
          break;
        }
        if (currSize + meshSizes[currIdx] < 15 * (nmc + 1) - 1 - 7) {
          chunk.push(currIdx);
        } else {
          chunks.push(chunk);
          chunk = [currIdx];
        }
        currIdx++;
      }

      // Selecting a chunk of the overflowed equation coresponding to cursor
      let chunkToView = chunks.findIndex((c) => c.indexOf(state.cursor) != -1);

      let meshesToView = chunks[chunkToView].map((idx) => meshes[idx]);

      // Add "◀" in the beginning of overflowed equations
      if (chunkToView > 0) meshesToView.unshift(leftTri);

      const concatedMesh = horConcat(...meshesToView);
      // fill the rest of the console
      for (let i = 0; i < concatedMesh.length; ++i) {
        const temp = concatedMesh[i];
        concatedMesh[i] = new Uint8Array((nmc + 1) * 15 - 4);
        concatedMesh[i].set(temp, 0);
      }

      // populate the mesh with "▶" in the end of overflowed equations
      if (chunks.length > 1 && chunkToView == 0) {
        for (let i = 0; i < rightTri.length; i++) {
          for (let j = rightTri[0].length - 1; j > 0; j--) {
            concatedMesh[i][(nmc + 1) * 15 - 4 - j] = rightTri[i][j];
          }
        }
      }
      meshesToView.push(rightTri);
      const [w, h] = drawBlock(concatedMesh, x, y, option);
      ctx.restore();
      return [w, h];
    }

    /**
     * Draws Output
     * @param {number}x
     * @param {number}y
     * @param {string}placeholder
     * @returns
     */
    function drawOutput(
      x: number,
      y: number,
      placeholder = state.result.length
        ? state.result
        : stringify(scan(state.command.join("")))
    ) {
      // saving latest transform object.
      ctx.save();
      // moving canvas starting cordinates
      ctx.translate(x, y);
      // spliting placeholder / text and filtering empty strings
      const output = placeholder.split(/\s+/).filter((w) => w != "");
      let meshes: TwoDimUint8[] = [];
      // populating `meshes`
      output.map((w) => {
        meshes.push(toGlyph(w));
        if (ctx.fillStyle == styles.error) meshes.push(toGlyph(" "));
      });
      // Spliting meshes into lines based on Output width
      let segmented_lines: TwoDimUint8[][] = [[]];
      let i = 0,
        line = 0,
        curSize = 0,
        sizes = meshes.map((mat) => mat[0].length);
      for (i; i < meshes.length; i++) {
        if (curSize + sizes[i] < 10 * (nmc + 1) - 1) {
          segmented_lines[line].push(meshes[i]);
          curSize += sizes[i];
        } else {
          line++;
          segmented_lines[line] = [meshes[i]];
          curSize = sizes[i];
        }
      }
      // horizentally concatenating meshes in `segmented_lines`
      // filling the rest of the line up to Output width
      let joined_lines: TwoDimUint8[] = [];
      if (segmented_lines[0].length == 0) {
        // if console was empty
        joined_lines.push([new Uint8Array(10 * (nmc + 1) - 3)]);
      } else {
        // if there's a command
        const n_of_lines = segmented_lines.length;
        for (let i = 0; i < n_of_lines; ++i) {
          // fill the rest of each line
          joined_lines[i] = horConcat(...segmented_lines[i]);
          const col_in_line = joined_lines[i][0].length;
          const row_in_line = joined_lines[i].length;
          const remaining_empty_col = 10 * (nmc + 1) - 3 - col_in_line;

          if (remaining_empty_col > 0) {
            for (let j = 0; j < row_in_line; ++j) {
              const temp = joined_lines[i][j];
              joined_lines[i][j] = new Uint8Array(
                temp.length + remaining_empty_col
              );
              joined_lines[i][j].set(temp, 0);
            }
          }
          addPadding(joined_lines[i], { bottom: 0, top: 1, left: 0, right: 0 });
        }
      }

      // vertically concatenating lines into one two-dimensional matrice
      const meshes_to_draw = verConcat(...joined_lines);
      const n_row_in_output = 2 * (nmr + 1) - 1;
      const n_row_in_meshes = meshes_to_draw.length;
      if (n_row_in_meshes > n_row_in_output) {
        // meshes overflow out of output bounds
        meshes_to_draw.splice(n_row_in_output, Infinity);
      } else if (n_row_in_meshes < n_row_in_output) {
        // filling empty rows
        for (let i = n_row_in_meshes; i < n_row_in_output; ++i)
          meshes_to_draw[i] = new Uint8Array(
            Math.floor((10 * pixel.cx) / pixel.side)
          );
      }

      invertColor(meshes_to_draw);
      const [w, h] = drawBlock(meshes_to_draw, x, y);
      ctx.restore();
      return [w, h];
    }
    const x = table[0][0]?.x;
    const y = table[0][0]?.y;
    const w = table[9][17]!.x! + table[9][17]!.w!;
    const h = table[9][17]!.y! + table[9][17]!.h!;
    return [x, y, w, h];
  }

  /**
   * Creates a block mesh representing a label with an optional outline or filled style.
   *
   * @param {string} label - The text label to create the mesh for.
   * @param {"outlined" | "filled"} style - The style of the block mesh. Can be "outlined" or "filled".
   * @param {TableItem} [src] - Optional source TableItem. Used to link the label visually to other elements.
   * @returns {TwoDimUint8} The block mesh representing the label with the chosen style.
   */
  function createBlockMesh(
    label: string,
    style: "outlined" | "filled",
    src?: TableItem
  ) {
    const labelMesh = horConcat(...label.split("").map((l) => glyphs[l]));
    makeRectangle(labelMesh, nmr, nmc, src);
    switch (style) {
      case "outlined":
        return addOutline(labelMesh);
      case "filled":
        return labelMesh.map((r) => r.map((c) => Number(!c)));
      default:
        return labelMesh;
    }
  }

  /**
   * Adjusts a 2D matrix (mat) to fit within a specified rectangle defined by height (h) and width (w).
   * Optionally considers the span property of a source TableItem (src) for adjusting width.
   *
   * @param {TwoDimUint8} mat - The 2D matrix to be adjusted.
   * @param {number} h - The desired height of the rectangle.
   * @param {number} w - The desired width of the rectangle.
   * @param {TableItem} [src] - Optional source TableItem. Used to adjust width based on its span property.
   *
   * @description
   * This function takes a 2D matrix (`mat`) and adjusts its dimensions (if necessary) to fit within a rectangle defined by the provided height (`h`) and width (`w`). It also considers the optional `src` parameter:
   * - If `src` is provided and has a `span` property, the width (`w`) is adjusted based on the `span` value.
   *
   * If the original dimensions of `mat` are larger than the desired rectangle, no adjustments are made. Otherwise:
   * - If `h` or `w` is smaller than the corresponding dimension of `mat`, it is doubled and an odd value is ensured for better alignment.
   *
   * The function then calls the `addPadding` function to add necessary padding to the `mat` to achieve the desired dimensions.
   */
  function makeRectangle(
    mat: TwoDimUint8,
    h: number,
    w: number,
    src?: TableItem
  ) {
    const nR = mat.length;
    const nC = nR != 0 ? mat[0].length : 0;

    if (h == nR && w == nC) return;
    if (src && src.span) {
      w = (w + 1) * src.span - 1;
    }
    if (h < nR || w < nC) {
      if (h < nR) h = h * 2 + 1;
      if (w < nC) w = w * 2 + 1;
      console.warn(
        "`h` or `w` is out of the range. dimensions must be larger or equal to `mat` sizes."
      );
    }
    addPadding(mat, {
      left: Math.floor((w - nC) / 2),
      right: -Math.floor((nC - w) / 2),
      top: Math.floor((h - nR) / 2),
      bottom: -Math.floor((nR - h) / 2),
    });
  }

  /**
   * Adds padding to a 2D matrix (mat) based on the provided top, left, right, and bottom values.
   *
   * @param {TwoDimUint8} mat - The 2D matrix to be padded.
   * @param {{ left: number; top: number; right: number; bottom: number }} padding - Object defining padding amounts.
   *   - left: Amount of padding to add on the left side.
   *   - top: Amount of padding to add on the top side.
   *   - right: Amount of padding to add on the right side.
   *   - bottom: Amount of padding to add on the bottom side.
   *
   * @description
   * This function adds padding to a 2D matrix (`mat`) based on the provided `padding` object. The padding object specifies the amount of padding to add on each side (left, top, right, bottom) as individual properties.
   */
  function addPadding(
    mat: TwoDimUint8,
    padding: { left: number; top: number; right: number; bottom: number }
  ) {
    // 1. Calculate the new width considering padding:
    const n =
      mat.length > 0
        ? mat[0].length + padding.left + padding.right
        : padding.left + padding.right;

    // 2. Define a function to create a new row with padding:
    const createRow = () => new Uint8Array(n);

    // 3. Add padding to existing rows:
    for (let row in mat) {
      const temp = mat[row]; // Store the original row
      mat[row] = new Uint8Array(n); // Allocate a new row with new width
      mat[row].set(temp, padding.left); // Copy original row content with left padding
    }
    // 4. Add top padding rows:
    for (let i = 0; i < padding.top; i++) mat.unshift(createRow());

    // 5. Add bottom padding rows:
    for (let i = 0; i < padding.bottom; i++) mat.push(createRow());
  }

  /**
   * Adds an outline of 1s (filled cells) around a 2D matrix (mat).
   *
   * @param {TwoDimUint8} mat - The 2D matrix to be outlined.
   * @returns {TwoDimUint8} The matrix with the added outline.
   *
   * @description
   * This function adds an outline of 1s (filled cells) to the provided 2D matrix (`mat`).
   * It iterates through each row and column and sets the first and last cells to 1,
   * effectively creating an outline around the original content.
   */
  function addOutline(mat: TwoDimUint8) {
    // 1. Get the dimensions of the matrix:
    const r = mat.length - 1;
    const c = mat[0].length - 1;

    // 2. Loop through each row:
    mat.map((_, i) => {
      // 2.1. Set the first and last cell of the row to 1:
      if (i == 0 || i == r) mat[i] = mat[i].map((e) => 1);

      // 3. Loop through each cell within the row (excluding first and last):
      mat[i].forEach((_, j) => {
        // 3.1. Set the first and last cell of each column (excluding top and bottom) to 1:
        if (j == 0 || j == c) mat[i][j] = 1;
      });
    });

    // 4. Return the modified matrix with the outline:
    return mat;
  }

  /**
   * Inverts the colors (0s and 1s) of all cells in a 2D matrix (mat).
   *
   * @param {TwoDimUint8} mat - The 2D matrix to be inverted.
   * @returns {TwoDimUint8} The matrix with inverted colors.
   *
   * @description
   * This function inverts the colors (0s and 1s) of all cells within the provided 2D matrix (`mat`). It iterates through each cell and flips its value (0 becomes 1, and 1 becomes 0).
   */
  function invertColor(mat: TwoDimUint8) {
    // 1. Get the dimensions of the matrix:
    const [m, n] = [mat.length, mat[0].length];

    // 2. Loop through each row:
    for (let i = 0; i < m; i++) {
      // 3. Loop through each cell within the row:
      for (let j = 0; j < n; j++) {
        // 4. Invert the color of the cell:
        mat[i][j] = mat[i][j] === 0 ? 1 : 0;
      }
    }
  }

  /**
   * Adds pixelated border around the table
   *
   * @param {number} tw - Table width
   * @param {number} th - Table height
   *
   * @description
   * This function uses `pixel` to create a border around the table.
   * Thickness of the border is 3 unit-mesh and the same all around the table.
   */
  function addBorder(tw: number, th: number) {
    // 1. Desctruct `pixel`.
    const { side: s, gap: g } = pixel;

    // 2. Set fill style on canvas and store canvas origin
    ctx.fillStyle = styles.element;
    ctx.save();

    // 3. Filling top and bottom of the table
    const n = 3; // Thickness of border

    // 3.1 Calculate the number of pixels for Top/Bottom border based on the width of the table
    const m = Math.floor(tw / (s + g)) + 2 * n + 2;

    // 3.2 Translate canvas origin to top-left corner of border
    ctx.translate(-(n * (1 + gr) + 1) * u, -(n * (1 + gr) + 1) * u);
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < m; c++) {
        ctx.fillRect(c * (s + g), r * (s + g), s, s);

        // 3.3 Add table height to draw bottom border
        const y0 = th + (n * (1 + gr) + 2) * u - gr * u;
        ctx.fillRect(c * (s + g), y0 + r * (s + g), s, s);
      }
    }
    // 4. Restore canvas origin back to top-left of the table
    ctx.restore();
    ctx.save();

    // 5. Filling left & right of the table
    const q = 3; // Thickness of border

    // 5.1 Calculate the number of pixels for Left/Right border based on the width of the table
    const p = Math.floor(th / (s + g)) + 2;

    // 5.2 Translate canvas origin to top-left corner of border
    ctx.translate(-(q * (1 + gr) + 1) * u, -u);
    for (let r = 0; r < p; r++) {
      for (let c = 0; c < q; c++) {
        ctx.fillRect(c * (s + g), r * (s + g), s, s);

        // 5.3 Add table width to draw right border
        const x0 = tw + (q * (1 + gr) + 2) * u + gr * u;
        ctx.fillRect(x0 + c * (s + g), r * (s + g), s, s);
      }
    }
    // 6. Restore canvas origin back to top-left of the table
    ctx.restore();
  }

  /**
   * Add usage description below the table including shortcuts and examples
   *
   * @description
   * This function splits `readme` based on new lines, maps characters to their adequate glyphs.
   * concatenates the glyphs to one line adds padding, adjusts the length of the lines to a constant.
   * Finally passes the mesh to `drawBlock` and draws the read-me text.
   */
  function addReadme() {
    const lines: TwoDimUint8 = readme
      .split("\n")
      .map((line, l) => {
        const lineSegment = line.split("").map(toGlyph);
        const conc = horConcat(...lineSegment);
        addPadding(conc, { left: 0, right: 0, top: 3, bottom: 3 });
        return conc;
      })
      .flat(1);
    const lineLen = lines.map((l) => l.length);
    const maxLen = Math.max.apply(null, lineLen);
    const n = lines.length;
    for (let i = 0; i < n; ++i) {
      if (lineLen[i] < maxLen) {
        const temp = lines[i];
        lines[i] = new Uint8Array(maxLen);
        lines[i].set(temp, 0);
      }
    }

    ctx.fillStyle = styles.element;
    drawBlock(lines, 0, th! + 10);
  }

  /**
   * Draws an outline around the entire page on the canvas.
   *
   * @param {number} vw - Viewport width in pixels.
   * @param {number} vh - Viewport height in pixels.
   *
   * @description
   * This function adds an outline to the entire page displayed on the canvas element. It uses the provided viewport dimensions:
   *  - canvas: The HTML canvas element used for rendering.
   *  - pixel: Object containing properties related to pixel size (side and gap).
   *  - tw: Total width of the content area in pixels.
   *  - nmc: Number of character rows displayed on screen.
   *  - dpr: Device pixel ratio.
   *  - styles: Object containing style definitions.
   *
   * The function performs the following steps:
   * 1. Gets the drawing context for the canvas with alpha disabled (avoids transparency issues).
   * 2. Extracts `side` and `gap` properties from the `pixel` object (assumed to be pixel dimensions).
   * 3. Calculates the position and dimensions of the left outline rectangle based on `tw`, `nmc`, `s`, `g`, and desired outline thickness.
   * 4. Stores the current transformation matrix (`preTransform`) and resets the context's transformation.
   * 5. Scales the context based on device pixel ratio (`dpr`).
   * 6. Sets the fill style to the element style from the `styles` object.
   * 7. Draws rectangles for the top, bottom, left, and right outlines using the calculated dimensions and `vh` (viewport height).
   * 8. Resets the context's transformation and applies the stored pre-transformation (`preTransform`).
   */
  function addPageOutline(vw: number, vh: number) {
    const ctx = canvas.getContext("2d", { alpha: false })!;
    const { side: s, gap: g } = pixel;
    // 1. Draw a rectangle as a background for logo name
    ctx.fillRect(
      tw! / 2 - 4 * (s + g) - (80 * (s + g) - 12.5) / 2,
      -4 * (s + g),
      80 * (s + g) - 12.5,
      -nmc * (s + g) - 12.5
    );

    // 2. Store canvas transforms
    const preTransform = ctx.getTransform();

    // 3. Reset canvas transforms to set its origin on top-left of the page
    ctx.resetTransform();

    // 4. Scale canvas to device pixel ratio
    ctx.scale(dpr, dpr);
    ctx.fillStyle = styles.element;

    // 5. Draw Top outline
    ctx.fillRect(0, 0, vw, 12.5);

    // 6. Draw Bottom outline
    ctx.fillRect(0, vh - 12.5, vw, 12.5);

    // 7. Draw Left outline
    ctx.fillRect(0, 0, 12.5, vh);

    // 8. Draw Right outline
    ctx.fillRect(vw - 12.5, 0, 12.5, vh);

    // 9. Reset canvas origin back to previous origin
    ctx.resetTransform();
    ctx.setTransform(preTransform);
  }

  /**
   * Add a logo type on above & in the middle of the table
   */
  function addLogo() {
    const mesh = horConcat(..."CHEMBALANCE".split("").map(toGlyph));
    const { side: s, gap: g } = pixel;
    ctx.fillStyle = styles.background;
    drawBlock(
      mesh,
      tw! / 2 - 4 * (s + g) - (75 * (s + g) - 12.5) / 2,
      -17 * (s + g)
    );
  }

  /**
 * Draws a block on the canvas based on a 2D matrix (mesh) and position.
 *
 * @param {TwoDimUint8} mesh - The 2D matrix representing the block to be drawn.
 * @param {number} x - X-coordinate of the top-left corner of the block.
 * @param {number} y - Y-coordinate of the top-left corner of the block.
 * @param {DrawBlockOptions} [option={ fillBlank: false }] - Optional drawing options.
 *   - fillBlank: Boolean flag indicating whether to fill empty cells with a `styles.blank`. Defaults to false.
 * @returns {number[]} An array containing the width and height of the drawn block in pixels.
 *
 * @description
 * This function draws a block on the canvas element using the provided `mesh` (a 2D matrix), position (`x` and `y`), and optional drawing options (`option`).
 * - The `option` object allows specifying whether to fill empty cells (cells with value 0) with a specific background style.
 * - The function iterates through each cell in the `mesh` and performs the following:
   - If the cell value is 1 (filled), a rectangle is drawn using the current fill style and cell position.
   - If the cell value is 0 (empty) and `option.fillBlank` is true, the fill style is temporarily changed to the blank style, a rectangle is drawn, and the original fill style is restored.
 * Finally, the function restores the context state and returns an array containing the width and height of the drawn block in pixels, calculated from the mesh dimensions and pixel size.
 */
  function drawBlock(
    mesh: TwoDimUint8,
    x: number,
    y: number,
    option: DrawBlockOptions = { fillBlank: false }
  ) {
    ctx.save(); // Save current context state
    // Translate context for positioning:
    ctx.translate(x, y);

    const n = mesh.length;
    const m = mesh[0].length;
    const { side: s, gap: g } = pixel; // Extract side and gap from pixel object

    // Loop through each row and column of the mesh:
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < m; c++) {
        // Draw filled cell:
        if (mesh[r][c]) ctx.fillRect(c * (s + g), r * (s + g), s, s);
        else {
          // Handle empty cell (optional filling):
          if (option.fillBlank) {
            let style = ctx.fillStyle; // Store current fill style
            ctx.fillStyle = styles.blank; // Set fill style to blank
            ctx.fillRect(c * (s + g), r * (s + g), s, s);
            ctx.fillStyle = style; // Restore original fill style
          }
        }
      }
    }
    ctx.restore(); // Restore context state

    // Return the block's width and height in pixels:
    return [m * (s + g), n * (s + g)];
  }
}

let cleaningQueue: [
  string,
  Object & { removeEventListener: Function },
  Function
][] = [];

/**
 * Registers records of assigned events
 * @param {keyof CustomEventMap} event
 * @param {Document | HTMLElement}target
 * @param {Function}listener
 * @description `registerCleanup` pushes all parameters into `cleaningQueue`
 * all stored values then will be used when `cleanUp` is called.
 */
function registerCleanup<K extends keyof CustomEventMap>(
  event: K,
  target: Document | HTMLElement,
  listener: (ev: CustomEventMap[K]) => void
) {
  cleaningQueue.push([event, target, listener]);
}

/**
 * Removes all listeners that are stored in
 * `cleaningQueue` and resets the queue.
 */
function cleanUp() {
  for (let [event, target, listener] of cleaningQueue) {
    target.removeEventListener(event, listener);
  }
  cleaningQueue = [];
}

window.onresize = () => {
  cleanUp();
  init();
};
init();
