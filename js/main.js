"use strict";

const sqrt3 = Math.sqrt(3);
const NI = 4, NJ = 4;
const dictSize = NI*NJ*8;
const sparsity = 0.02;
const maxAtoms = Math.max(dictSize*sparsity, 5);

var camera, scene, renderer, stats, gui;
var atlas, dictionary, sensor;
var domTarget, domDictionary;
//--------------------------------------------------------------------
function PSNR(A, B) {
  let den = 0.0;
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
  
  atlas = new Atlas();
  
  dictionary = new Dictionary(dx, dy, 0);

  sensor = new Sensor(NI, NJ);
  
  gui = new GUI();
  
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
  // Only update the once every 2 seconds
  if (dt < DT) {
    dt += clock.getDelta();
  }
  else {
    dt = 0;
    atlas.updateDigit();
    if (dictionary.length < dictSize) {
      const digit = atlas.getImageData();
      document.getElementById('status').innerHTML = "Initializing Dictionary";
      const W = digit.width;
      const H = digit.height;
      const dx = dictionary.w;
      const dy = dictionary.h;
      const M = dx*dy;
      let R = new Float32Array(M);
      for (let j=0; j<NJ; ++j) {
        for (let i=0; i<NI; ++i) {
          // We should probably sample more than one color buffer.
          let c = 0;
          let sum = 0;
          for (let y=0, m=0; y<dy; ++y) {
            for (let x=0; x<dx; ++x, ++m) {
              R[m] = digit.data[4*((j*dy+y)*W+(i*dx+x))+c];
              sum += R[m];
            }
          }
          // If the subsample of the image extracted above is blank,
          // then just use a random atom.
          dictionary.addAtom(sum>10 ? new Atom(dx, dy, R) : new Atom(dx, dy));
        }
      }
    }
    else if (gui.enableLearning) {
      document.getElementById('status').innerHTML = "Updating Dictionary";
      const M = dictionary.M;
      const N = dictionary.length;
      const P = maxSamples;
      const X = new Float32Array(N*P);
      doLearning = false;
    }
    else {
      const digit = atlas.getImageData();
      document.getElementById('status').innerHTML = "Encoding Samples";
      sensor.encode(digit, dictionary);
      sensor.render();
      // idx++;
      // doLearning = (idx%maxSamples == 0);
    }
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
