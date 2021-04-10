//--------------------------------------------------------------------
class Atlas {
  constructor() {
	  this.trainSet = document.getElementById( 'train-atlas' );
	  this.testSet = document.getElementById( 'test-atlas' );
    // This is the number of columns of digits in the atlas image.
    this.numTrain = this.trainSet.naturalWidth/28;
    this.numTest  = this.testSet.naturalWidth/28;
    console.log("Number of samples of each digit in training set: ", this.numTrain);
    console.log("Number of samples of each digit in testing set: ", this.numTest);
    // This is the number of rows of digits in the atlas (should be 10)
    // this.H = this.img.naturalHeight/28;
    this.canvas = document.createElement( 'canvas' );
    this.canvas.width = 28;
    this.canvas.height = 28;
    this.context = this.canvas.getContext('2d');
    this.dom = document.getElementById('input-signal');
    this.dom.appendChild(this.canvas);
    this.canvas.onclick = function( event ) {
      // this: canvas element
      // use atlas to call getDigit
      atlas.updateDigit(Math.floor(10*Math.random()));
    };
  }
  getTrainDigit(digit) {
    const i = 28*Math.floor(this.numTrain*Math.random());
    const j = (digit || Math.floor(10*Math.random()));
    this.context.drawImage(this.trainSet, i, 28*j, 28, 28, 0, 0, 28, 28);
    return this.context.getImageData(0, 0, 28, 28);
  }
  getTestDigit(digit) {
    const i = 28*Math.floor(this.numTest*Math.random());
    const j = (digit || Math.floor(10*Math.random()));
    this.context.drawImage(this.trainSet, i, 28*j, 28, 28, 0, 0, 28, 28);
    return this.context.getImageData(0, 0, 28, 28);
  }
  getImageData() {
    return this.context.getImageData(0, 0, 28, 28);
  }
}
