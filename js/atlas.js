//--------------------------------------------------------------------
class Atlas {
  constructor() {
	  // this.trainImage = document.getElementById( 'train-atlas' );
    this.trainImage = new Image;
    this.trainImage.crossOrigin = "Anonymous";
    this.trainImage.addEventListener("load", trainImageLoaded , false);
    this.trainImage.src = "textures/trainAtlas.png";
    
	  // this.testImage = document.getElementById( 'test-atlas' );
    this.testImage = new Image;
    this.testImage.crossOrigin = "Anonymous";
    this.testImage.addEventListener("load", testImageLoaded, false);
    this.testImage.src = "textures/testAtlas.png";
    
    // Generate the canvas where the current signal will be displayed
    this.canvas = document.createElement( 'canvas' );
    this.canvas.width = 28;
    this.canvas.height = 28;
    this.context = this.canvas.getContext( '2d', { willReadFrequently: true } );
    this.dom = document.getElementById('input-signal');
    this.dom.appendChild(this.canvas);
    this.canvas.onclick = function( event ) { atlas.getTrainDigit(); };
  }
  getTrainDigit(digit) {
    const i = 28*Math.floor(this.numTrain*Math.random());
    const j = (digit || Math.floor(10*Math.random()));
    this.context.drawImage(this.trainImage, i, 28*j, 28, 28, 0, 0, 28, 28);
    return this.context.getImageData(0, 0, 28, 28);
  }
  getTestDigit(digit) {
    const i = 28*Math.floor(this.numTest*Math.random());
    const j = (digit || Math.floor(10*Math.random()));
    this.context.drawImage(this.testImage, i, 28*j, 28, 28, 0, 0, 28, 28);
    return this.context.getImageData(0, 0, 28, 28);
  }
  getImageData() {
    return this.context.getImageData(0, 0, 28, 28);
  }
}
//--------------------------------------------------------------------
// this => atlas.trainImage
function trainImageLoaded(event) {
  atlas.numTrain = atlas.trainImage.naturalWidth/28;
  console.log("Number of samples of each digit in training set: ", atlas.numTrain);
  // let canvas = document.createElement("canvas");
  // let context = canvas.getContext( '2d', { willReadFrequently: true } );
  // canvas.width = this.naturalWidth;
  // canvas.height = this.naturalHeight;
  // context.drawImage(this, 0, 0);
  // try {
  //   localStorage.setItem("train-atlas", canvas.toDataURL("image/png"));
  // }
  // catch(err) {
  //   console.log("ERROR: " + err);
  // }
}
//--------------------------------------------------------------------
// this => atlas.testImage
function testImageLoaded(event) {
  atlas.numTest  = atlas.testImage.naturalWidth/28;
  console.log("Number of samples of each digit in testing set: ", atlas.numTest);
  // let canvas = document.createElement("canvas");
  // let context = canvas.getContext( '2d', { willReadFrequently: true } );
  // canvas.width = this.naturalWidth;
  // canvas.height = this.naturalHeight;
  // context.drawImage(this, 0, 0);
  // try {
  //   localStorage.setItem("test-atlas", canvas.toDataURL("image/png"));
  // }
  // catch(err) {
  //   console.log("ERROR: " + err);
  // }
}
