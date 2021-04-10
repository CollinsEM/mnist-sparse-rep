//--------------------------------------------------------------------
class Dictionary extends Array {
  // Construct a dictionary of atoms of size w x h.
  constructor(w, h, numAtoms) {
    super();
    this.w = w;
    this.h = h;
    this.M = w*h;
    this.domDictionary = document.getElementById('dictionary');
    this.domOverlap = document.getElementById('overlap');
    this.atomViews = new Array();
    const N = (numAtoms || 0);
    for (let i=0; i<N; ++i) this.addAtom();
    // Keep track of how often each atom gets used
    this.dutyCycle = new Array();
  }
  addAtom(atom) {
    if (atom===undefined) atom = new Atom(this.w, this.h);
    this.push(atom);
    let view = new AtomView(atom);
    view.render();
    this.domDictionary.appendChild(view.canvas);
    this.atomViews.push(view);
  }
  normalize() {
    this.forEach( function( atom ) {
      atom.normalize();
    } );
  }
  // createOverlap(atom) {
  //   const ni = Math.sqrt(this.M), nj = ni;
  //   let canvas = document.createElement('canvas');
  //   canvas.className = "filter";
  //   canvas.width = ni;
  //   canvas.height = nj;
  //   let context = canvas.getContext('2d');
  //   const idx = this.overlap.length;
  //   this.overlap.push(context);
  //   this.domOverlap.append(canvas);
  // }
  // computeOverlap(input) {
  //   const ni = Math.sqrt(this.M), nj = ni;
  //   for (let n=0; n<this.length; ++n) {
  //     const atom = this[n];
  //     let output = this.overlap[n].getImageData(0,0,ni,nj);
  //     let min = 1000, max = 0;
  //     for (let ij=0; ij<this.M; ++ij) {
  //       for (let k=0; k<3; ++k) {
  //         output.data[4*ij+k] = input.data[4*ij+k]*atom[ij];
  //         min = Math.min(min, output.data[4*ij+k]);
  //         max = Math.max(max, output.data[4*ij+k]);
  //       }
  //       output.data[4*ij+3] = 255
  //     }
  //     this.overlap[n].putImageData(output, 0, 0);
  //   }
  // }
};
