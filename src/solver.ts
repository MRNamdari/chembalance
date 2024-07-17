import { type TwoDimMat } from "./types.ts";

/**
 * Transposes a two-dimensional matrix (2D array).
 *
 * @param {TwoDimMat} matrix - The matrix to be transposed.
 * @returns {TwoDimMat} The transposed matrix.
 * @throws {Error} If the input is not a 2D array.
 *
 * @example
 * const matrix = [
 *   [1, 2, 3],
 *   [4, 5, 6],
 *   [7, 8, 9],
 ];
 * const transposed = transpose(matrix);
 * console.log(transposed);
 * // Output:
 * // [
 * //   [1, 4, 7],
 * //   [2, 5, 8],
 * //   [3, 6, 9],
 * // ]
 */
function transpose(matrix: TwoDimMat) {
  // 1. Validate input as a 2D array:
  if (!Array.isArray(matrix) || !matrix.length || !Array.isArray(matrix[0])) {
    throw new Error("Input must be a 2D array");
  }

  // 2. Get matrix dimensions:
  const rows = matrix.length;
  const cols = matrix[0].length;

  // 3. Pre-allocate transposed matrix with correct column lengths:
  const transposed: TwoDimMat = new Array(cols)
    .fill(null)
    .map(() => new Array(rows));

  // 4. Transpose elements directly into the pre-allocated array:
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      transposed[j][i] = matrix[i][j];
    }
  }

  return transposed;
}

/**
 * Multiplies two two-dimensional matrices (2D arrays).
 *
 * @param {TwoDimMat} A - The first matrix (left operand)
 * @param {TwoDimMat} B - The second matrix (right operand)
 * @returns {TwoDimMat} The resulting product matrix.
 * @throws {Error} If the matrices are not compatible for multiplication
 * (different inner dimensions or non-2D arrays).
 *
 * @example
 * const A = [
 *   [1, 2],
 *   [3, 4],
 ];
 * const B = [
 *   [5, 6],
 *   [7, 8],
 ];
 * const C = multiply(A, B);
 * console.log(C);
 * // Output:
 * // [
 * //   [19, 22],
 * //   [43, 50],
 * // ]
 */
function multiply(A: TwoDimMat, B: TwoDimMat) {
  // 1. Validate matrix compatibility for multiplication:
  if (
    !Array.isArray(A) ||
    !Array.isArray(B) ||
    !A.length ||
    !B.length ||
    !B[0] ||
    A[0].length !== B.length
  ) {
    throw new Error("Incompatible matrices for multiplication");
  }

  // 2. Get dimensions of matrices:
  const rowsA = A.length;
  const colsA = A[0].length;
  const colsB = B[0].length;

  // 3. Create an empty result matrix with correct dimensions:
  const C: TwoDimMat = new Array(rowsA).fill(null).map(() => new Array(colsB));

  // 4. Perform matrix multiplication using nested loops:
  for (let i = 0; i < rowsA; i++) {
    for (let j = 0; j < colsB; j++) {
      // Calculate dot product of row i of A and column j of B:
      let sum = 0;
      for (let k = 0; k < colsA; k++) {
        sum += A[i][k] * B[k][j];
      }
      // Assign the sum to the corresponding element in the result matrix:
      C[i][j] = sum;
    }
  }
  // 5. Return the resulting product matrix:
  return C;
}

/**
 * Attempts to diagonalize a square matrix using Gaussian elimination with partial pivoting.
 *
 * @param {TwoDimMat} A - The square matrix to be diagonalized.
 * @throws {Error} If the matrix is singular (no leading non-zero entry found).
 *
 * @example
 * const A = [
 *   [1, 2, 3],
 *   [2, -1, 4],
 *   [3, 1, 2],
 ];
 * try {
 *   const D = diagonalize(A);
 *   console.log(D);
 * } catch (error) {
 *   console.error(error);
 * }
 * // Note: This example may not result in a perfectly diagonal matrix
 * // due to numerical errors or limitations of the algorithm.
 */
function diagonalize(A: TwoDimMat) {
  const m = A.length;
  const n = A[0].length;

  // Limit iterations to the smaller dimension:
  const min_m_n = Math.min(m, n);
  for (let k = 0; k < min_m_n; ++k) {
    // Find the k-th pivot
    // Find the row with the largest absolute value in the current column:
    const i_max = findPivot(A, k);
    if (A[i_max][k] == 0) {
      document.dispatchEvent(
        new CustomEvent("syntaxerror", { detail: "No solution were found." })
      );
      throw "matrix is singular";
    }

    // Swap the pivot row with the current row:
    swap(A, k, i_max);
    // Do for all rows below pivot
    // Perform elimination (Gaussian elimination with partial pivoting) for rows below the pivot:
    for (let i = k + 1; i < m; ++i) {
      // Do for all remaining elements in current row:
      // Calculate the elimination factor:
      let c = A[i][k] / A[k][k];

      // Update remaining elements in the current row:
      for (let j = k + 1; j < n; ++j) {
        A[i][j] = A[i][j] - A[k][j] * c;
      }
      // Fill lower triangular matrix with zeros
      // Eliminate the corresponding element in the current column:
      A[i][k] = 0;
    }
  }
}

/**
 * Finds the row index with the largest absolute value in a specific column of a matrix.
 * Used as part of Gaussian elimination with partial pivoting.
 *
 * @param {TwoDimMat} M - The matrix to search.
 * @param {number} k - The column index to search.
 * @returns {number} The index of the row with the largest absolute value in the specified column.
 *
 * @example
 * const matrix = [
 *   [1, 2, 3],
 *   [0, -4, 5],
 *   [2, 1, 0],
 ];
 * const pivotRow = findPivot(matrix, 1);
 * console.log(pivotRow); // Output: 1 (index of the second row)
 */
function findPivot(M: TwoDimMat, k: number) {
  // Initialize the row with the current pivot as the first row below the current column:
  let i_max = k;

  // Iterate through rows below the current column:
  for (let i = k + 1; i < M.length; ++i) {
    // Compare the absolute values of elements in the current column:
    if (Math.abs(M[i][k]) > Math.abs(M[i_max][k])) {
      // Update the index of the row with the largest absolute value:
      i_max = i;
    }
  }

  // Return the index of the row with the largest absolute value:
  return i_max;
}

/**
 * Swaps two rows within a matrix.
 * Used as part of Gaussian elimination with partial pivoting.
 *
 * @param {TwoDimMat} M - The matrix containing the rows to be swapped.
 * @param {number} i_max - The index of the first row to swap.
 * @param {number} k - The index of the second row to swap.
 *
 * @example
 * const matrix = [
 *   [1, 2, 3],
 *   [4, 5, 6],
 *   [7, 8, 9],
 ];
 * swap(matrix, 1, 2);
 * console.log(matrix);
 * // Output:
 * // [
 * //   [1, 2, 3],
 * //   [7, 8, 9],
 * //   [4, 5, 6],
 * // ]
 */
function swap(M: TwoDimMat, i_max: number, k: number) {
  // Check if rows are different (avoid unnecessary operation):
  if (i_max != k) {
    // Destructuring assignment to swap row references efficiently:
    [M[i_max], M[k]] = [M[k], M[i_max]];
  }
}

/**
 * Augments a square matrix (A) with a column vector (b), resulting in a new augmented matrix.
 *
 * @param {TwoDimMat} A - The square matrix to be augmented.
 * @param {TwoDimMat} b - The column vector to be added as the last column.
 * @throws {Error} If the input matrix (A) is not square or the column vector (b)
 * does not have the same number of rows as the matrix.
 *
 * @example
 * const A = [
 *   [1, 2],
 *   [3, 4],
 ];
 * const b = [[5], [6]];
 * makeM(A, b);
 * console.log(A);
 * // Output:
 * // [
 * //   [1, 2, 5],
 * //   [3, 4, 6],
 * // ]
 */
function makeM(A: TwoDimMat, b: TwoDimMat) {
  const n = A.length; // Get the matrix dimension (number of rows)

  // Validate input matrix and vector dimensions:
  if (n !== A[0].length || n !== b.length) {
    throw new Error("Incompatible dimensions for matrix augmentation");
  }

  // Augment each row of the matrix with the corresponding element from the vector:
  for (let i = 0; i < n; ++i) {
    A[i].push(b[i][0]); // Push the first element of each row from b
  }
}

/**
 * Performs forward substitution in a matrix using the upper triangular part
 * resulting from Gaussian elimination with partial pivoting.
 *
 * @param {TwoDimMat} M - The augmented matrix after diagonalization.
 *
 * @example
 * const matrix = [
 *   [1, 2, 3, 5], // Assuming this matrix represents the upper triangular
 *   [0, 1, 4, 6], // part after Gaussian elimination with partial pivoting.
 *   [0, 0, 1, 2],
 ];
 * substitute(matrix);
 * console.log(matrix);
 * // Output:
 * // [
 * //   [1, 2, 3, 5],
 * //   [0, 1, 2, 0],
 * //   [0, 0, 1, 2],
 * // ]
 */
function substitute(M: TwoDimMat) {
  const m = M.length;

  // Iterate through rows in reverse order (forward substitution):
  for (let i = m - 1; i >= 0; --i) {
    // Calculate the value of x using the last element (m) of the current row:
    const x = M[i][m] / M[i][i];

    // Apply forward substitution to rows above the current row:
    for (let j = i - 1; j >= 0; --j) {
      // Subtract the product of x and the corresponding element in the current column
      // from the element in the same column of the row above:
      M[j][m] -= x * M[j][i];

      // Set the corresponding element in the row above to zero (elimination):
      M[j][i] = 0;
    }

    // Update remaining elements in the current row (set diagonal to 1):
    M[i][m] = x;
    M[i][i] = 1;
  }
}

/**
 * Extracts the solution vector (x) from an augmented matrix after forward substitution.
 *
 * @param {TwoDimMat} M - The augmented matrix after forward substitution.
 * @returns {number[]} The solution vector (x).
 *
 * @example
 * const matrix = [
 *   [1, 2, 3, 5],
 *   [0, 1, 2, 0],
 *   [0, 0, 1, 2],
 ];
 * const solution = extractX(matrix);
 * console.log(solution); // Output: [5, 0, 2]
 */
function extractX(M: TwoDimMat) {
  const m = M.length; // Get the matrix dimension (number of rows)
  const n = M[0].length; // Get the total number of columns

  // Create a solution vector with zeros:
  const x = new Array<number>(m).fill(0);

  // Extract the solution values from the last column of the matrix:
  for (let i = 0; i < m; ++i) {
    x[i] = M[i][n - 1]; // Access the last element in each row
  }

  // Return the solution vector:
  return x;
}

/**
 * Creates a deep copy of a two-dimensional array (2D array).
 *
 * @param {TwoDimMat} M - The 2D array to be copied.
 * @returns {TwoDimMat} A new 2D array containing a deep copy of the original.
 */
function copy(M: TwoDimMat) {
  // Get the dimensions of the input matrix:
  const m = M.length; // Number of rows
  const n = M[0].length; // Number of columns (assuming all rows have the same length)

  // Create a new empty matrix to store the copy:
  const newM: TwoDimMat = new Array(m);

  // Copy elements from the original matrix to the new matrix:
  for (let i = 0; i < m; ++i) {
    // Fill the new matrix with empty sub-arrays to represent rows:
    newM[i] = new Array<number>(n);
    for (let j = 0; j < n; ++j) {
      newM[i][j] = M[i][j];
    }
  }
  // Return the new matrix containing the deep copy:
  return newM;
}

/**
 * Solves a system of linear equations (Ax = b) using Gaussian elimination with partial pivoting.
 *
 * @param {TwoDimMat} A - The coefficient matrix (A) of the system.
 * @param {TwoDimMat} B - The constant vector (b) of the system.
 * @returns {number[]} The solution vector (x) for the system of equations.
 * @throws {Error} If the input matrices are incompatible (non-square matrix A or different row lengths between A and B).
 */
function gaussian_elimination_calc(A: TwoDimMat, B: TwoDimMat) {
  // 1. Create deep copies of input matrices to avoid modifying originals:
  const newA = copy(A);
  const newB = copy(B);

  // 2. Check for compatibility of matrices:
  if (A.length !== A[0].length || A.length !== B.length) {
    throw new Error("Incompatible matrices for Gaussian elimination");
  }

  // 3. Combine A and B into an augmented matrix:
  makeM(newA, newB);

  // 4. Perform diagonalization using Gaussian elimination with partial pivoting:
  diagonalize(newA);

  // 5. Perform forward substitution to solve for unknowns:
  substitute(newA);

  // 6. Extract the solution vector (x) from the augmented matrix:
  return extractX(newA);
}

/**
 * Solves a system of linear equations (Ax = b) using Gaussian elimination with partial pivoting.
 *
 * @param {TwoDimMat} A - The coefficient matrix (A) of the system.
 * @param {TwoDimMat} B - The constant vector (b) of the system.
 * @returns {number[]} The solution vector (x) for the system of equations.
 * @throws {Error} If the input matrices are incompatible (non-square matrix A or different row lengths between A and B).
 */
export default function solve(A: TwoDimMat, B: TwoDimMat) {
  const AT = transpose(A);
  const ATA = multiply(AT, A);
  const ATB = multiply(AT, B);
  return gaussian_elimination_calc(ATA, ATB);
}
