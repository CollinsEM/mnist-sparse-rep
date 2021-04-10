class KSVD {
  constructor(dict) {
    this.initDictionary(dict);
  }
  /// Initialize dictionary
  init(dict) {
    this.A = (dict || new Dictionary());
    this.A.normalize();
    this.N = this.A.length;
  }
  /// Iterate through one cycle
  iterate(samples) {
    this.encodeSamples(samples);
    this.updateDictionary();
  }
  /// Perform sparse encoding on samples with the current dictionary
  encodeSamples(Y) {
    let M = B.length;
  }
  updateDictionary() {
  }
  isConverged() {
  }
};
