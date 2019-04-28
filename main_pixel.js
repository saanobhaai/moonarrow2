var events = require('events');
var suncalc = require('suncalc');  // https://github.com/mourner/suncalc
var five = require("johnny-five");  // http://johnny-five.io/
var pixel = require("node-pixel");  // https://github.com/ajfisher/node-pixel
const config = require('./config');

console.info("Initializing port...");
var board = new five.Board({
  port: config.BOARD_PORT
});

function radians2Degrees(angle) {
  return angle * (180 / Math.PI);
}


var Arrow = function() {
  this.servo_azimuth = new five.Servo.Continuous({
    pin: config.PIN_AZIMUTH,
    deadband: config.DEADBAND_AZIMUTH
  });
  this.servo_altitude = new five.Servo.Continuous({
    pin: config.PIN_ALTITUDE,
    deadband: config.DEADBAND_ALTITUDE
  });
  this.imu = new five.IMU({
    controller: "BNO055",
    enableExternalCrystal: true
  });

  this.azimuth = 0;
  this.altitude = 0;
  this.moving_azimuth = false;
  this.moving_altitude = false;
  //~ console.log("azi startAt: " + this.servo_azimuth.startAt);
  //~ console.log("alt startAt: " + this.servo_altitude.startAt);

  this.light = new pixel.Strip({
      board: board,
      controller: "FIRMATA",
      strips: config.LIGHT_STRIPS,
      gamma: 2.8, // set to a gamma that works nicely for WS2812
  });
};

Arrow.prototype = new events.EventEmitter;
Arrow.prototype.on('done:azimuth', function() {
  this.moving_azimuth = false;
  //~ console.log("end azimuth: " + this.azimuth);
  //~ console.log("end altitude: " + this.altitude);
  //~ console.log("azi servo position: " + this.servo_azimuth.position);
});
Arrow.prototype.on('done:altitude', function() {
  this.moving_altitude = false;
  //~ console.log("end azimuth: " + this.azimuth);
  //~ console.log("end altitude: " + this.altitude);
  //~ console.log("alt servo position: " + this.servo_altitude.position);
});
  

Arrow.prototype.moveDegrees = function(
  type,
  degrees,
  direction,
  speed
) {
  var self = this;
  var servo = (type === 'azimuth') ? self.servo_azimuth : self.servo_altitude;
  var multiplier = config.DEGREES2SECONDS_AZIMUTH_CW;
  var threshold = config.MOVEMENT_THRESHOLD_AZI;
  var dirlabel = '';
  if (type === 'altitude') {
    multiplier = (direction === config.CW_ALTITUDE) ? config.DEGREES2SECONDS_ALTITUDE_CW : config.DEGREES2SECONDS_ALTITUDE_CCW;
    dirlabel = (direction === config.CW_ALTITUDE) ? 'clockwise' : 'counter-clockwise' ;
    threshold = config.MOVEMENT_THRESHOLD_ALT;
  } else if (type === 'azimuth') {
    multiplier = (direction === config.CW_AZIMUTH) ? config.DEGREES2SECONDS_AZIMUTH_CW : config.DEGREES2SECONDS_AZIMUTH_CCW;
    dirlabel = (direction === config.CW_AZIMUTH) ? 'clockwise' : 'counter-clockwise' ;
    threshold = config.MOVEMENT_THRESHOLD_AZI;
  }
  //~ console.log('multiplier: ' + multiplier);

  var seconds = degrees * multiplier * (1 / speed);
  // above theoretically correct but not working for variable speed with these servos
  if (seconds < threshold) {
    console.log('Not moving ' + type + ' because required ' + seconds + ' seconds is less than ' + threshold);
    if (type === 'altitude') {
      self.moving_altitude = false;
    } else {
      self.moving_azimuth = false;
    }
    return;
  }

  console.log('moving ' + type + ' ' + dirlabel + ' ' + seconds + ' seconds speed ' + speed);
  if (direction === 1) {
    servo.cw(speed);
  } else if (direction === 0) {
    servo.ccw(speed);
  }

  setTimeout(function() {
    servo.stop();
    console.log('done:' + type);
    self.emit('done:' + type);
  }, seconds * 1000);
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

  var degreesToMove = Math.abs(degrees - self.azimuth);
  var direction = config.CW_AZIMUTH;
  if (degrees - self.azimuth < 0) direction = config.CCW_AZIMUTH;
  // If going more than halfway around the circle, take the shorter route
  if (degreesToMove > 180) {
    degreesToMove = 360 - degreesToMove;
    direction = Math.abs(direction - 1);
  }

  if (degreesToMove > 0) {
    console.log('azi degreesToMove: ' + degreesToMove + ' direction: ' + direction);
    self.moving_azimuth = true;
    self.moveDegrees('azimuth', degreesToMove, direction, config.SPEED_AZIMUTH);
  }
};


Arrow.prototype.moveToAltitude = function(
  degrees,  // absolute location, -90 - 90
) {
  var self = this;
  if (degrees > 90 || degrees < -90) {
    console.error('moveToAltitude() called with > 90 or < -90 degrees. Ignoring.');
    return;
  }

  var degreesToMove = Math.abs(degrees - self.altitude);
  var direction = config.CW_ALTITUDE;
  if (degrees - self.altitude < 0) direction = config.CCW_ALTITUDE;
  var speed = (direction === config.CW_ALTITUDE) ? config.SPEED_ALTITUDE_CW : config.SPEED_ALTITUDE_CCW;

  if (degreesToMove > 0) {
    console.log('alt degreesToMove: ' + degreesToMove + ' direction: ' + direction);
    self.moving_altitude = true;
    self.moveDegrees('altitude', degreesToMove, direction, speed);
  }
};


var trackMoon = function() {
  var arrowInterval = setInterval(function() {
    if (arrow.imu.gyro.isCalibrated) {
      var now = new Date();
      // From https://github.com/mourner/suncalc, south = 0: 
      // "azimuth in radians (direction along the horizon, measured from south to west), 
      // e.g. 0 is south and Math.PI * 3/4 is northwest"
      var moonPos = suncalc.getMoonPosition(now, config.LAT, config.LON);
      var moon_azimuth = Math.floor(180 + radians2Degrees(moonPos['azimuth']));
      if (moon_azimuth > 360) {
        moon_azimuth = Math.abs(360 - moon_azimuth);
      }
      var moon_altitude = Math.floor(radians2Degrees(moonPos['altitude']));
      console.log('----- ' + now + ' -----');
      console.log('moon  azimuth: ' + moon_azimuth  + ' moon altitude:  ' + moon_altitude);
      console.log('arrow azimuth: ' + arrow.azimuth + ' arrow altitude: ' + arrow.altitude);

      if (!arrow.moving_azimuth) {
        //~ console.log("start azimuth: " + arrow.azimuth);
        arrow.moveToAzimuth(moon_azimuth);
      } else {
        console.log("azimuth move already in progress");
      }
      if (!arrow.moving_altitude) {
        //~ console.log("start altitude: " + arrow.altitude);
        arrow.moveToAltitude(moon_altitude);
      } else {
        console.log("altitude move already in progress");
      }
    } else {
      console.log("Sensor not yet calibrated");
    }
  }, config.INTERVAL);
};

var setLight = function() {
  var lightInterval = setInterval(function() {
    let now = new Date();
    let suntimes = suncalc.getTimes(now, config.LAT, config.LON);
    //~ console.log(suntimes);
    let light_begins = suntimes['goldenHourEnd'].getTime();  // morning golden hour ends
    let light_ends = suntimes['goldenHour'].getTime();  // evening golden hour starts
    if (!(now.getTime() > light_begins && now.getTime() < light_ends)) {
      console.log("nighttime: turning lights on");
      arrow.light.color(config.LIGHT_COLOR.string());
      arrow.light.show();
    } else{
      console.log("daytime: turning lights off");
      arrow.light.off();
    }
  }, config.LIGHT_INTERVAL);
};

var manualControl = function(testDegrees) {
  testDegrees = testDegrees || 5;

  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  process.stdin.setRawMode(true);
  process.stdin.on("keypress", function(ch, key) {
    if (!key) {
      return;
    }
    if (key.name === "q") {
      console.log("Quitting");
      arrow.light.off();
      setTimeout(process.exit, 1000);
      //~ process.exit();
    } else if (key.sequence === ",") {
      console.log(config.LIGHT_COLOR);
      arrow.light.color(config.LIGHT_COLOR.string());
      arrow.light.show();
    } else if (key.sequence === ".") {
      console.log("turning lights off");
      arrow.light.off();
    } else if (key.name === "up") {
      console.log("alt CW " + testDegrees + " degrees");
      arrow.moveDegrees('altitude', testDegrees, config.CW_ALTITUDE, config.SPEED_ALTITUDE_CW);
    } else if (key.name === "down") {
      console.log("alt CCW " + testDegrees + " degrees");
      arrow.moveDegrees('altitude', testDegrees, config.CCW_ALTITUDE, config.SPEED_ALTITUDE_CCW);
    } else if (key.name === "left") {
      console.log("azi CCW " + testDegrees + " degrees");
      arrow.moveDegrees('azimuth', testDegrees, config.CCW_AZIMUTH, config.SPEED_AZIMUTH);
    } else if (key.name === "right") {
      console.log("azi CW " + testDegrees + " degrees");
      arrow.moveDegrees('azimuth', testDegrees, config.CW_AZIMUTH, config.SPEED_AZIMUTH);
    } else if (key.name === "space") {
      console.log("hit space; stopping");
      arrow.moveDegrees('azimuth', 0.2, config.CW_AZIMUTH, config.SPEED_AZIMUTH);
      arrow.moveDegrees('altitude', 0.1, config.CW_AZIMUTH, config.SPEED_AZIMUTH);
    }
  });
}

var testIMU = function() {
  var imu = new five.IMU({
    controller: "BNO055",
    // enableExternalCrystal: false
  });

  imu.on("data", function() {
    o = arrow.imu.orientation;
    console.log("orientation");
    console.log("  w            : ", o.quarternion.w);
    console.log("  x            : ", o.quarternion.x);
    console.log("  y            : ", o.quarternion.y);
    console.log("  z            : ", o.quarternion.z);
    console.log("  heading      : ", o.euler.heading);
    console.log("  roll         : ", o.euler.roll);
    console.log("  pitch        : ", o.euler.pitch);
    console.log("--------------------------------------");

    //~ console.log("Accelerometer");
    //~ console.log("  x            : ", this.accelerometer.x);
    //~ console.log("  y            : ", this.accelerometer.y);
    //~ console.log("  z            : ", this.accelerometer.z);
    //~ console.log("  inclination  : ", this.accelerometer.inclination);
    //~ console.log("  pitch        : ", this.accelerometer.pitch);
    //~ console.log("  roll         : ", this.accelerometer.roll);
    //~ console.log("--------------------------------------");

    //~ console.log("magnetometer");
    //~ console.log("  heading : ", Math.floor(this.magnetometer.heading));
    //~ console.log("  bearing : ", this.magnetometer.bearing.name);
    //~ console.log("--------------------------------------");
    //~ console.log("Gyroscope");
    //~ console.log("  x            : ", arrow.imu.gyro.x);
    //~ console.log("  y            : ", arrow.imu.gyro.y);
    //~ console.log("  z            : ", arrow.imu.gyro.z);
    //~ console.log("  pitch        : ", arrow.imu.gyro.pitch);
    //~ console.log("  roll         : ", arrow.imu.gyro.roll);
    //~ console.log("  yaw          : ", arrow.imu.gyro.yaw);
    //~ console.log("  rate         : ", arrow.imu.gyro.rate);
  });
};


var arrow = null;
board.on("ready", function() {
  arrow = new Arrow();
  //~ arrow.imu.on("data", function() {
    //~ arrow.azimuth = Math.floor(arrow.imu.orientation.euler.heading);
    //~ arrow.altitude = -Math.floor(arrow.imu.orientation.euler.pitch);
    //~ console.log("azimuth: " + arrow.azimuth + " altitude: " + arrow.altitude);
  //~ });

  manualControl();  // optional testDegrees argument: manualControl(90);
  //~ console.log("Please calibrate in the next " + (config.INIT_CALIBRATION_INTERVAL / 1000) + " seconds.");
  //~ setLight();
  //~ setTimeout(function() {
    //~ trackMoon();
  //~ }, config.INIT_CALIBRATION_INTERVAL);
  
  //~ testIMU();
  //~ testServos();
});

board.on("message", function(event) {
  console.log("Received a %s message, from %s, reporting: %s", event.type, event.class, event.message);
});
