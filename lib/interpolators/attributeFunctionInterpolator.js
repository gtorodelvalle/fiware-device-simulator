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
var deasync = require('deasync');
var request = require('request');
var fdsErrors = require(ROOT_PATH + '/lib/errors/fdsErrors');

var domainConf, contextBrokerConf;

var VARIABLE_RE = /\${{[^{}]+}{[^{}]+}}/g;
var ENTITY_ATTRIBUTE_RE = /{[^{}]+}/g;

/**
 * Returns the entity-attribute map for the passed spec
 * @param  {string} spec The spec
 * @return {Object}      The entity-attribute map
 */
function getEntityAttributeMap(spec) {
  var entityAttributeMap = {};
  var variableMatches = spec.match(VARIABLE_RE);
  if (!variableMatches) {
    return entityAttributeMap;
  }
  spec.match(VARIABLE_RE).forEach(function(specMatch) {
    var entityName, attributeName;
    var entry = specMatch.match(ENTITY_ATTRIBUTE_RE);
    entityName = entry[0].substring(1, entry[0].length - 1);
    attributeName = entry[1].substring(1, entry[1].length - 1);
    entityAttributeMap[entityName] = entityAttributeMap[entityName] || [];
    if (entityAttributeMap[entityName].indexOf(attributeName) === - 1) {
      entityAttributeMap[entityName].push(attributeName);
    }
  });
  return entityAttributeMap;
}

/**
 * Sends a HTTP request
 * @param  {String}   token          The authorization token
 * @param  {Object}   requestOptions The request options
 * @param  {Function} callback       The callback
 */
function sendRequest(token, requestOptions, callback) {
  requestOptions.headers['X-Auth-Token'] = token;
  request(requestOptions, callback);
}

/**
 * Returns the request options from a entity-attribute map
 * @param  {Object} domainConf         The domain configuration
 * @param  {Object} contextBrokerConf  The Context Broker configuration
 * @param  {Object} entityAttributeMap The entity-attribute map
 * @return {Array}                     The request options array
 */
function getRequestOptions(domainConf, contextBrokerConf, entityAttributeMap) {
  var body,
      requestOptions = [];

  var entities = Object.getOwnPropertyNames(entityAttributeMap);

  entities.forEach(function(entity) {
    body = {
      entities: [
        {
          id: entity,
          isPattern: 'false'
        }
      ]
    };
    entityAttributeMap[entity].forEach(function(attribute) {
      body.attributes = body.attributes || [];
      body.attributes.push(attribute);
    });

    requestOptions.push(
      {
        method: 'POST',
        url: contextBrokerConf.protocol + '://' + contextBrokerConf.host + ':' + contextBrokerConf.port +
          '/v1/queryContext',
        rejectUnauthorized: false,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Fiware-Service': domainConf.service,
          'Fiware-ServicePath': domainConf.subservice
        },
        json: true,
        body: body
      }
    );
  });
  return requestOptions;
}

/**
 * Returns the attribute value from the received responses
 * @param  {Array}  responses The array of responses
 * @param  {String} entity    The entity name
 * @param  {String} attribute The attribute name
 * @return {Object}           The attribute value
 */
function getAttributeValue(responses, entity, attribute) {
  for (var ii = 0; ii < responses.length; ii++) {
    if (responses[ii].body.contextResponses[0].contextElement.id === entity) {
      for (var jj = 0; jj < responses[ii].body.contextResponses[0].contextElement.attributes.length; jj++) {
        if (responses[ii].body.contextResponses[0].contextElement.attributes[jj].name === attribute) {
          return responses[ii].body.contextResponses[0].contextElement.attributes[jj].value;
        }
      }
    }
  }
}

/**
 * Checks if there has been an error when getting the attibute values
 * @param  {Array}   responseArray Array of responsees obtained from the Context Broker
 * @return {Boolean}               True if there has been any error, false otherwise
 */
function checkError(responseArray) {
  for (var ii = 0; ii < responseArray.length; ii++) {
    if (parseInt(responseArray[ii].statusCode, 10) !== 200 ||
      (responseArray[ii].body.errorCode && parseInt(responseArray[ii].body.errorCode.code, 10) !== 200)) {
        return true;
    }
  }
  return false;
}

module.exports = function(interpolationSpec, theDomainConf, theContextBrokerConf){
  var entityAttributeMap,
      requestOptions;

  domainConf = theDomainConf;
  contextBrokerConf = theContextBrokerConf;

  /**
   * Returns the new interpolated value asynchronously
   * @return {Object} The new interpolated value
   */
  function attributeFunctionInterpolator(token, callback) {
    var evalStr = interpolationSpec;

    async.map(requestOptions, sendRequest.bind(null, token), function(err, responseArray) {
      if (err || checkError(responseArray)) {
        return callback(
          new fdsErrors.ValueResolutionError('Error when getting some attribute value from the Context Broker ' +
            'for an attribute-function-interpolator resolution with spec: \'' + interpolationSpec + '\''));
      }
      var entities = Object.getOwnPropertyNames(entityAttributeMap);
      entities.forEach(function(entity) {
        entityAttributeMap[entity].forEach(function(attribute) {
          evalStr = evalStr.replace(new RegExp('${{' + entity + '}{' + attribute + '}}', 'g').source,
            getAttributeValue(responseArray, entity, attribute));
        });
      });

      /* jshint evil: true */
      var evaluatedValue;
      try {
        evaluatedValue = eval(evalStr);
      } catch (exception) {
        return callback(
          new fdsErrors.ValueResolutionError('Error when evaluating the Javascript code ' +
            'for an attribute-function-interpolator resolution with spec: \'' + interpolationSpec + '\''));
      }
      callback(null, evaluatedValue);
      /* jshint evil: false */
    });
  }

  entityAttributeMap = getEntityAttributeMap(interpolationSpec);
  requestOptions = getRequestOptions(domainConf, contextBrokerConf, entityAttributeMap);
  return deasync(attributeFunctionInterpolator);
};
