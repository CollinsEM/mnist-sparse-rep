class Sensor extends Array {
  constructor(ni, nj) {
    super(ni*nj);
    this.init(ni, nj);
    this.initDOM();
  }
  init(ni, nj) {
    this.ni = ni;
    this.nj = nj;
    const dx=28/this.ni, dy = 28/this.nj;
    // Tile the input space with sensor patches
    for (let j=0; j<this.nj; ++j) {
      for (let i=0; i<this.ni; ++i) {
        if (this[j*ni+i] === undefined)
          this[j*ni+i] = new SensorPatch(i*dx, j*dy, dx, dy);
        else
          this[j*ni+i].init(i*dx, j*dy, dx, dy);
      }
    }
  }
  initDOM() { 
    let canvas = document.createElement('canvas');
    canvas.className = "filter";
    canvas.width = 28;
    canvas.height = 28;
    this.context = canvas.getContext( '2d', { willReadFrequently: true } );
    document.getElementById('output-signal').append(canvas);
    
    canvas = document.createElement('canvas');
    canvas.className = "filter";
    canvas.width = 28;
    canvas.height = 28;
    this.residual = canvas.getContext( '2d', { willReadFrequently: true } );
    document.getElementById('residual').append(canvas);
  }
  encode(digit, dict) {
    // For each sensor patch, encode the portion of the image at the
    // corresponding location.
    this.forEach( function( arg ) {
      arg.encode(digit, dict, gui.numAtoms);  // Generate sparse rep.
      arg.decode(dict);         // Reconstruct and display sparse rep.
    } );
  }
  update(digit, dict) {
    // For each sensor patch, encode the portion of the image at the
    // corresponding location.
    this.forEach( function( arg ) {
      arg.encode(digit, dict, gui.numAtoms);
      arg.decode(dict);
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
    this.init(x0, y0, dx, dy);
    this.initDOM();
  }
  init(x0, y0, dx, dy) {
    this.x0 = x0;
    this.y0 = y0;
    this.dx = dx;
    this.dy = dy;
    // Support for the representation (list of activated atoms for each color)
    this.K = gui.numAtoms || Math.floor(dictSize*sparsity);
    this.R = []; // Residual in each color band
    this.S = []; // Atom support in each color band
    this.Z = []; // Atom coefficients in each color band
    for (let c=0; c<3; ++c) {
      this.R[c] = new Float32Array(this.dx*this.dy);
      this.S[c] = new Uint8Array(maxAtoms);
      this.Z[c] = new Float32Array(maxAtoms);
    }
  }
  initDOM() {
    // Create canvas objects to show the decomposed signal
    var canvas;
    const domTable = document.getElementById('omp-output');
    const domRow = document.createElement('tr');
    domTable.append(domRow);
    const domInput = document.createElement('td');
    domRow.append(domInput);
    canvas = document.createElement('canvas');
    canvas.className = "filter";
    canvas.width = this.dx;
    canvas.height = this.dy;
    this.ctxInput = canvas.getContext( '2d', { willReadFrequently: true } );
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
      canvas.width = this.dx;
      canvas.height = this.dy;
      this.ctxAtoms[k] = canvas.getContext( '2d', { willReadFrequently: true } );
      domAtoms.append(canvas);
    }
    // Create a canvas for the reconstructed signal
    const domSignal = document.createElement('td');
    domRow.append(domSignal);
    canvas = document.createElement('canvas');
    canvas.width = this.dx;
    canvas.height = this.dy;
    canvas.className = "filter";
    this.ctxSignal = canvas.getContext( '2d', { willReadFrequently: true } );
    domSignal.append(canvas);
    // Create a canvas for the residual
    const domResidual = document.createElement('td');
    domRow.append(domResidual);
    canvas = document.createElement('canvas');
    canvas.width = this.dx;
    canvas.height = this.dy;
    canvas.className = "filter";
    this.ctxResidual = canvas.getContext( '2d', { willReadFrequently: true } );
    domResidual.append(canvas);
  }
  L2Sq(R) {
    let l2Sq = 0;
    for (let m=0; m<R.length; ++m) l2Sq += R[m]*R[m];
    return l2Sq;
  }
  /// Use Orthogonal Matching Pursuit algorithm to find the optimal
  /// coefficients for the current signal
  encode(img, dict, K, eps) {
    this.K = (K || maxAtoms);
    this.eps = (eps || 100);
    const W = img.width;
    const x0 = this.x0, dx = this.dx;
    const y0 = this.y0, dy = this.dy;
    const M = dx*dy, N = dict.length;
    // Render input data
    this.imgData = this.ctxInput.getImageData(0, 0, dx, dy);
    for (let y=0, m=0; y<dy; ++y) {
      for (let x=0; x<dx; ++x) {
        for (let c=0; c<3; ++c) {
          this.imgData[4*(y*dx+x)+c] = img.data[4*((y0+y)*W+(x0+x))+c];
        }
        this.imgData[4*(y*dx+x)+3] = 255;
      }
    }
    // console.log(this.x0, this.y0, this.dx, this.dy, img);
    this.ctxInput.putImageData(img, -x0, -y0, x0, y0, dx, dy);
    // this.ctxInput.putImageData(this.imgData, 0, 0);
    let obj = omp.encode(this);
    this.S = obj.S;
    this.Z = obj.Z;
    this.R = obj.R;
    // console.log(obj);
  }
  decode(dict) {
    const ni = this.dx, nj = this.dy;
    const M = ni*nj, N = dict.length, K = this.K;
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
    for (let k=0; k<K && k<N; ++k) {
      let visible = false;
      let atom = this.ctxAtoms[k].getImageData(0, 0, ni, nj);
      for (let c=0; c<3; ++c) {
        const n = this.S[c][k]; // Atom index
        const z = this.Z[c][k]; // Atom coefficient
        const A = dict[n];      // Atom basis vector
        for (let m=0; m<M; ++m) {
          atom.data[4*m+c] = z*A[m];
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
