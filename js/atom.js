//--------------------------------------------------------------------
class Atom extends Float32Array {
  constructor(w, h, buff) {
    super(w*h);
    this.width = w;
    this.height = h;
    this.M = w*h;
    this.weight = 1;
    if (buff !== undefined) // Use buff if it is provided
      for (let m=0; m<this.M; ++m) this[m] = buff[m];
    else // Otherwise generate a random vector
      for (let m=0; m<this.M; ++m) this[m] = Math.random();
    this.normalize();
  }
  /// Normalize the atom so that it has a vector magnitude of 1.0
  normalize() {
    let sum = 0;
    for (let m=0; m<this.M; ++m) sum += this[m]*this[m];
    const den = 1.0/Math.sqrt(sum);
    for (let m=0; m<this.M; ++m) this[m] *= den;
  }
  apply(digit) {
    if (digit===undefined) digit = atlas.getImageData();
    let sum = this.reduceRight( function(prev, curr, idx, arr) {
      return prev + curr*digit.data[idx];
    } );
    console.log(sum);
  }
};
//--------------------------------------------------------------------
class AtomView {
  constructor(atom) {
    this.atom = atom;
    this.width = atom.width;
    this.height = atom.height;
    this.canvas = document.createElement( 'canvas' );
    this.canvas.className = "filter";
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.context = this.canvas.getContext( '2d', { willReadFrequently: true } );
    this.render();
  }
  render() {
    let min=1000, max=-1000;
    for (let j=0, ij=0; j<this.height; ++j) {
      for (let i=0; i<this.width; ++i, ++ij) {
        min = Math.min(min, this.atom[ij]);
        max = Math.max(max, this.atom[ij]);
      }
    }
    let imgData = this.context.getImageData(0, 0, this.width, this.height);
    for (let j=0, ij=0; j<this.height; ++j) {
      for (let i=0; i<this.width; ++i, ++ij) {
        for (let k=0; k<3; ++k) {
          //imgData.data[4*ij+k] = Math.floor(255*(this[ij]-min)/(max-min));
          imgData.data[4*ij+k] = Math.floor(255*this.atom[ij]);
        }
        imgData.data[4*ij+3] = 255;
      }
    }
    this.context.putImageData(imgData, 0, 0);
  }
  clear() {
    let imgData = this.context.getImageData(0, 0, this.width, this.height);
    for (let j=0, ij=0; j<this.height; ++j) {
      for (let i=0; i<this.width; ++i, ++ij) {
        for (let k=0; k<3; ++k) {
          imgData.data[4*ij+k] = 0;
        }
        imgData.data[4*ij+3] = 0;
      }
    }
    this.context.putImageData(imgData, 0, 0);
  }
};
