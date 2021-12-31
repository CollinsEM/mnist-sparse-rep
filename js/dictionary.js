//--------------------------------------------------------------------
class Dictionary extends Array {
  // Construct a dictionary of atoms of size w x h.
  constructor(w, h) {
    super();
    this.w = w || Math.floor(28/NI) || 7;// atom width
    this.h = h || Math.floor(28/NJ) || 7;// atom height
    this.M = w*h;      // size of each atom
    this.K = maxAtoms; // maximum number of atoms in each reconstruction
    // DOM element for displaying all atoms in the dictionary
    this.domDictionary = document.getElementById('dictionary');
    // DOM elements for displaying each individual atom
    this.atomViews = new Array();
    // Keep track of how often each atom gets used
    this.dutyCycle = new Array();
  }
  addAtom(atom) {
    if (this.length >= dictSize)
      console.warn("Exceeded maximum number of recommended atoms.");
    if (this.length >= 2*dictSize)
      return;
    // Find the atom in the existing dictionary that is closest to
    // this one
    let q = null, dq = 0;
    for (let n=0; n<this.length; ++n) {
      let sum = 0.0;
      for (let m=0; m<this.M; ++m) sum += atom[m]*this[n][m];
      if (q === null || sum > dq) {
        q = n;  dq = sum;
      }
    }
    // If atom is close enough to one that is already in the
    // dictionary, then average the two together. Increase the weight
    // of the existing atom everytime it is combined with another.
    if (dq > 0.95) {
      let w = this[q].weight;
      for (let m=0; m<this.M; ++m) {
        this[q][m] = (w*this[q][m] + atom[m])/(w+1);
      }
      // For every new atom averaged-in, increase the weight
      this[n].weight++;
      this[n].normalize();
      this.atomViews[n].atom = this[n];
      this.atomViews[n].render();
    }
    // Otherwise, add the new atom to the dictionary.
    else {
      const idx = this.length;
      this[idx] = atom;
      if (this.atomViews[idx] === undefined) {
        let view = new AtomView(atom);
        view.render();
        this.atomViews[idx] = view;
        this.domDictionary.appendChild(view.canvas);
      }
      else {
        this.atomViews[idx].atom = atom;
        this.atomViews[idx].render();
      }
    }
  }
  normalize() {
    this.forEach( function( atom ) {
      atom.normalize();
    } );
  }
  clear() {
    this.length = 0;
    this.atomViews.forEach( (view) => view.clear() );
  }
  // Encode a WxH buffer using atoms in the current dictionary
  encode(buff, eps) {
    const W = this.w, H = this.h, M = W*H;
    eps = eps || 1e-3;
    // Square the tolerance for faster convergence checks
    const EPS = (eps||1)*(eps||1);
    let S = new Set();
    let Z = [];
    // Allocate and initialize residual buffer
    let R = new Float32Array(M);
    for (let m=0; m<M; ++m) R[m] = buff[m];
    // Current residual energy (square of the L2-norm of the residual)
    let E = this.L2Sq(this.R[c]);
    // Transpose(A)*R (Nx1): Responses of current filters to the residual
    let AtR = new Float32Array(N);
    // Clear the support list
    S.clear();
    // Find the K most active filters
    var k;
    for (k=0; k<this.K && E>EPS && k<N; ++k) {
      // Track the filter with the highest activation (initialize to
      // the first filter that is not already in the support).
      let nMax = 0; for (nMax=0; S.has(nMax); ++nMax) { }
      // For each filter
      for (let n=nMax; n<N; ++n) {
        if (S.has(n)) continue; // Skip if filter-n has already been used
        // Compute the filter response to the current residual
        AtR[n] = 0.0;
        // AtR = Tranpose(A)*R
        for (let m=0; m<M; ++m) AtR[n] += dict[n][m]*this.R[c][m];
        // Save an index to the filter with the strongest response
        if (AtR[n] > AtR[nMax]) nMax = n;
      }
      if (AtR[nMax] > 0) {
        S.add(nMax);
        // Store the index of the winning filter
        this.S[c][k] = nMax;
        // Store the correlation coefficient for the winning filter
        this.Z[c][k] = AtR[nMax];
        // Update the residual by removing the contribution of the
        // winning filter
        for (let m=0; m<M; ++m) this.R[c][m] -= AtR[nMax]*dict[nMax][m];
        err = L2Sq(this.R[c]);
        if (err > E) {
          // Adding this atom actually increased the error, remove it
          for (let m=0; m<M; ++m) this.R[c][m] += AtR[nMax]*dict[nMax][m];
          this.S[c][k] = -1;
          this.Z[c][k] = 0;
          break;
        }
      }
    }
    while (k<maxAtoms) {
      S[c][k] = -1;
      Z[c][k] = 0;
      ++k;
    }
  }
  L2Sq(R) {
    let l2Sq = 0;
    for (let m=0; m<R.length; ++m)
      l2Sq += R[m]*R[m];
    return l2Sq;
  }
};
