//--------------------------------------------------------------------
class Dictionary extends Array {
  // Construct a dictionary of atoms of size w x h.
  constructor(w, h) {
    super();
    this.w = w;
    this.h = h;
    this.M = w*h;
    this.domDictionary = document.getElementById('dictionary');
    this.domOverlap = document.getElementById('overlap');
    this.atomViews = new Array();
    // Keep track of how often each atom gets used
    this.dutyCycle = new Array();
  }
  addAtom(atom) {
    if (atom===undefined) atom = new Atom(this.w, this.h);
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
  normalize() {
    this.forEach( function( atom ) {
      atom.normalize();
    } );
  }
  clear() {
    this.length = 0;
    this.atomViews.forEach( (view) => view.clear() );
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
