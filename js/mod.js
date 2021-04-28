class MOD {
  constructor() {
    this.W = Math.floor(28/NI);
    this.H = Math.floor(28/NJ);
    this.M = this.W*this.H;
  }
  /// Initialize dictionary
  init(dict) {
    this.N = dict.length || 2*this.M;
    this.dict = dict || new Dictionary(Math.floor(28/NI), Math.floor(28/NJ), this.N);
    this.dict.normalize();
  }
  /// Iterate through one training cycle. Given a set of samples from
  /// the training set, decompose them into NIxNJ patches in each
  /// color channel.
  iterate(imgData) {
    const [X,Y] = this.encodeSamples(imgSet);
    this.updateDictionary(X, Y);
  }
  /// Perform sparse encoding on samples with the current dictionary
  encodeSamples(imgData) {
    const W = this.W, H = this.H;
    let Y = new Array(3*NI*NJ*imgData.length);
    let X = new Array(Y.length);
    imgData.forEach( function( img, idx ) {
      for (let j=0; j<NJ; ++j) {
        for (let i=0; i<NI; ++i) {
          for (let c=0; c<3; ++c) {
            Y[3*idx+c] = new Uint8Array(W*H);
            for (y=j*H; y<(j+1)*H; ++y) {
              for (x=i*W; x<(i+1)*W; ++x) {
                Y[3*idx+c][y*W+x] = imgData.data[(y*28+x)*4+c];
              }
            }
            X[idx*3+c] = this.dict.encode(Y[3*idx+c]);
          }
        }
      }
    } );
    return [X, Y];
  }
  updateDictionary(X, Y) {
    
  }
  isConverged() {
  }
};
