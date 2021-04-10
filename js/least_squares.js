//----------------------------------------------------------------
// LEAST SQUARES FITTING
//----------------------------------------------------------------

/// Vector type
class Vector extends Float32Array {
  constructor(sz) {
    super(sz);
  }
};
// Matrix type
class Matrix extends Array {
  constructor(M, N) {
    super(M);
    this.M = M;
    this.N = N;
    this.data = new ArrayBuffer(4*M*N);
    for (var i=0; i<M; ++i) {
      this[i] = new Float32Array(this.data, 4*N*i, 4*N);
    }
  }
};

// Solve A x = b through LU-decomposition LU x = b
function LUDecompSolve(A, B) {
  const M = A.M;
  const N = A.N;
  // Copy A into LU
  let LU = new Matrix(M, N);
  for (var i=0; i<M; ++i) {
    for (var j=0; j<N; ++j) {
      LU[i][j] = A[i][j];
    }
  }
  // Initialize pivot vector
  let R = new Uint8Array(N);
  for (var i=0; i<N; ++i) {
    R[i] = i;
  }
  for (var p=0; p<N; ++p) {
    // Find the pivot row for the p'th column
    var m = p;
    for (var q=p+1; q<N; ++q) {
      if (Math.abs(LU[q][p]) > Math.abs(LU[m][p])) { m = q; }
    }
    // Swap rows if necessary
    if (m != p) {
      Math.swap(LU[p], LU[m]);
      Math.swap(R[p], R[m]);
    }
    if (LU[p][p] != 0) {
      // Compute and apply the multiplier for each subsequent row
      for (var k=p+1; k<N; ++k) {
        LU[k][p] /= LU[p][p];
        for (var q=p+1; q<N; ++q) {
          LU[k][q] -= LU[k][p]*LU[p][q];
        }
      }
    }
    else {
      // Output A and the current state of the LU matrix
      console.log("A: ");
      for (var m=0; m<M; ++m) {
        console.log(A[m]);
      }
      console.log("LU: ");
      for (var m=0; m<M; ++m) {
        console.log(LU[m]);
      }
      console.error("LUDecompSolve: singular matrix.");
    }
  }
  // Solve Ly=b for y
  let Y = new Vector(N);
  Y[0] = B[R[0]];
  for (var k=1; k<N; ++k) {
    Y[k] = B[R[k]];
    for (var q=0; q<k; ++q) {
      Y[k] -= LU[k][q]*Y[q];
    }
  }
  // Solve Ux=y for x
  let X = new Vector(N);
  // X[N-1] = Y[N-1]/LU[N-1][N-1];
  // for (int k=N-2; k>=0; --k) {
  for (var k=N-1; k>=0; --k) {
    if (LU[k][k] == 0) {
      console.error("Cannot solve! LU["+k+"]["+k+"] = " + LU[k][k]);
    }
    const rkk = 1.0/LU[k][k];
    X[k] = Y[k]*rkk;
    for (var q=k+1; q<N; ++q) {
      X[k] -= LU[k][q]*X[q]*rkk;
    }
  }
  return X;
}
