var five = require("johnny-five");  // http://johnny-five.io/

var board = new five.Board();
board.on("ready", function() {
  var led = new five.Led({
    pin: 6
  });

  led.brightness(255);
  setTimeout(function() {
    setTimeout(function() {
      led.off();
    }, 5 * 1000);
    led.brightness(32);
  }, 10 * 1000);

  //~ var led = new five.Pin({
      //~ pin: 6
  //~ });
  
  //~ led.high();
  //~ setTimeout(function() {
    //~ led.low();
  //~ }, 5 * 1000);
});
