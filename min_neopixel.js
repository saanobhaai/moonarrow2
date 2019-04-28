var five = require("johnny-five");  // http://johnny-five.io/
var pixel = require("node-pixel");  // https://github.com/ajfisher/node-pixel

var board = new five.Board();
var strip = null;

board.on("ready", function() {
  strip = new pixel.Strip({
      board: this,
      controller: "FIRMATA",
      strips: [ {pin: 6, length: 200}, ],
      gamma: 2.8, // set to a gamma that works nicely for WS2812
  });

  strip.on("ready", function() {
    // Set the entire strip to pink.
    strip.color('#903');

    strip.show();
  });
});
