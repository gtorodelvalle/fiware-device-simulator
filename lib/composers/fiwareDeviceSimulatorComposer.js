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

var ROOT_PATH = require('app-root-path');
var path = require('path');
var fdsErrors = require(ROOT_PATH + '/lib/errors/fdsErrors');

/**
 * The original simulation configuration file
 */
var originalConfigurationObj;

/**
 * Error, if any, during the composition
 */
var error;

/**
 * Replaces an import() match by its corresponding value
 * @param  {String} match The matching String
 * @return {String}       The replacing String
 */
function replacer(match) {
  var templateValue;
  var templateTag = match.substring(8, match.length - 2);
  if (originalConfigurationObj.exports && originalConfigurationObj.exports[templateTag]) {
    templateValue = originalConfigurationObj.exports[templateTag];
  } else {
    try {
      templateValue = require(ROOT_PATH + path.sep + templateTag);
    } catch(exception) {
      error = exception;
    }
  }
  return JSON.stringify(templateValue);
}

/**
 * Asynchronously returns a new simulation configuration file after importing the corresponding templates
 * @param  {Object}   configuration The original configuration
 * @param  {Function} callback      The callback
 */
function compose(configuration, callback) {
  var configurationStr,
      newConfigurationStr,
      newConfigurationObj;
  error = null;
  originalConfigurationObj = configuration;
  configurationStr = JSON.stringify(configuration);
  newConfigurationStr = configurationStr.replace(/"import\([^\)]+\)"/g, replacer);
  if (error) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('The configuration information provided is not ' +
      'valid (some error ocurred when importing the templates: ' + error + ')'));
  }
  try {
    newConfigurationObj = JSON.parse(newConfigurationStr);
  } catch (exception) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('The configuration information provided is not ' +
      'valid (some error ocurred when importing the templates: ' + exception + ')'));
  }
  return callback(null, newConfigurationObj);
}

module.exports = {
  compose: compose
};
