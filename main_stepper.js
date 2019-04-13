var events = require('events');
var suncalc = require('suncalc');  // https://github.com/mourner/suncalc
var five = require("johnny-five");  // http://johnny-five.io/
const config = require('./config');

console.info("Initializing port...");
var board = new five.Board({
  port: config.BOARD_PORT
});

function radians2Degrees(angle) {
  return angle * (180 / Math.PI);
}


var Arrow = function() {
  this.stepper_azimuth = new five.Stepper({
    type: five.Stepper.TYPE.DRIVER,
    stepsPerRev: config.STEPSPERREV,
    pins: config.PINS_AZIMUTH
  });
  //~ this.stepper_altitude = new five.Stepper({
    //~ type: five.Stepper.TYPE.DRIVER,
    //~ stepsPerRev: config.STEPSPERREV,
    //~ pins: config.PINS_ALTITUDE
  //~ });
  this.imu = new five.IMU({
    controller: "BNO055",
    // enableExternalCrystal: false
  });

  this.azimuth = 0;
  this.altitude = 0;
  this.moving_azimuth = false;
  this.moving_altitude = false;
};
Arrow.prototype = new events.EventEmitter;

Arrow.prototype.on('done:azimuth', function() {
  var self = this;
  self.moving_azimuth = false;
  self.azimuth = Math.floor(self.imu.magnetometer.heading);
  console.log("end azimuth: " + self.azimuth);
});
Arrow.prototype.on('done:altitude', function() {
  var self = this;
  self.moving_altitude = false;
  self.altitude = Math.floor(self.imu.accelerometer.pitch);
  console.log("end altitude: " + self.altitude);
});


Arrow.prototype.moveDegrees = function(
  type,
  degrees,
  direction,
  speed
) {
  var self = this;
  var stepper = (type === 'azimuth') ? self.stepper_azimuth : self.stepper_altitude;
  var multiplier = (type === 'azimuth') ? config.DEGREES2STEPS_AZIMUTH : config.DEGREES2STEPS_ALTITUDE;
  var steps = degrees * multiplier;
  var rpm = (typeof speed === 'undefined') ? config.RPM_ALTITUDE : speed;
  console.log(steps);

  stepper.step({
    steps: steps,
    direction: direction,
    rpm: rpm
  }, function() {
    self.emit('done:' + type);
    console.log("moved " + type + " " + steps + " steps " + direction);
  });
};

Arrow.prototype.moveToAzimuth = function(
  degrees,  // absolute location, 0 - 360
) {
  var self = this;
  if (degrees > 360 || degrees < -360) {
    console.error('moveToAzimuth called with > 360 or < -360 degrees. Ignoring.');
    return;
  } else if (degrees === 360 || degrees === -360) {
    degrees = 0;
  }

  var azimuth = self.azimuth;
  console.log('azimuth: ' + azimuth);
  var degreesToMove = Math.abs(degrees - azimuth);
  var direction = config.CW_AZIMUTH;
  if (degrees - azimuth < 0) direction = config.CCW_AZIMUTH;
  // If going more than halfway around the circle, take the shorter route
  if (degreesToMove > 180) {
    degreesToMove = 360 - degreesToMove;
    direction = Math.abs(direction - 1);
  }
  //~ var direction = five.Stepper.DIRECTION.CW;
  //~ if (degrees - azimuth < 0) direction = five.Stepper.DIRECTION.CCW;
  //~ // If going more than halfway around the circle, take the shorter route
  //~ if (degreesToMove > 180) {
    //~ degreesToMove = 360 - degreesToMove;
    //~ direction = Math.abs(direction - 1);
  //~ }

  console.log('azi degreesToMove: ' + degreesToMove);
  console.log('azi direction: ' + direction);
  self.moving_azimuth = true;
  self.moveDegrees('azimuth', degreesToMove, direction, config.RPM_AZIMUTH);
};


Arrow.prototype.moveToAltitude = function(
  degrees,  // absolute location, -90 - 90
) {
  var self = this;
  if (degrees > 90 || degrees < -90) {
    console.error('moveToAltitude() called with > 90 or < -90 degrees. Ignoring.');
    return;
  }

  var altitude = self.altitude;
  console.log('altitude: ' + altitude);
  var degreesToMove = Math.abs(degrees - altitude);
  var direction = config.CW_ALTITUDE;
  if (degrees - azimuth < 0) direction = config.CCW_ALTITUDE;
  //~ var direction = five.Stepper.DIRECTION.CW;
  //~ if (degrees - altitude < 0) direction = five.Stepper.DIRECTION.CCW;

  console.log('alt degreesToMove: ' + degreesToMove);
  console.log('alt direction: ' + direction);
  self.moving_altitude = true;
  self.moveDegrees('altitude', degreesToMove, direction, config.RPM_ALTITUDE);
};


var trackMoon = function() {
  var arrow = new Arrow();

  var arrowInterval = setInterval(function() {
    // From https://github.com/mourner/suncalc, south = 0: "azimuth in radians (direction along the horizon, measured from south to west), e.g. 0 is south and Math.PI * 3/4 is northwest"
    var moonPos = suncalc.getMoonPosition(new Date(), config.LAT, config.LON);
    var moon_azimuth = 180 + radians2Degrees(moonPos['azimuth']);
    if (moon_azimuth > 360) {
      moon_azimuth = Math.abs(360 - moon_azimuth);
    }
    var moon_altitude = radians2Degrees(moonPos['altitude']);
    console.log('----- ' + new Date() + ' -----');
    console.log('moon_azimuth: ' + moon_azimuth);
    console.log('moon_altitude: ' + moon_altitude);
    console.log("Accelerometer");
    console.log("  pitch        : ", arrow.imu.accelerometer.pitch);
    console.log("  roll         : ", arrow.imu.accelerometer.roll);
    console.log("  acceleration : ", arrow.imu.accelerometer.acceleration);
    console.log("  inclination  : ", arrow.imu.accelerometer.inclination);
    console.log("  orientation  : ", arrow.imu.accelerometer.orientation);
    console.log("--------------------------------------");
    console.log("Gyroscope");
    console.log("  x            : ", arrow.imu.gyro.x);
    console.log("  y            : ", arrow.imu.gyro.y);
    console.log("  z            : ", arrow.imu.gyro.z);
    console.log("  pitch        : ", arrow.imu.gyro.pitch);
    console.log("  roll         : ", arrow.imu.gyro.roll);
    console.log("  yaw          : ", arrow.imu.gyro.yaw);
    console.log("  rate         : ", arrow.imu.gyro.rate);
    console.log("  isCalibrated : ", arrow.imu.gyro.isCalibrated);
    console.log("--------------------------------------");
    console.log("magnetometer : ", Math.floor(arrow.imu.magnetometer.heading));
    console.log("--------------------------------------");

    if (!arrow.moving_azimuth) {
      arrow.moveToAzimuth(moon_azimuth);
    } else {
      console.log("azimuth move already in progress");
    }
    if (!arrow.moving_altitude) {
      arrow.moveToAltitude(moon_altitude);
    } else {
      console.log("altitude move already in progress");
    }

  }, config.INTERVAL);
};


var testSteppers = function() {
  var arrow = new Arrow();
  var testDegrees = 45;

  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  process.stdin.setRawMode(true);

  process.stdin.on("keypress", function(ch, key) {
    if (!key) {
      return;
    }
    
    console.log("start azimuth: " + arrow.azimuth);
    console.log("start altitude: " + arrow.altitude);

    if (key.name === "q") {
      console.log("Quitting");
      process.exit();
    } else if (key.name === "up") {
      console.log("alt CW " + testDegrees + " degrees");
      arrow.moveDegrees('altitude', testDegrees, config.CW_ALTITUDE);
    } else if (key.name === "down") {
      console.log("alt CCW " + testDegrees + " degrees");
      arrow.moveDegrees('altitude', testDegrees, config.CCW_ALTITUDE);
    } else if (key.name === "left") {
      console.log("azi CCW " + testDegrees + " degrees");
      arrow.moveDegrees('azimuth', testDegrees, config.CCW_AZIMUTH, config.RPM_AZIMUTH);
    } else if (key.name === "right") {
      console.log("azi CW " + testDegrees + " degrees");
      arrow.moveDegrees('azimuth', testDegrees, config.CW_AZIMUTH, config.RPM_AZIMUTH);
    } else if (key.name === "space") {
      arrow.moveDegrees('azimuth', 0.1, config.CW_AZIMUTH);
    }
  });
};

var testAltitude = function() {
  var stepper_altitude = new five.Stepper({
    type: five.Stepper.TYPE.DRIVER,
    stepsPerRev: config.STEPSPERREV,
    pins: config.PINS_ALTITUDE
  });

  stepper_altitude.step({
    steps: 4000,
    direction: 0,
    rpm: config.RPM_ALTITUDE
  }, function() {
    stepper_altitude.step({
      steps: 4000,
      direction: 1,
      rpm: config.RPM_ALTITUDE
    }, function() {
    });
  });

  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  process.stdin.setRawMode(true);

  process.stdin.on("keypress", function(ch, key) {
    if (!key) {
      return;
    }

    if (key.name === "space") {
      stepper_altitude.step({
        steps: 1,
        direction: 1,
        rpm: config.RPM_ALTITUDE
      }, function() {
        console.log("stopping");
      });
    }
  });
};


var testIMU = function() {
  var imu = new five.IMU({
    controller: "BNO055",
    // enableExternalCrystal: false
  });

  imu.on("data", function() {
    console.log("Accelerometer");
    console.log("  x            : ", this.accelerometer.x);
    console.log("  y            : ", this.accelerometer.y);
    console.log("  z            : ", this.accelerometer.z);
    console.log("  inclination  : ", this.accelerometer.inclination);
    console.log("  pitch        : ", this.accelerometer.pitch);
    console.log("  roll         : ", this.accelerometer.roll);

    console.log("magnetometer");
    console.log("  heading : ", Math.floor(this.magnetometer.heading));
    // console.log("  bearing : ", this.magnetometer.bearing.name);
    console.log("--------------------------------------");
  });
};


board.on("ready", function() {
  //~ testIMU();
  testSteppers();
});

board.on("message", function(event) {
  console.log("Received a %s message, from %s, reporting: %s", event.type, event.class, event.message);
});

// todo:
// functions for stopping
// LAN setup
// calibration - don't move until calibrated; simulate figure-8 until it is
// enableExternalCrystal?
// GPS integration: set time and location automatically
// tune after mounting
