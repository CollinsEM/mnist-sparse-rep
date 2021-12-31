"use strict";

const sqrt3 = Math.sqrt(3);
let NI = 4, NJ = 4;
// Each patch has (28/NI)*(28/NJ) pixels, So the vector length of each atom is M
// const M = (28/NI)*(28/NJ);
const dictSize = 8*NI*NJ;
const sparsity = 0.02;
const maxAtoms = Math.floor(2*dictSize*sparsity);
const maxSamples = 1;

var camera, scene, renderer, stats, gui;
var atlas, dictionary, sensor, mod, omp;
var domTarget, domDictionary;
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
const DT = 1;
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
  else {
    if (!atlas.numTrain) console.warn("Training images not loaded.");
    if (!atlas.numTest) console.warn("Testing images not loaded.");
  }
  if (!gui.enableLearning && dictionary.length < dictSize) {
    dt = 0;
    if (gui.randomAtoms) {
      document.getElementById('status').innerHTML = "Initializing dictionary with random atoms.";
      for (let i=dictionary.length; i<dictSize; ++i) {
        dictionary.addAtom(new Atom(dx, dy));
      }
    }
    // Initialize the dictionary with samples from the training set
    else if (atlas.numTrain) {
      document.getElementById('status').innerHTML = "Initializing dictionary with samples from training data set.";
      const digit = atlas.getTrainDigit();
      const W = digit.width;
      const H = digit.height;
      const M = dx*dy;
      let R = new Float32Array(M);
      for (let y0=0; y0<H; y0+=dy) {
        for (let x0=0; x0<W; x0+=dx) {
          // We should probably sample more than one color buffer.
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
  }
  else if (gui.enableLearning && atlas.numTrain) {
    dt = 0;
    document.getElementById('status').innerHTML = "Refining dictionary with samples from training data set.";
    const M = dictionary.M;
    const N = dictionary.length;
    const P = maxSamples;
    let samples = new Array(maxSamples);
    for (let p=0; p<P; ++p) samples[p] = atlas.getTrainDigit();
    if (!mod.dict) mod.init(dictionary);
    const [X,Y] = mod.encodeSamples(samples);
    console.log(X);
    console.log(Y);
    doLearning = false;
  }
  else if (atlas.numTest) {
    dt = 0;
    document.getElementById('status').innerHTML = "Encoding samples from testing data set.";
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

