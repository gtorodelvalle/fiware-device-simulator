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
var async = require('async');
var linearInterpolator  = require(ROOT_PATH + '/lib/interpolators/linearInterpolator');
var randomLinearInterpolator  = require(ROOT_PATH + '/lib/interpolators/randomLinearInterpolator');
var stepBeforeInterpolator  = require(ROOT_PATH + '/lib/interpolators/stepBeforeInterpolator');
var stepAfterInterpolator  = require(ROOT_PATH + '/lib/interpolators/stepAfterInterpolator');
var dateIncrementInterpolator  = require(ROOT_PATH + '/lib/interpolators/dateIncrementInterpolator');
var multilinePositionInterpolator  = require(ROOT_PATH + '/lib/interpolators/multilinePositionInterpolator');
var textRotationInterpolator  = require(ROOT_PATH + '/lib/interpolators/textRotationInterpolator');
var fdsErrors = require(ROOT_PATH + '/lib/errors/fdsErrors');

/**
 * Validate the context broker configuration information
 * @param  {Object}   simulationConfiguration The simulation configuration
 * @param  {Function} callback                The callback
 */
function validateContextBrokerConfiguration(simulationConfiguration, callback) {
  if (!simulationConfiguration.contextBroker) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('No context broker configuration information (the ' +
      '\'contextBroker\' property is mandatory)'));
  }
  if (!simulationConfiguration.contextBroker.host) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('No host in the context broker configuration ' +
      'information (the \'contextBroker.host\' property is mandatory)'));
  }
  if (!simulationConfiguration.contextBroker.port) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('No port in the context broker configuration ' +
      'information (the \'contextBroker.port\' property is mandatory)'));
  }
  if (!simulationConfiguration.contextBroker.ngsiVersion) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('No NGSI version in the context broker ' +
      'configuration information (the \'contextBroker.nsgiVersion\' property is mandatory)'));
  }
  callback();
}

/**
 * Validates the authentication configuration information
 * @param  {Object}   simulationConfiguration The simulation configuration
 * @param  {Function} callback                The callback
 */
function validateAuthenticationConfiguration(simulationConfiguration, callback) {
  if (!simulationConfiguration.authentication) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('No authentication configuration information (the ' +
      '\'authentication\' property is mandatory)'));
  }
  if (!simulationConfiguration.authentication.host) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('No host in the authentication configuration ' +
      'information (the \'authentication.host\' property is mandatory)'));
  }
  if (!simulationConfiguration.authentication.port) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('No port in the authentication configuration ' +
      'information (the \'authentication.port\' property is mandatory)'));
  }
  if (!simulationConfiguration.authentication.service) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('No service in the authentication ' +
      'configuration information (the \'authentication.service\' property is mandatory)'));
  }
  if (!simulationConfiguration.authentication.subservice) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('No subservice in the authentication ' +
      'configuration information (the \'authentication.subservice\' property is mandatory)'));
  }
  if (!simulationConfiguration.authentication.user) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('No user in the authentication ' +
      'configuration information (the \'authentication.user\' property is mandatory)'));
  }
  if (!simulationConfiguration.authentication.password) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('No password in the authentication ' +
      'configuration information (the \'authentication.password\' property is mandatory)'));
  }
  callback();
}

/**
 * Validates schedules
 * @param  {String}   schedule    The schedule to validate
 * @param  {String}   parentType  The associated parent element type
 * @param  {Number}   parentIndex The associated parent element index
 * @param  {Function} callback    The callback
 */
function validateSchedule(schedule, parentType, parentIndex, callback) {
  var err;
  if (schedule && !/(^once$|^(\*\/[0-9]+\s+|\*\s+|[0-9]+\s+){5}(\*\/[0-9]+|\*|[0-9]))/g.test(schedule)) {
    err = new fdsErrors.SimulationConfigurationNotValid('The ' + parentType + ' configuration information ' +
      'at array index position ' + parentIndex + ' includes an invalid schedule: \'' + schedule + '\'');
  }
  callback(err);
}

/**
 * Validates values
 * @param  {String}   value          The value
 * @param  {String}   attributeType  The associated attribute type
 * @param  {Number}   attributeIndex The associated attribute number
 * @param  {String}   parentType     The associated parent element type
 * @param  {Number}   parentIndex    The associated parent element index
 * @param  {Function} callback       The callback
 */
function validateValue(value, attributeType, attributeIndex, parentType, parentIndex, callback) {
  if (!value) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('The ' + parentType + ' configuration information ' +
      'at array index position ' + parentIndex + ' includes ' +
      (attributeType === 'static' ? 'a staticAttributes' : 'an active') + ' attribute at array index position ' +
      attributeIndex + ' missing the value property'));
  }
  if (typeof value === 'string') {
    if (value.indexOf('time-linear-interpolator(') === 0) {
      try {
        linearInterpolator(value.substring('time-linear-interpolator('.length, value.length - 1));
      } catch(err) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('The ' + parentType + ' configuration ' +
          'information at array index position ' + parentIndex + ' includes ' +
          (attributeType === 'static' ? 'a staticAttributes' : 'an active') + ' attribute at array index position ' +
          attributeIndex + ' with an invalid time linear interpolator: \'' + value + '\', due to error: ' + err));
      }
    } else if (value.indexOf('time-random-linear-interpolator(') === 0) {
      try {
        randomLinearInterpolator(value.substring('time-random-linear-interpolator('.length, value.length - 1));
      } catch(err) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('The ' + parentType + ' configuration ' +
          'information at array index position ' + parentIndex + ' includes ' +
          (attributeType === 'static' ? 'a staticAttributes' : 'an active') + ' attribute at array index position ' +
          attributeIndex + ' with an invalid time random linear interpolator: \'' + value + '\', due to error: ' +
          err));
      }
    } else if (value.indexOf('time-step-before-interpolator(') === 0) {
      try {
        stepBeforeInterpolator(value.substring('time-step-before-interpolator('.length, value.length - 1));
      } catch(err) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('The ' + parentType + ' configuration ' +
          'information at array index position ' + parentIndex + ' includes ' +
          (attributeType === 'static' ? 'a staticAttributes' : 'an active') + ' attribute at array index position ' +
          attributeIndex + ' with an invalid time step before interpolator: \'' + value + '\', due to error: ' + err));
      }
    } else if (value.indexOf('time-step-after-interpolator(') === 0) {
      try {
        stepAfterInterpolator(value.substring('time-step-after-interpolator('.length, value.length - 1));
      } catch(err) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('The ' + parentType + ' configuration ' +
          'information at array index position ' + parentIndex + ' includes ' +
          (attributeType === 'static' ? 'a staticAttributes' : 'an active') + ' attribute at array index position ' +
          attributeIndex + ' with an invalid time step after interpolator: \'' + value + '\', due to error: ' + err));
      }
    } else if (value.indexOf('date-increment-interpolator(') === 0) {
      try {
        dateIncrementInterpolator(value.substring('date-increment-interpolator('.length, value.length - 1));
      } catch(err) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('The ' + parentType + ' configuration ' +
          'information at array index position ' + parentIndex + ' includes ' +
          (attributeType === 'static' ? 'a staticAttributes' : 'an active') + ' attribute at array index position ' +
          attributeIndex + ' with an invalid date increment interpolator: \'' + value + '\', due to error: ' + err));
      }
    } else if (value.indexOf('multiline-position-interpolator(') === 0) {
      try {
        multilinePositionInterpolator(value.substring('multiline-position-interpolator('.length, value.length - 1));
      } catch(err) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('The ' + parentType + ' configuration ' +
          'information at array index position ' + parentIndex + ' includes ' +
          (attributeType === 'static' ? 'a staticAttributes' : 'an active') + ' attribute at array index position ' +
          attributeIndex + ' with an invalid multiline position interpolator: \'' + value + '\', due to error: ' +
          err));
      }
    } else if (value.indexOf('text-rotation-interpolator(') === 0) {
      try {
        textRotationInterpolator(value.substring('text-rotation-interpolator('.length, value.length - 1));
      } catch(err) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('The ' + parentType + ' configuration ' +
          'information at array index position ' + parentIndex + ' includes ' +
          (attributeType === 'static' ? 'a staticAttributes' : 'an active') + ' attribute at array index position ' +
          attributeIndex + ' with an invalid text rotation interpolator: \'' + value + '\', due to error: ' +
          err));
      }
    }
  }
  callback();
}

/**
 * Validates an attribute
 * @param  {String}   attributeType  The attribute type
 * @param  {String}   parentType     The associated parent element type
 * @param  {Number}   parentIndex    The associated parent element index
 * @param  {Object}   attribute      The attribute to validate
 * @param  {Number}   attributeIndex The index of the attribute to validate
 * @param  {Function} callback       The callback
 */
function validateAttribute(attributeType, parentType, parentIndex, attribute, attributeIndex, callback) {
  if (!attribute.name) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('The ' + parentType + ' configuration information ' +
      'at array index position ' + parentIndex + ' includes ' +
      (attributeType === 'static' ? 'a staticAttributes' : 'an active') + ' attribute at array index position ' +
      attributeIndex + ' missing the name property'));
  }
  if (!attribute.type) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('The ' + parentType + ' configuration information ' +
      'at array index position ' + parentIndex + ' includes ' +
      (attributeType === 'static' ? 'a staticAttributes' : 'an active') + ' attribute at array index position ' +
      attributeIndex + ' missing the type property'));
  }
  async.series([
    async.apply(validateValue, attribute.value, attributeType, attributeIndex, parentType, parentIndex),
    async.apply(validateSchedule, attribute.schedule, parentType, parentIndex, callback)
  ], callback);
}

/**
 * Validates an array of attributes
 * @param  {Array}    attributes     Array of attributes to validate
 * @param  {String}   attributesType Type of the attributes to validate
 * @param  {String}   parentType     The associated parent element type
 * @param  {Number}   parentIndex    The associated parent element index
 * @param  {Function} callback       The callback
 */
function validateAttributes(attributes, attributesType, parentType, parentIndex, callback) {
  if (attributes) {
    if (Array.isArray(attributes)) {
      async.eachOfSeries(attributes, async.apply(validateAttribute, attributesType, parentType, parentIndex), callback);
    } else {
      return callback(new fdsErrors.SimulationConfigurationNotValid('The ' + parentType + ' configuration ' +
        'information at array index position ' + parentIndex + ' includes ' +
        (attributesType === 'static' ? 'a staticAttributes' : 'an active') + ' property which is not an array'));
    }
  } else {
    callback();
  }
}

/**
 * Validates an element (entity or device)
 * @param  {String}   elementType          The element type
 * @param  {Object}   elementConfiguration The element configuration information
 * @param  {Number}   index                The element index
 * @param  {Function} callback             The callback
 */
function validateElementConfiguration(elementType, elementConfiguration, index, callback) {
  /* jshint camelcase: false */
  if (!elementConfiguration.entity_name && !elementConfiguration.count) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('The ' + elementType + ' configuration information ' +
      'at array index position ' + index + ' should include an entity_name or count properties'));
  }
  if (!elementConfiguration.entity_type) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('The ' + elementType + ' configuration information ' +
      ' at array index position ' + index + ' misses the entity_type property'));
  }
  if ((!elementConfiguration.staticAttributes || elementConfiguration.staticAttributes.length === 0) &&
    (!elementConfiguration.active || elementConfiguration.active.length === 0)) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('The ' + elementType + ' configuration information ' +
      'at array index position ' + index + ' misses static and/or active attributes configuration information'));
  }
  async.series([
    async.apply(validateSchedule, elementConfiguration.schedule, elementType, index),
    async.apply(validateAttributes, elementConfiguration.staticAttributes, 'static', elementType, index),
    async.apply(validateAttributes, elementConfiguration.active, 'active', elementType, index)
  ], callback);
}

/**
 * Validates an array of elements (entities or devices)
 * @param  {Object}   simulationConfiguration The simulation configuration information
 * @param  {String}   elementType             The type of the elements to validate
 * @param  {Function} callback                The callback
 */
function validateElementsConfiguration(simulationConfiguration, elementType, callback) {
  if ((!simulationConfiguration.entities || simulationConfiguration.entities.length === 0) &&
    (!simulationConfiguration.devices || simulationConfiguration.devices.length === 0)) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('No entities and/or devices configuration ' +
      'information available (at least one of them is mandatory)'));
  }
  if (!simulationConfiguration[elementType === 'entity' ? 'entities' : 'devices']) {
    return callback();
  }
  if (!Array.isArray(simulationConfiguration[elementType === 'entity' ? 'entities' : 'devices'])) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('The ' +
      (elementType === 'entity' ? 'entities' : 'devices') + ' configuration information should be ' +
      'an array of ' + elementType + ' configuration information'));
  }
  async.eachOfSeries(simulationConfiguration[elementType === 'entity' ? 'entities' : 'devices'],
    async.apply(validateElementConfiguration, elementType), callback);
}

/**
 * Validates a simulation configuration object
 * @param  {Object}   simulationConfiguration The simulation configuration object to validate
 * @param  {Function} callback                The callback
 */
function validateConfiguration(simulationConfiguration, callback) {
  async.series([
    async.apply(validateContextBrokerConfiguration, simulationConfiguration),
    async.apply(validateAuthenticationConfiguration, simulationConfiguration),
    async.apply(validateElementsConfiguration, simulationConfiguration, 'entity'),
    async.apply(validateElementsConfiguration, simulationConfiguration, 'device')
  ], callback);
}

module.exports = {
  validateConfiguration: validateConfiguration
};
