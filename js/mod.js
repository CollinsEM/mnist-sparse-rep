class MOD {
  constructor() {
    this.W = Math.floor(28/NI);
    this.H = Math.floor(28/NJ);
    this.M = this.W*this.H;
    this.init();
  }
  /// Initialize dictionary
  init(w, h, dict) {
    this.dict = dict || new Dictionary(this.W, this.H);
    this.dict.normalize();
  }
  /// Iterate through one training cycle. Given a set of samples from
  /// the training set, decompose them into NIxNJ patches in each
  /// color channel.
  batchUpdate(imgSet) {
    const [S,Z,R] = this.batchEncode(imgSet);
    this.updateDictionary(S,Z,R);
  }
  /// Perform sparse encoding on samples with the current dictionary
  batchEncode(imgSet) {
    const W = this.W;
    const H = this.H;
    const P = imgSet.length || 1;
    let Y = new Float32Array(3*NI*NJ*P);
    let X = new Float32Array(P);
    if (imgSet.length) {
      for (let i=0; i<P; ++i) {
        this.encodeImage(imgSet[i]);
      }
    }
    return [X, Y];
  }
  /// Perform sparse encoding on a single image
  encodeImage(img) {
    const W = this.W;
    const H = this.H;
    const M = W*H;
    const EPS = 100;
    let S = [], Z = [], R = [];
    for (let j=0, y0=0; j<NJ; ++j, y0+=H) {
      for (let i=0, x0=0; i<NI; ++i, x0+=W) {
        let P = Uint8Array(M);
        for (let y=0; y<H; ++y) {
          for (let x=0; x<W; ++x) {
            P[y*W+x] = img.data[((y0+y)*28+(x0+x))*4+0];
          }
        }
        let [s, z, r] = encodePatch(P);
        if (gui.enableLearning && R.reduce( x => x*x ) > EPS) {
          z[s.length] = 1;
          s.push(this.dict.length);
          this.dict.addAtom(new Atom(W, H, r));
          for (let m=0; m<M; ++m) r[m] = 0;
        }
        S.push(s), Z.push(z), R.push(r);
      }
    }
  }
  /// Encode a single WxH, single channel image patch
  encodePatch(R) {
    const W = Math.floor(28/NI);
    const H = Math.floor(28/NJ);
    const M = W*H;
    const N = this.dict.length;
    const K = gui.numAtoms;
    const EPS = 100;
    let S = [];
    let Z = new Float32Array(K);  Z.fill(0.0, 0, K);
    let L2 = R.reduce( x => x*x );
    for (let k=0; k<K && L2 > EPS; ++k) {
      let zMax = -1, sMax = -1;
      for (let s=0; s<N; ++s) {
        let z = this.dict[s].reduce( (x, i) => x*R[i] );
        if (z>zMax) { zMax = z; sMax = s; }
      }
      S.push(sMax);
      Z[k] = zMax;
      for (let i=0; i<M; ++i) {
        R[i] -= zMax*this.dict[sMax][i];
      }
      L2 = R.reduce( x => x*x );
    }
    console.log("L2(R):", L2);
    return [S, Z, R];
  }
  updateDictionary(S, Z, R) {
    
  }
  isConverged() {
  }
};
