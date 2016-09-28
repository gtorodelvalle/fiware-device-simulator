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
var fdsErrors = require(ROOT_PATH + '/lib/errors/fdsErrors');
var linearInterpolator = require('linear-interpolator');

/**
 * Validates the entries of an interpolation array
 * @param  {Array}   entry The entry to Validates
 * @return {Boolean}       True if the entry is valid, false otherwise
 */
function interpolatorArrayValidator(entry) {
  return Array.isArray(entry) && (entry.length === 2) &&
    (typeof entry[0] === 'number') && (typeof entry[1] === 'number');
}

/**
 * Checks if the provided interpolation array is a valid once
 * @param  {Array}   interpolationArray The interpolation array
 * @return {Boolean}                    True if the interpolation array is valid, false otherwise
 */
function isValidInterpolationArray(interpolationArray) {
  return interpolationArray.every(interpolatorArrayValidator);
}

/**
 * Sorts the interpolation array according to the entries on the X-axis
 * @param  {Array}  entryA First entry to compare
 * @param  {Array}  entryB Second entry to compare
 * @return {Number}        Negative number if entryA should go before entryB, possitive number if entryA should go
 *                         after entryB and 0 if they should be left unchanged
 */
function sortInterpolationArray(entryA, entryB) {
  return entryA[0] - entryB[0];
}

/**
 * Checks if the provided interpolation object is a valid once
 * @param  {Object}  interpolationObject The interpolation object
 * @return {Boolean}                     True if the interpolation object is valid, false otherwise
 */
function isValidInterpolationObject(interpolationObject) {
  return (interpolationObject.spec && isValidInterpolationArray(interpolationObject.spec) &&
    interpolationObject.return && (interpolationObject.return.type === 'float' ||
      interpolationObject.return.type === 'integer') &&
    ((interpolationObject.return.type === 'integer') ?
      ['ceil', 'floor', 'round'].indexOf(interpolationObject.return.rounding) !== -1 :
      true));
}

module.exports = function(interpolationObjectOrSpec) {
  var interpolationObject, interpolationArray, originalLinearInterpolator;

  /**
   * Final linear interpolator
   * @param  {Number} input A float number between 0 and 24 corresponding to the decimal hours
   * @return {Number}       Float or integer number according to the specification
   */
  function finalLinearInterpolator(input) {
    var output = originalLinearInterpolator(input);
    if (interpolationObject.return.type === 'float') {
      return output;
    } else {
      // In this case: interpolationObject.return.type === 'integer'
      switch (interpolationObject.return.rounding) {
        case 'ceil':
          return Math.ceil(output);
        case 'floor':
          return Math.floor(output);
        case 'round':
          return Math.round(output);
      }
    }
  }

  if ((typeof interpolationObjectOrSpec === 'object')) {
    if (isValidInterpolationObject(interpolationObjectOrSpec)) {
      interpolationObject = interpolationObjectOrSpec;
    } else {
      throw new fdsErrors.InvalidInterpolationSpec('The provided interpolation object or spec (' +
        interpolationObjectOrSpec + ') is not valid (it should be an object including the "spec" and ' +
          '"return" properties, where the "return" property is an object including the "type" property and, ' +
          'in case "type" is equal to "integer" a "rounding" property)');
    }
  } else {
    interpolationObject = JSON.parse(interpolationObjectOrSpec);
    if (!isValidInterpolationObject(interpolationObject)) {
      throw new fdsErrors.InvalidInterpolationSpec('The provided interpolation object or spec (' +
        interpolationObjectOrSpec + ') is not valid (it should be an object including the "spec" and ' +
          '"return" properties, where the "return" property is an object including the "type" property and, ' +
          'in case "type" is equal to "integer" a "rounding" property)');
    }
  }
  interpolationObject = interpolationObject || interpolationObjectOrSpec;
  interpolationArray = interpolationObject.spec.sort(sortInterpolationArray);
  originalLinearInterpolator = linearInterpolator(interpolationArray);
  return finalLinearInterpolator;
};
