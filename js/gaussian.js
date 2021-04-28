class GaussianAtom extends Atom {
  constructor(w, h) {
    super(w, h);
    const sigma = 0.2;
    const den = -1.0/(2*sigma*sigma);
    for (let j=0; j<h; ++j) {
      const y = 2*j/(h-1) - 1;
      for (let i=0; i<w; ++i) {
        const x = 2*i/(w-1) - 1;
        const rSq = x*x + y*y;
        this[j*w+i] = Math.exp(rSq*den);
      }
    }
    this.normalize();
  }
};
