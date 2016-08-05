/*
 * Copyright 2016 Telefónica Investigación y Desarrollo, S.A.U
 *
 * This file is part of the Short Time Historic (STH) component
 *
 * STH is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * STH is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with STH.
 * If not, see http://www.gnu.org/licenses/.
 *
 * For those usages not covered by the GNU Affero General Public License
 * please contact with: [german.torodelvalle@telefonica.com]
 */

'use strict';

var ROOT_PATH = require('app-root-path');
var scheduler = require('node-schedule');
var request = require('request');
var EventEmitter = require('events').EventEmitter;
var linearInterpolator  = require(ROOT_PATH + '/lib/interpolators/linearInterpolator');
var randomLinearInterpolator  = require(ROOT_PATH + '/lib/interpolators/randomLinearInterpolator');
var stepBeforeInterpolator  = require(ROOT_PATH + '/lib/interpolators/stepBeforeInterpolator');
var stepAfterInterpolator  = require(ROOT_PATH + '/lib/interpolators/stepAfterInterpolator');
var dateIncrementInterpolator  = require(ROOT_PATH + '/lib/interpolators/dateIncrementInterpolator');
var fdsErrors = require(ROOT_PATH + '/lib/errors/fdsErrors');

/**
 * The loaded configuration
 */
var configuration;

/**
 * EventEmitter object returned to notify the evolution of the simulation
 */
var eventEmitter = new EventEmitter();

/**
 * Cache of interpolators to avoid instantiating them over and over again
 * @type {Object} Object including a property per interpolation type (typically: time-linear-interpolator,
 *                time-step-before-interpolator, time-step-after-interpolator). Each one of them is an object including
 *                a property per configuration array where the concrete interpolator is stored, this is:
 *       					{
 *       						"time-linear-interpolator": {
 *                  "[[0,0], [20,25], [21,50], [22,100], [23, 0], [24, 0]]": linearInterpolatorInstance1,
 *                    ...
 *       							"[[0,0], [21,50], [23, 100], [24, 0]]": linearInterpolatorInstanceK
 *       						},
 *       						"time-step-before-interpolator": {
 *                    "[[0,0], [20,25], [21,50], [22,100], [23, 0], [24, 0]]": stepBeforeInterpolatorInstance1,
 *       							...
 *       							"[[0,0], [21,50], [23, 100], [24, 0]]": : stepBeforeInterpolatorInstanceN
 *       						}
 *       					}
 */
var interpolators = {};

/**
 * Clones attributes
 * @param  {Object} attribute The attribute to cloneAttribute
 * @return {Object}           The cloned attribute
 */
function cloneAttribute(attribute) {
  /* jshint camelcase: false */
  var clonedAttribute = {
    name: attribute.name,
    type: attribute.type,
    value: attribute.value
  };
  if (attribute.object_id) {
    clonedAttribute.object_id = attribute.object_id;
  }
  return clonedAttribute;
}

/**
 * Clones a device
 * @param  {Object} device The device to cloned
 * @return {Object}        The cloned device
 */
function cloneDevice(device) {
  /* jshint camelcase: false */
  var clonedDevice = {
    entity_name: device.entity_name,
    entity_type: device.entity_type,
    schedule: device.schedule
  };
  if (device.device_id) {
    clonedDevice.device_id = device.device_id;
  }
  if (device.active) {
    device.active.forEach(function(activeAttribute) {
      clonedDevice.active = clonedDevice.active || [];
      var clonedActiveAttribute = cloneAttribute(activeAttribute);
      if (activeAttribute.schedule) {
        clonedActiveAttribute.schedule = activeAttribute.schedule;
      }
      clonedDevice.active.push(clonedActiveAttribute);
    });
  }
  if (device.staticAttributes) {
    device.staticAttributes.forEach(function(staticAttribute) {
      clonedDevice.staticAttributes = clonedDevice.staticAttributes || [];
      var clonedStaticAttribute = cloneAttribute(staticAttribute);
      if (staticAttribute.schedule) {
        clonedStaticAttribute.schedule = staticAttribute.schedule;
      }
      clonedDevice.staticAttributes.push(clonedStaticAttribute);
    });
  }
  return clonedDevice;
}

/**
 * Generates a new device from a device description and a counter
 * @param  {Object} device  The device description
 * @param  {Number} counter The counter
 * @return {Object}         The generated device
 */
function generateDevice(device, counter) {
  /* jshint camelcase: false */
  var clonedDevice = cloneDevice(device);
  clonedDevice.device_id = device.entity_type + ':' + counter;
  clonedDevice.entity_name = device.entity_type + ':' + counter;
  return clonedDevice;
}

/**
 * Adds an active attribute to certain schedule inside the schedules object
 * @param {Object} schedules       An object including schedules as properties and arrays of active attributes to update
 *                                 as values
 * @param {String} schedule        The schedule
 * @param {Object} activeAttribute Object containing the details of the active attribute to update
 */
function addActiveAttribute2Schedule(schedules, schedule, activeAttribute) {
  /* jshint camelcase: false */
  if (schedules[schedule]) {
    schedules[schedule].push(activeAttribute);
  } else {
    schedules[schedule] = [];
    schedules[schedule].push(activeAttribute);
  }
}

/**
 * Returns the decimal date associated to certain date
 * @param  {date}   date The date
 * @return {Number}      The time in decimal format
 */
function toDecimalHours(date) {
  return date.getHours() + (date.getMinutes() / 60) + (date.getSeconds() / 3600);
}

/**
 * Returns the interpolated value for certain date based on the passed interpolator and interpolator type
 * @param  {Object} interpolator      The interpolator specification
 * @param  {Object} interpolationType The interpolator type
 * @return {Object}                   The interpolated value
 */
function interpolate(interpolator, interpolationType) {
  var interpolationSpec,
      interpolationFunction,
      interpolatorInstance,
      interpolationTypePlural = interpolationType + 's';

  switch(interpolationType) {
    case 'time-linear-interpolator':
      interpolationFunction = linearInterpolator;
      break;
    case 'time-random-linear-interpolator':
      interpolationFunction = randomLinearInterpolator;
      break;
    case 'time-step-before-interpolator':
      interpolationFunction = stepBeforeInterpolator;
      break;
    case 'time-step-after-interpolator':
      interpolationFunction = stepAfterInterpolator;
      break;
      case 'date-increment-interpolator':
        interpolationFunction = dateIncrementInterpolator;
        break;
    default:
      return null;
  }

  if (interpolationType !== 'time-random-linear-interpolator') {
    interpolationSpec = interpolator.substring((interpolationType + '(').length, interpolator.length - 1);
    interpolators[interpolationTypePlural] = interpolators[interpolationTypePlural] || {};
    interpolatorInstance = interpolators[interpolationTypePlural][interpolationSpec] ||
      (interpolators[interpolationTypePlural][interpolationSpec] =
        interpolationFunction(interpolationSpec));
  } else {
    interpolationSpec = interpolator.substring((interpolationType + '(').length, interpolator.length - 1);
    interpolatorInstance = interpolationFunction(interpolationSpec);
  }
  return interpolatorInstance(Array.prototype.slice.call(arguments, 2));
}

/**
 * Resolves a value for an interpolator and the current date
 * @param  {String} interpolator The value (may be an interpolator specification or concrete value)
 * @return {Number}              The final value for the interpolator and date specified
 */
function resolveValue(interpolator) {
  if (typeof interpolator !== 'string') {
    return interpolator;
  }
  if (interpolator.indexOf('time-linear-interpolator(') === 0) {
    return interpolate(interpolator, 'time-linear-interpolator', toDecimalHours(new Date()));
  } else if (interpolator.indexOf('time-random-linear-interpolator(') === 0) {
    return interpolate(interpolator, 'time-random-linear-interpolator', toDecimalHours(new Date()));
  } else if (interpolator.indexOf('time-step-before-interpolator') === 0) {
    return interpolate(interpolator, 'time-step-before-interpolator', toDecimalHours(new Date()));
  } else if (interpolator.indexOf('time-step-after-interpolator') === 0) {
    return interpolate(interpolator, 'time-step-after-interpolator', toDecimalHours(new Date()));
  } else if (interpolator.indexOf('date-increment-interpolator') === 0) {
    return interpolate(interpolator, 'date-increment-interpolator');
  } else {
    return interpolator;
  }
}

/**
 * Returns the request package options associated to the update of certain entity and some of its active attributes
 * @param  {Object} entity           Entity information
 * @param  {Array}  activeAttributes Array of active attributes to update
 * @return {Object}                  The request packege options
 */
function getRequestOptions(entity, activeAttributes) {
  /* jshint camelcase: false */
  var contextElement = {};
  contextElement.id = entity.entity_name;
  contextElement.type = entity.entity_type;
  contextElement.isPattern = false;
  if (entity.staticAttributes && entity.staticAttributes.length) {
    contextElement.attributes = [];
    entity.staticAttributes.forEach(function(staticAttribute) {
      contextElement.attributes.push({
        name: staticAttribute.name,
        type: staticAttribute.type,
        value: resolveValue(staticAttribute.value)
      });
    });
  }
  contextElement.attributes = contextElement.attributes || [];
  activeAttributes.forEach(function(activeAttribute) {
    contextElement.attributes.push({
      name: activeAttribute.name,
      type: activeAttribute.type,
      value: resolveValue(activeAttribute.value)
    });
  });
  var options = {
    method: 'POST',
    url: 'https://' + configuration.contextBroker.host + ':' + configuration.contextBroker.port + '/v1/updateContext',
    rejectUnauthorized: false,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Fiware-Service': configuration.authentication.service,
      'Fiware-ServicePath': configuration.authentication.subservice,
      'X-Auth-Token': configuration.authentication.token
    },
    json: true,
    body: {
      contextElements: [
        contextElement
      ],
      updateAction: 'APPEND'
    }
  };
  return options;
}

/**
 * Emits an "scheduled" event notifying that new update jobs have been scheduled
 * @param  {String} schedule         The schedule
 * @param  {Object} entity           The information about the entity to update
 * @param  {Array} activeAttributes  Array of active attributes to update
 */
function emitScheduled(schedule, entity, activeAttributes) {
  /* jshint camelcase: false */
  var attributes;
  if (entity.staticAttributes) {
    entity.staticAttributes.forEach(function(staticAttribute) {
      attributes = attributes || [];
      attributes.push(cloneAttribute(staticAttribute));
    });
  }
  activeAttributes.forEach(function(activeAttribute) {
    attributes = attributes || [];
    attributes.push(cloneAttribute(activeAttribute));
  });
  var event2Emit = {
    schedule: schedule,
    entity: {
      entity_name: entity.entity_name,
      entity_type: entity.entity_type
    },
    attributes: attributes
  };
  if (entity.device_id) {
    event2Emit.device_id = entity.device_id;
  }
  eventEmitter.emit('update-scheduled', event2Emit);
}

/**
 * Emits an "error" event
 * @param  {Object} err The error to emit
 */
function emitError(err) {
  eventEmitter.emit(
    'error',
    {
      error: err
    }
  );
}

/**
 * Emits a "token-requested" event
 */
function emitTokenRequested() {
  eventEmitter.emit('token-requested');
}

/**
 * Emits a "token-received" event
 * @param  {Date} expirationDate The expiration date
 */
function emitTokenReceived(expirationDate) {
  /* jshint camelcase: false */
  eventEmitter.emit(
    'token-received',
    {
      expires_at: expirationDate
    }
  );
}

/**
 * Emits a "token-request-scheduled" event
 * @param  {Date} scheduleDate The schedule date
 */
function emitTokenRequestScheduled(scheduleDate) {
  /* jshint camelcase: false */
  eventEmitter.emit(
    'token-request-scheduled',
    {
      scheduled_at: scheduleDate
    }
  );
}

/**
 * Emits an "request" event notifying that new update jobs have been requested
 * @param  {Object} requestOptions The request information
 */
function emitRequest(requestOptions) {
  /* jshint camelcase: false */
  eventEmitter.emit(
    'update-request',
    {
      request: requestOptions
    }
  );
}

/**
 * Emits an "response" or "error" event notifying that new update jobs have been responded
 * @param  {Object} error           Error, if any
 * @param  {Object} request         The associated request
 * @param  {Object} body            The response body
 */
function emitResponse(error, request, body) {
  /* jshint camelcase: false */
  if (error) {
    eventEmitter.emit(
      'error',
      {
        request: request,
        error: error
      }
    );
  } else {
    eventEmitter.emit(
      'update-response',
      {
        request: request,
        response: body
      }
    );
  }
}

/**
 * Emits the "end" event
 */
function emitEnd() {
  eventEmitter.emit('end');
}

/**
 * Updates the active attributes associated to certain entity
 * @param  {Object} entity          The entity information
 * @param  {Array} activeAttributes The active attributes to update
 */
function update(entity, activeAttributes) {
  var requestOptions = getRequestOptions(entity, activeAttributes);
  request(requestOptions, function(err, response, body) {
    emitResponse(err, requestOptions, body);
  });
  emitRequest(requestOptions);
}

/**
 * Schedules the jobs associated to the update of the attributes associated to certain entity
 * @param  {Object} entity The entity information
 */
function scheduleJobs4Entity(entity) {
  var schedules = {};
  if (entity.active) {
    entity.active.forEach(function(activeAttribute) {
      addActiveAttribute2Schedule(schedules, activeAttribute.schedule || entity.schedule, activeAttribute);
    });
  } else if (entity.staticAttributes) {
    schedules[entity.schedule] = schedules[entity.schedule] || [];
  }
  for (var schedule in schedules) {
    if (schedules.hasOwnProperty(schedule)) {
      scheduler.scheduleJob(
        schedule === 'once' ? new Date(Date.now() + 500) : schedule,
        update.bind(null, entity, schedules[schedule]));
      emitScheduled(schedule, entity, schedules[schedule]);
    }
  }
}

/**
 * Schedules jobs to update the entities
 */
function scheduleJobs() {
  /* jshint camelcase: false */
  if (configuration.entities) {
    configuration.entities.forEach(function(entity) {
      if (entity.entity_name) {
        scheduleJobs4Entity(entity);
      } else if (entity.count) {
        for (var ii = 1; ii <= entity.count; ii++) {
          var generatedDevice = generateDevice(entity, ii);
          scheduleJobs4Entity(generatedDevice);
        }
      }
    });
  }
  if (configuration.devices) {
    configuration.devices.forEach(function(device) {
      if (device.entity_name) {
        scheduleJobs4Entity(device);
      } else if (device.count) {
        for (var ii = 1; ii <= device.count; ii++) {
          var generatedDevice = generateDevice(device, ii);
          scheduleJobs4Entity(generatedDevice);
        }
      }
    });
  }
}

/**
 * Requests an authorization tokens
 * @param  {Function} callback The callback
 */
function requestToken(callback) {
  request({
    method: 'POST',
    url: 'https://' + configuration.authentication.host + ':' + configuration.authentication.port + '/v3/auth/tokens',
    rejectUnauthorized: false,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    json: true,
    body: {
      auth: {
        identity: {
          methods: [
            'password'
          ],
          password: {
            user: {
              domain: {
                name: configuration.authentication.service
              },
              name: configuration.authentication.user,
              password: configuration.authentication.password
            }
          }
        },
        scope: {
          project: {
            domain: {
              name: configuration.authentication.service
            },
            name: configuration.authentication.subservice
          }
        }
      }
    }
  }, callback);
  emitTokenRequested();
}

/**
 * Token received handler
 * @param  {Object} err      The error, if any
 * @param  {Object} response The response
 * @param  {Object} body     The response body
 */
function onTokenReceived(err, response, body) {
  /* jshint camelcase: false */
  if (err) {
    emitError(err);
    emitEnd();
  } else  if (response.statusCode.toString().charAt(0) !== '2') {
    emitError(new fdsErrors.TokenNotAvailable('Authorization token could not be generated due to error: ' +
      body.error.code + ' - ' + body.error.title + ' - ' + body.error.message));
    emitEnd();
  } else {
    emitTokenReceived(new Date(body.token.expires_at));
    configuration.authentication.token = response.headers['x-subject-token'];
    var scheduleDate = new Date(new Date(body.token.expires_at) - 60000);
    scheduler.scheduleJob(scheduleDate, requestToken.bind(null, onTokenReceived));
    emitTokenRequestScheduled(scheduleDate);
    scheduleJobs();
  }
}

/**
 * Starts a simulation according to certain simulation configuration
 * @param  {Object}       config A JSON simulation configuration Object
 * @return {EventEmitter}        EventEmitter instance to notify the following events:
 *                                 - "token-requested": Whenever a new authorization token is requested. No event
 *                                 object is passed as additional information for this event occurrence.
 *                                 - "token-received": Whenever a new authorization token is received. The passed
 *                                 event includes the following properties:
 *                                   - {Date} expires_at The expiration date
 *                                 - "token-request-scheduled": Whenever a new authorization token request is scheduled.
 *                                 The passed event includes the following properties:
 *                                   - {Date} scheduled_at The scheduled date
 *                                 - "update-scheduled": Whenever a new entity update is scheduled. The passed event
 *                                 includes the following properties:
 *                                   - {String} schedule   The schedule
 *                                   - {Object} entity     Information about the entity to be updated
 *                                   - {Array}  attributes The attributes to be updated
 *                                 - "update-request": Whenever a new entity update is requested.
 *                                   - {Object} request Details about the update request
 *                                 - "update-response": Whenever a new entity update response is received.
 *                                   - {Object} request  Details about the update request
 *                                   - {Object} response The body of the received update response
 *                                 - "error": Whenever an error happens
 *                                   - {Error}  error The error
 *                                   - {Object} request The optional associated request (optional)
 *                                 - "end": Whenever the simulation ends. No event object is passed as additional
 *                                 information for this event occurrence.
 */
function start(config) {
  /* jshint camelcase: false */
  configuration = config;
  setImmediate(function simulation() {
    requestToken(onTokenReceived);
  });
  return eventEmitter;
}

module.exports = {
  start: start
};
