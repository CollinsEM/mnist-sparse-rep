class Sensor extends Array {
  constructor(ni, nj) {
    super(ni*nj);
    this.ni = ni;
    this.nj = nj;
    const dx=28/ni, dy = 28/nj;
    // Tile the input space with sensor patches
    for (let j=0; j<nj; ++j) {
      for (let i=0; i<ni; ++i) {
        this[j*ni+i] = new SensorPatch(i*dx, j*dy, dx, dy);
      }
    }
    
    let canvas = document.createElement('canvas');
    canvas.className = "filter";
    canvas.width = 28;
    canvas.height = 28;
    this.context = canvas.getContext('2d');
    document.getElementById('output-signal').append(canvas);
    
    canvas = document.createElement('canvas');
    canvas.className = "filter";
    canvas.width = 28;
    canvas.height = 28;
    this.residual = canvas.getContext('2d');
    document.getElementById('residual').append(canvas);
  }
  encode(digit, dict) {
    // For each sensor patch, encode the portion of the image at the
    // corresponding location.
    this.forEach( function( arg ) {
      arg.encode(digit, dict);
      arg.update(dict);
    } );
  }
  render() {
    const ni=this.ni, nj=this.nj;
    const dx=28/ni, dy = 28/nj;
    for (let j=0; j<nj; ++j) {
      for (let i=0; i<ni; ++i) {
        let img = this[j*ni+i].ctxSignal.getImageData(0, 0, dx, dy);
        this.context.putImageData(img, i*dx, j*dy, 0, 0, dx, dy);
        let res = this[j*ni+i].ctxResidual.getImageData(0, 0, dx, dy);
        this.residual.putImageData(res, i*dx, j*dy, 0, 0, dx, dy);
      }
    }
  }
};

/// This class uses the Orthogonal Matching Pursuit algorithm to
/// generate a K-sparse encoding of an input signal given the provided
/// dictionary.
class SensorPatch {
  /// @x horizontal offset
  /// @y vertical offset
  /// @dx horizontal width
  /// @dy vertical height
  constructor(x0, y0, dx, dy) {
    this.x0 = x0;
    this.y0 = y0;
    this.dx = dx;
    this.dy = dy;
    // Support for the representation (list of activated atoms for each color)
    this.K = Math.floor(dictSize*sparsity);
    this.R = []; // Residual in each color band
    this.S = []; // Atom support in each color band
    this.Z = []; // Atom coefficients in each color band
    for (let c=0; c<3; ++c) {
      this.R[c] = new Float32Array(this.dx*this.dy);
      this.S[c] = new Uint8Array(maxAtoms);
      this.Z[c] = new Float32Array(maxAtoms);
    }
    // Create canvas objects to show the decomposed signal
    var canvas;
    const domTable = document.getElementById('omp-output');
    const domRow = document.createElement('tr');
    domTable.append(domRow);
    const domInput = document.createElement('td');
    domRow.append(domInput);
    canvas = document.createElement('canvas');
    canvas.className = "filter";
    canvas.width = dx;
    canvas.height = dy;
    this.ctxInput = canvas.getContext('2d');
    domInput.append(canvas);
    // Create canvas objects to show the decomposed signal
    const domAtoms = document.createElement('td');
    domAtoms.style.width = parseInt(17*maxAtoms).toString() + 'px'
    domRow.append(domAtoms);
    this.ctxAtoms = new Array();
    // Create canvases to show decomposed signal
    for (let k=0; k<maxAtoms; ++k) {
      canvas = document.createElement('canvas');
      canvas.className = "filter";
      canvas.width = dx;
      canvas.height = dy;
      this.ctxAtoms[k] = canvas.getContext('2d');
      domAtoms.append(canvas);
    }
    // Create a canvas for the reconstructed signal
    const domSignal = document.createElement('td');
    domRow.append(domSignal);
    canvas = document.createElement('canvas');
    canvas.width = dx;
    canvas.height = dy;
    canvas.className = "filter";
    this.ctxSignal = canvas.getContext('2d');
    domSignal.append(canvas);
    // Create a canvas for the residual
    const domResidual = document.createElement('td');
    domRow.append(domResidual);
    canvas = document.createElement('canvas');
    canvas.width = dx;
    canvas.height = dy;
    canvas.className = "filter";
    this.ctxResidual = canvas.getContext('2d');
    domResidual.append(canvas);
  }
  L2Sq(R) {
    let l2Sq = 0;
    for (let m=0; m<R.length; ++m) l2Sq += R[m]*R[m];
    return l2Sq;
  }
  /// Use Orthogonal Matching Pursuit algorithm to find the optimal
  /// coefficients for the current signal
  encode(img, dict, eps) {
    const W = img.width;
    const dx = this.dx, dy = this.dy;
    const M = dx*dy, N = dict.length;
    let input   = this.ctxInput.getImageData(0, 0, dx, dy);
    for (let y=0, m=0; y<dy; ++y) {
      for (let x=0; x<dx; ++x) {
        for (let c=0; c<3; ++c) {
          input.data[4*(y*dx+x)+c] = img.data[4*((this.y0+y)*W+(this.x0+x))+c];
        }
        input.data[4*(y*dx+x)+3] = 255;
      }
    }
    let x0 = this.x0;
    let y0 = this.y0;
    // console.log(this.x0, this.y0, this.dx, this.dy, img);
    // this.ctxInput.putImageData(img, -x0, -y0, x0, y0, dx, dy);
    this.ctxInput.putImageData(input, 0, 0);
    // Square the tolerance for faster convergence checks
    const EPS = (eps||1)*(eps||1);
    let S = new Set();
    for (let c=0; c<3; ++c) {
      for (let k=0; k<this.K; ++k) {
        this.S[c][k] = 0;
        this.Z[c][k] = 0.0;
      }
      // Initialize residual to the provided image data (c-color channel)
      // for (let y=0, m=0; y<this.dy; ++y) {
      //   for (let x=0; x<this.dx; ++x, ++m) {
      //     this.R[c][m] = img.data[4*((this.y0+y)*W+(this.x0+x))+c];
      //   }
      // }
      for (let m=0; m<M; ++m) {
        this.R[c][m] = input.data[4*m+c];
      }
      // Squares of the L2-norm of the residual
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
          E = this.L2Sq(this.R[c]);
        }
      }
      while (k<maxAtoms) {
        this.S[c][k] = 0;
        this.Z[c][k] = 0;
        ++k;
      }
    }
    // console.log(this.S, this.Z);
  }
  update(dict) {
    const ni = this.dx, nj = this.dy;
    const M = ni*nj, N = dict.length;
    let output  = this.ctxSignal.getImageData(0, 0, ni, nj);
    let residual= this.ctxResidual.getImageData(0, 0, ni, nj);
    for (let m=0; m<M; ++m) {
      for (let c=0; c<3; ++c) {
        output.data[4*m+c] = 0;
        residual.data[4*m+c] = this.R[c][m];
      }
      output.data[4*m+3] = 255;
      residual.data[4*m+3] = 255;
    }
    for (let k=0; k<this.K && k<N; ++k) {
      let atom = this.ctxAtoms[k].getImageData(0, 0, ni, nj);
      let visible = false;
      for (let c=0; c<3; ++c) {
        const n = this.S[c][k]; // Atom index
        const z = this.Z[c][k]; // Atom coefficient
        const A = dict[n];      // Atom basis vector
        for (let m=0; m<M; ++m) {
          atom.data[4*m+c]    = z*A[m];
          output.data[4*m+c] += z*A[m];
        }
        visible |= (z>0);
      }
      for (let m=0; m<M; ++m) atom.data[4*m+3] = (visible ? 255 : 0);
      this.ctxAtoms[k].putImageData(atom, 0, 0);
    }
    this.ctxSignal.putImageData(output, 0, 0);
    this.ctxResidual.putImageData(residual, 0, 0);
  }
}
