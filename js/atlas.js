//--------------------------------------------------------------------
class Atlas {
  constructor() {
	  this.img = document.getElementById( 'atlas' );
    // This is the number of columns of digits in the atlas image.
    this.W = this.img.naturalWidth/28;
    // This is the number of rows of digits in the atlas (should be 10)
    this.H = this.img.naturalHeight/28;
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
  updateDigit(digit) {
    const i = 28*Math.floor(this.W*Math.random());
    const j = (digit || Math.floor(10*Math.random()));
    this.context.drawImage(this.img, i, 28*j, 28, 28, 0, 0, 28, 28);
    return this;
  }
  getImageData() {
    return this.context.getImageData(0, 0, 28, 28);
  }
}
