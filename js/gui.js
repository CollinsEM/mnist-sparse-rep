"use strict";

class GUI extends dat.GUI {
  constructor() {
    super();
    //----------------------------------------------------------------
	  this.animate = true;
    this.add( this, "animate" )
      .onChange( function( value ) {
        if (value) animate();
      } );
    //----------------------------------------------------------------
	  this.randomAtoms = false;
    this.add( this, "randomAtoms" )
      .onChange( function( value ) {
        dictionary.clear();
      } );
    //----------------------------------------------------------------
	  this.enableLearning = false;
    this.add( this, "enableLearning" )
      .onChange( function( value ) {
        doLearning = value;
      } );
    //----------------------------------------------------------------
	  this.learningRate = eta;
    this.add( this, "learningRate", 0, 1, 0.01 )
      .onChange( function( value ) {
        eta = value;
      } );
    //----------------------------------------------------------------
	  // this.numSplits = 4;
    // this.add( this, "numSplits", [1,2,4,7] )
    //   .onChange( function( value ) {
    //     NI = value;
    //     NJ = value;
    //     var w = 28/NI;
    //     var h = 28/NJ;
    //     dictionary.clear();
    //     dictionary.w = w;
    //     dictionary.h = h;
    //     dictionary.M = w*h;
    //     sensor.init(NI, NJ);
    //     dt = DT; // Force a graphics update
    //   } );
    //----------------------------------------------------------------
	  this.numAtoms = Math.floor(dictSize*sparsity);
    this.add( this, "numAtoms", 1, maxAtoms, 1 )
      .onChange( function( value ) {
        sensor.forEach( function( patch ) {
          patch.K = value;
          patch.ctxAtoms.forEach( function( ctx ) {
            ctx.clearRect(0, 0, 28, 28);
          } );
        } );
        dt = DT; // Force a graphics update
      } );
    //----------------------------------------------------------------
    // this.seqMenu = this.addFolder("MNIST Sequence");
    // this.NI = 3;
    // this.seqMenu.add( this, "NI", 1, 5, 1 )
    //   .onChange( function( value ) {
    //     if (value != seqView.NI) seqView.resize( gui.NI, gui.NJ );
    //   } );
    // this.NJ = 5;
    // this.seqMenu.add( this, "NJ", 1, 10, 1 )
    //   .onChange( function( value ) {
    //     if (value != seqView.NJ) seqView.resize( gui.NI, gui.NJ );
    //   } );
    //----------------------------------------------------------------
	  // this.showNeurons = true;
	  // this.add( this, "showNeurons" )
    //   .onChange( function( value ) {
    //     cortexView.camera.layers.toggle(neuronLayer);
    //   } );
    //----------------------------------------------------------------
	  // this.showColumns = true;
	  // this.add( this, "showColumns" )
    //   .onChange( function( value ) {
    //     cortexView.camera.layers.toggle(columnLayer);
    //   } );
    //----------------------------------------------------------------
	  // this.showMiniColumns = true;
	  // this.add( this, "showMiniColumns" )
    //   .onChange( function( value ) {
    //     cortexView.camera.layers.toggle(miniColumnLayer);
    //   } );
    //----------------------------------------------------------------
	  // this.showProxDendrites = false;
	  // this.add( this, "showProxDendrites" )
    //   .onChange( function( value ) {
    //     cortexView.camera.layers.toggle(proximalLayer);
    //   } );
    //----------------------------------------------------------------
	  // this.showApical = false;
	  // this.add( this, "showApical" )
    //   .onChange( function( value ) {
    //     cortexView.camera.layers.toggle(apicalLayer);
    //   } );
    //----------------------------------------------------------------
	  // this.saccade = true;
	  // this.add( this, "saccade" )
    //   .onChange( function( value ) {
    //     cortex.allowSaccades( value );
    //   } );
    //----------------------------------------------------------------
	  // this.gabor = true;
	  // this.add( this, "gabor" );
	  // this.add( this, "gabor" )
    //   .onChange( function( value ) {
    //   } );
    //----------------------------------------------------------------
	  // this.numNeurons = numNeurons;
	  // this.add( this, "numNeurons", 0, maxNeurons, 1 )
    //   .onChange( function( value ) {
    //     cortex.columns.forEach( function(col, idx) {
		//       col.miniColumns.forEach( function(mc) {
    //         mc.setNumNeurons(value);
    //       } );
    //     } );
	  //   } );
    //----------------------------------------------------------------
	  // this.numColumns = maxColumns;
	  // this.add( this, "numColumns", 1, maxColumns, 1 )
    //   .onChange( function( value ) {
    //     cortex.columns.forEach( function(col, idx) {
    //       col.visible = (idx < gui.numColumns);
    //     } );
	  //   } );
    //----------------------------------------------------------------
    // this.opacity = 0.2;
	  // this.add( this, "opacity", 0, 1, 0.01 )
    //   .onChange( function( value ) {
    //     cortex.columns.forEach( function(col, idx) {
		//       col.miniColumns.forEach( function(mc) {
    //         mc.mat.opacity = parseFloat( value );
    //       } );
    //     } );
	  //   } );
    //----------------------------------------------------------------
    // this.sensorRadius = 3;
	  // this.add( this, "sensorRadius", 1, maxSensorRadius, 0.5 );
    //----------------------------------------------------------------
    // this.moving = false;
	  // this.add( this, "moving" );
    //----------------------------------------------------------------
	  // this.limitSynapses = false;
    //----------------------------------------------------------------
	  // this.maxSynapses = 20;
    //----------------------------------------------------------------
	  // this.maxProximalDist = maxProximalDistance;
    //----------------------------------------------------------------
    // this.numProximalDend = numProximalDendrites;
    //------------------------------------
    // this.prox = this.addFolder('Proximal');
	  // this.prox.add( this, "numProximalDend", 1, maxProximalDendrites, 1 )
    //   .onChange( function( value ) {
    //     numProximalDendrites = value;
    //     computeProximalSynapses();
    //   } );
	  // this.prox.add( this, "maxProximalDist", 100, 300 )
    //   .onChange( function( value ) {
    //     maxProximalDistance = value;
    //     computeProximalSynapses();
    //   } );
    //----------------------------------------------------------------
    // DISTAL
    //------------------------------------
    // this.distal = this.addFolder('Distal');
    // //------------------------------------
	  // this.distal.show = false;
	  // this.distal.add( this.distal, "show" )
    //   .onChange( function( value ) {
    //     cortexView.camera.layers.toggle(distalLayer);
    //   } );
    // this.distal.threshold = 10;
	  // this.distal.add( this.distal, "threshold", 1, 100, 1 );
    // this.distal.numSegments = 1;
	  // this.distal.add( this.distal, "numSegments", 1, 20, 1 )
    // //   .onChange( function( value ) {
    // //     numDendriteSegments = value;
    // //   } );
    // //------------------------------------
    // this.apical = this.addFolder('Apical');
    // this.apical.threshold = 10;
	  // this.apical.add( this.apical, "threshold", 1, 100, 1 );
    // //------------------------------------
    // this.proximal = this.addFolder('Proximal');
    // this.proximal.threshold = 10;
	  // this.proximal.add( this.proximal, "threshold", 1, 100, 1 );
  }
};
