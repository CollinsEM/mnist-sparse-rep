class Filter extends Float32Array {
  constructor(ni, nj) {
    super(ni*nj);
    this.ni = ni;
    this.nj = nj;
  }
};

class LogGaborFilter extends Array {
  constructor(numScales, filterWidth) { // NQ, NP, N) {
    super();
    this.numScales = numScales;
    this.filterWidth  = filterWidth || 49; // length and width of filter in pixels
    const NI = this.filterWidth;
    const NJ = this.filterWidth;
    const NQ = this.numScales;  // number of length scales
    const W = (NQ>1 ? 6*NI*(NQ-1) : NI);
    const H = NJ*NQ;
    
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'atomView';
    this.canvas.width = W;
    this.canvas.height = H;
    this.canvas.addEventListener('click', this.onMouseClick(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove(this));
    
    this.context = this.canvas.getContext('2d');
    this.context.imageSmoothingEnabled = false;
    
    document.getElementById('atoms').appendChild(this.canvas);
    
    const G = [];                    // Filter bank
    var minG = 1e30;
    var maxG = -1e30;
    const sra = 0.996*Math.sqrt(2/3); // standard deviation in ra
    const den1 = -0.5/(sra*sra);
    var ii = 0;
    for (var q=0; q<NQ; ++q) {
      G[q] = [];   // Filter banks for the q'th scale
      const NP = (6*q || 1); // Number of filter orientations
      const r0 = Math.log2(NI) - q;
      const sth = 0.996*Math.PI/(Math.sqrt(2)*NP); // standard deviation in th
      const den2 = -0.5/(sth*sth);
      for (var p=0; p<NP; ++p) {
        G[q][p] = new Filter(NI, NJ);
        const th0 = ( q%2 ? p : p+0.5 )*Math.PI/NP;
        const sinth0 = Math.sin(th0);
        const costh0 = Math.cos(th0);
        for (var j=0, n=0; j<NJ; ++j) {
          const y = j-NJ/2;
          for (var i=0; i<NI; ++i, ++n) {
            const x = i-NI/2;
            const r = Math.sqrt(x**2 + y**2);
            const dr = r - r0;
            const Gr = Math.exp(dr*dr*den1);

            const th = Math.atan2(-y, x);
            const sinth = Math.sin(th);
            const costh = Math.cos(th);
            const ds = sinth*costh0 - costh*sinth0;
            const dc = costh*costh0 + sinth*sinth0;
            const dth = Math.abs(Math.atan2(ds,dc));
            const Gth = Math.exp(dth*dth*den2);
            
            G[q][p][n] = (q ? Gr*Gth : Math.exp(r*r*den1));
            minG = Math.min(minG, G[q][p][n]);
            maxG = Math.max(maxG, G[q][p][n]);
          }
        }
        this.push(G[q][p]);
      }
    }
    this.lut = new THREE.Lut('cooltowarm', 256);
    this.lut.setMin(minG);
    this.lut.setMax(maxG);
  }
  render() {
    const NI = this.filterWidth;
    const NJ = this.filterWidth;
    const NQ = this.numScales;
    const W = this.canvas.width;
    const H = this.canvas.height;
    let data = new Uint8ClampedArray(4*W*H);
    for (var i=0; i<4*W*H; ++i) data[i] = 0;
    for (var q=0, m=0; q<NQ; ++q) {
      const NP = (6*q || 1); // Number of filter orientations
      let J0 = q*NJ; // Starting row index for q'th scale filter
      let I0 = Math.floor((W - NI*NP)/2); // Starting col index for q'th scale filter
      for (var p=0; p<NP; ++p, ++m) {
        for (var j=0, n=0; j<NJ; ++j) {
          var jj = J0 + j;
          for (var i=0; i<NI; ++i, ++n) {
            var ii = I0 + NI*p + i;
            const color = this.lut.getColor(this[m][n]);
            // for (var a=0; a<3; ++a) data[4*((jj)*W+ii)+a] = 255;
            data[4*((jj)*W+ii)+0] = 255*color.r;
            data[4*((jj)*W+ii)+1] = 255*color.g;
            data[4*((jj)*W+ii)+2] = 255*color.b;
            data[4*((jj)*W+ii)+3] = 255*this[m][n];
          }
        }
      }
    }
    this.img = new ImageData(data, W, H);
    this.context.clearRect(0, 0, W, H);
    this.context.putImageData(this.img, 0, 0);
    if (this.idx >= 0) {
      this.context.strokeStyle = 'green';
      this.context.strokeRect(this.x0, this.y0, NI, NJ);
    }
  }
  onMouseClick( obj ) {
    return function( event ) {
      event.stopPropagation();
      const NI = obj.filterWidth;
      const NJ = obj.filterWidth;
      const NQ = obj.numScales;  // number of length scales
      const W = (NQ>1 ? 6*NI*(NQ-1) : NI);
      const H = NJ*NQ;
      const q = Math.floor(event.layerY/NJ);
      const NP = (6*q || 1); // Number of filters at the q'th scale (mini-column loops)
      const Y0 = q*NJ; // Starting row index for q'th scale filter
      const X0 = Math.floor((W - NI*NP)/2); // Starting col index for q'th scale filter
      const i = Math.floor((event.layerX-X0)/NI);
      obj.x0 = X0 + i*NI;
      obj.y0 = Y0;
      if (i<0 || i>=NP) {
        obj.idx = -1;
      }
      else {
        // Index of the filter under the mouse
        obj.idx = (q>0 ? (1 + 6*(q-1)*q/2) + i : 0);
      }
    };
  }
  onMouseMove( obj ) {
    return function( event ) {
      // event.stopPropagation();
      // const NI = obj.filterWidth;
      // const NJ = obj.filterWidth;
      // const NQ = obj.numScales;  // number of length scales
      // const W = (NQ>1 ? 6*NI*(NQ-1) : NI);
      // const H = NJ*NQ;
      // const q = Math.floor(event.layerY/NJ);
      // const NP = (6*q || 1); // Number of filters at the q'th scale (mini-column loops)
      // const Y0 = q*NJ; // Starting row index for q'th scale filter
      // const X0 = Math.floor((W - NI*NP)/2); // Starting col index for q'th scale filter
      // const i = Math.floor((event.layerX-X0)/NI);
      // obj.x0 = X0 + i*NI;
      // obj.y0 = Y0;
      // if (i<0 || i>=NP) {
      //   obj.idx = -1;
      // }
      // else {
      //   // Index of the filter under the mouse
      //   obj.idx = (q>0 ? (1 + 6*(q-1)*q/2) + i : 0);
      // }
    };
  }
};

