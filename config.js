var config = {};

// on a Pi this should I think be '/dev/serial0' but may need to do some research depending on model/environment
config.BOARD_PORT = "/dev/ttyACM0";
config.PIN_AZIMUTH = 9;
config.PIN_ALTITUDE = 10;
config.DEADBAND_AZIMUTH = [90, 90];
config.DEADBAND_ALTITUDE = [90, 90];

config.CW_AZIMUTH = 0;
config.CW_ALTITUDE = 0;
config.CCW_AZIMUTH = 1;
config.CCW_ALTITUDE = 1;

config.INTERVAL = 5000;
config.MOVEMENT_THRESHOLD_AZI = 0.5;  // under this # of seconds, don't move
config.MOVEMENT_THRESHOLD_ALT = 0.001;

// multipliers to convert degrees to seconds of continuous servo motion
// Note: with current servos, the speed/duration formula doesn't seem to be
// linear. So if you change speed, you have to change the multipliers as well.
config.DEGREES2SECONDS_AZIMUTH_CW = 0.262;
config.DEGREES2SECONDS_AZIMUTH_CCW = 0.2679;
config.SPEED_AZIMUTH = 0.5;
config.DEGREES2SECONDS_ALTITUDE_CW = 0.0065;  // 0.0065;
config.DEGREES2SECONDS_ALTITUDE_CCW = 0.0055;  // 0.0055;
config.SPEED_ALTITUDE_CW = 0.19;
config.SPEED_ALTITUDE_CCW = 0.15;

config.LAT = 40.760248;
config.LON = -73.929272;

module.exports = config;



//~ var five = require("johnny-five");  // http://johnny-five.io/
//~ var config = {};

//~ // on a Pi this should I think be '/dev/serial0' but may need to do some research depending on model/environment
//~ config.BOARD_PORT = "/dev/ttyACM0";
//~ config.STEPSPERREV = 200;  // Typical stepper motors are 1.8 degrees per step, which is 200 steps per revolution
//~ config.PINS_AZIMUTH = {
  //~ step: 2,
  //~ dir: 3
//~ };
//~ config.PINS_ALTITUDE = {
  //~ step: 5,
  //~ dir: 6
//~ };

//~ config.CW_AZIMUTH = five.Stepper.DIRECTION.CCW;
//~ config.CW_ALTITUDE = five.Stepper.DIRECTION.CW;
//~ config.CCW_AZIMUTH = five.Stepper.DIRECTION.CW;
//~ config.CCW_ALTITUDE = five.Stepper.DIRECTION.CCW;
//~ config.RPM_AZIMUTH = 720;  // default 180
//~ config.RPM_ALTITUDE = 180;
//~ config.DEGREES2STEPS_AZIMUTH = 2100;  // would be 0.5555 without gearing
//~ config.DEGREES2STEPS_ALTITUDE = 360;

//~ config.INTERVAL = 5000;

//~ config.LAT = 40.760248;
//~ config.LON = -73.929272;

//~ module.exports = config;