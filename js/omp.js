
class OMP {
  constructor(eps) {
    this.eps = (eps||1);
  }
  // Encode the provided patch
  encode(obj) {
    const imgData = obj.imgData;
    const dict= (obj.dict || dictionary);
    const x0  = (obj.x0 || 0);
    const y0  = (obj.y0 || 0);
    const dx  = (obj.dx || 28/NI);
    const dy  = (obj.dy || 28/NJ);
    const eps = (obj.eps || this.eps);
    const K   = (obj.K || maxAtoms);
    const M   = dx*dy;
    const N   = dict.length;
    const EPS = eps*eps;
    let S = new Array(3);
    let Z = new Array(3);
    let R = new Array(3);
    for (let c=0; c<3; ++c) {
      // Transpose(A)*R (Nx1): Responses of current filters to the residual
      let AtR = new Float32Array(N);  AtR.fill(0.0, 0, N);
      // Indexes of atoms used in this encoding (use each one only once)
      let idxSet = new Set();
      S[c] = new Uint8Array(K);       S[c].fill(  0, 0, K);
      Z[c] = new Float32Array(K);     Z[c].fill(0.0, 0, K);
      R[c] = new Float32Array(M);
      // Initialize residual to the provided image data (c-color
      // channel) and squares of the L2-norm of the residual
      let E = 0;
      for (let m=0; m<M; ++m) {
        R[c][m] = imgData[4*m+c];
        E += R[c][m]*R[c][m];
      }
      // Find the K most active filters
      var k;
      for (k=0; k<K && E>EPS && k<N; ++k) {
        // Track the filter with the highest activation (Skip filters
        // that have already been used.)
        let nMax; for(nMax=0; idxSet.has(nMax); ++nMax) { }
        for (let n=nMax; n<N; ++n) {
          if (idxSet.has(n)) continue; // Skip if filter-n has already been used
          // Compute the filter response to the current residual
          AtR[n] = 0.0;
          // AtR = Tranpose(A)*R
          for (let m=0; m<M; ++m) AtR[n] += dict[n][m]*R[c][m];
          // Save an index to the filter with the strongest response
          if (AtR[n] > AtR[nMax]) nMax = n;
        }
        if (AtR[nMax] > 0) {
          idxSet.add(nMax);
          // Store the index of the winning filter
          S[c][k] = nMax;
          // Store the correlation coefficient for the winning filter
          Z[c][k] = AtR[nMax];
          // Update the residual by removing the contribution of the
          // winning filter
          E = 0;
          for (let m=0; m<M; ++m) {
            R[c][m] -= AtR[nMax]*dict[nMax][m];
            E += R[c][m]*R[c][m];
          }
        }
      }
    }
    return { S: S, Z: Z, R: R };
  }
}
