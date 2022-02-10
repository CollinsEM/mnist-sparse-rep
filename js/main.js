"use strict";

const sqrt3 = Math.sqrt(3);
let NI = 4, NJ = 4;
// Each patch has (28/NI)*(28/NJ) pixels, So the vector length of each
// atom is (28*28)/(NI*NJ);
const atomSize = (28/NI)*(28/NJ);
// Initialize dictionary with samples from at least numSamp training images
const numSamp = 8;
const dictSize = numSamp*NI*NJ;
// Minimum sparsity of encoded patches
const sparsity = 0.02;
// Maximum number of atoms used to encode each patch
const maxAtoms = Math.floor(2*dictSize*sparsity);
// Learning rate
var eta = 0.1;
var gui, atlas, dictionary, sensor, mod, omp;
var domTarget, domDictionary;

//--------------------------------------------------------------------
// Compute peak signal-to-noise ratio
//--------------------------------------------------------------------
function PSNR(A, B) {
  let mse = 0.0;
  for (let i=0; i<A.length; ++i) {
    const delta = (A[i] - B[i]);
    mse += delta;
  }
  mse /= A.length;
  return 10*Math.log(255*255/mse);
}

//--------------------------------------------------------------------
window.addEventListener( 'load', init, false );
//--------------------------------------------------------------------
function init() {
  const dx = 28/NI, dy = 28/NJ;
  
  gui = new GUI();
  
  atlas = new Atlas();
  
  dictionary = new Dictionary(dx, dy, 0);

  sensor = new Sensor(NI, NJ);

  mod = new MOD();

  omp = new OMP();
  
  animate();
}
//--------------------------------------------------------------------
function animate() {
  // Schedule the next screen refresh
  if (gui.animate) requestAnimationFrame( animate );
  render();
}
//--------------------------------------------------------------------
const clock = new THREE.Clock();
const DT = 1; // Refresh rate
let dt = DT;
let idx = 0;
let doLearning = false;
function render() {
  const dx = dictionary.w;
  const dy = dictionary.h;
  
  // Only update the display once every DT seconds
  if (dt < DT) {
    dt += clock.getDelta();
    return;
  }
  else if (!atlas.numTrain) {
    console.warn("Training images not loaded.");
    dt = 0;
    return;
  }
  else if (!atlas.numTest) {
    console.warn("Testing images not loaded.");
    dt = 0;
    return;
  }
  
  // Initialize the dictionary with samples from the training set
  if (dictionary.length < dictSize) {
    dt = 0;
    if (gui.randomAtoms) {
      var msg =  "Initializing dictionary with random atoms.";
      document.getElementById('status').innerHTML = msg;
      for (let i=0; i<dictSize; ++i) {
        dictionary.addAtom(new Atom(dx, dy));
      }
    }
    else if (atlas.numTrain > 0) {
      var msg = "Initializing dictionary with samples from training set.";
      document.getElementById('status').innerHTML = msg;
      const digit = atlas.getTrainDigit();
      const W = digit.width;
      const H = digit.height;
      const M = dx*dy;
      let R = new Float32Array(M);
      for (let y0=0; y0<H; y0+=dy) {
        for (let x0=0; x0<W; x0+=dx) {
          // We should probably sample more than one color buffer, but
          // for MNIST, one color is sufficient.
          let c = 0;
          let sum = 0;
          for (let y=0, m=0; y<dy; ++y) {
            for (let x=0; x<dx; ++x, ++m) {
              R[m] = digit.data[4*((y0+y)*W+(x0+x))+c];
              sum += R[m];
            }
          }
          if (sum > 10) { // Don't add blank atoms to dictionary
            dictionary.addAtom(new Atom(dx, dy, R));
          }
          if (dictionary.length >= dictSize) return;
        }
      }
    }
    return;
  }
  
  if (doLearning) {
    if (atlas.numTrain > 0) {
      dt = 0;
      var msg = "Refining dictionary with samples from training data set.";
      document.getElementById('status').innerHTML = msg;
      const digit = atlas.getTrainDigit();
      const W = digit.width;
      const H = digit.height;
      const M = dx*dy;
      const N = dictionary.length;
      let R = new Float32Array(M);
      let samples = new Array(maxSamples);
      for (let p=0; p<P; ++p) samples[p] = atlas.getTrainDigit();
      if (!mod.dict) mod.init(dictionary);
      const [X,Y] = mod.encodeSamples(samples);
      console.log(X);
      console.log(Y);
      doLearning = false;
    }
  }
  else if (atlas.numTest > 0) {
    dt = 0;
    var msg = "Encoding samples from testing data set.";
    document.getElementById('status').innerHTML = msg;
    const digit = atlas.getTestDigit();
    sensor.encode(digit, dictionary);
    sensor.render();
    // idx++;
    // doLearning = (idx%maxSamples == 0);
  }
}

// let doUpdate = false;

//--------------------------------------------------------------------
// window.addEventListener( 'resize', onWindowResize, false );
//--------------------------------------------------------------------
// function onWindowResize() { }

//--------------------------------------------------------------------
// window.addEventListener( 'mouseup', onMouseUp, false );
//--------------------------------------------------------------------
// function onMouseUp() { doUpdate = false; }

//--------------------------------------------------------------------
// window.addEventListener( 'mousedown', onMouseDown, false );
//--------------------------------------------------------------------
// function onMouseDown() { doUpdate = true; }

//--------------------------------------------------------------------
// window.addEventListener( 'mousemove', onMouseMove, false );
//--------------------------------------------------------------------
// function onMouseMove() { if (doUpdate) render(); }
//--------------------------------------------------------------------

