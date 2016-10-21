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

var should = require('should');

var ROOT_PATH = require('app-root-path');
var nock = require('nock');
var fdsErrors = require(ROOT_PATH + '/lib/errors/fdsErrors');
var attributeFunctionInterpolator = require(ROOT_PATH + '/lib/interpolators/attributeFunctionInterpolator');

var ATTRIBUTE_VALUE = 666;

describe('attributeFunctionInterpolator tests', function() {
  var attributeFunctionInterpolatorFunction,
      domain = {
        service: 'theService',
        subservice: '/theSubService'
      },
      contextBroker = {
        protocol: 'https',
        host: 'localhost',
        port: 1026,
        ngsiVersion: '1.0'
      },
      token = '9148f6f23c3e40c5b8b28766c50dffb5',
      contextBrokerNock = nock(
        contextBroker.protocol + '://' + contextBroker.host + ':' + contextBroker.port,
        {
          reqheaders: {
            'Fiware-Service': domain.service,
            'Fiware-ServicePath': domain.subservice
          }
        }
      );

  beforeEach(function() {
    contextBrokerNock.post('/v1/queryContext').reply(200, function(uri, requestBody) {
      should(requestBody.entities[0].id).equal('EntityId');
      should(requestBody.attributes).containEql('AttributeName');
      return {
        contextResponses: [
          {
            contextElement: {
              type: 'Entity',
              isPattern: 'false',
              id: 'EntityId',
              attributes: [
                {
                  name: 'AttributeName',
                  type: 'Number',
                  value: ATTRIBUTE_VALUE
                }
              ]
            },
            statusCode: {
              code: 200,
              reasonPhrase: 'OK'
            }
          }
        ]
      };
    });
  });

  it('should throw an error if ReferenceError is forced via the interpolation specification as a string',
    function(done) {
      try {
        attributeFunctionInterpolatorFunction = attributeFunctionInterpolator(
          'undeclaredVariable', domain, contextBroker);
        attributeFunctionInterpolatorFunction(token);
        done(new Error('It should throw an ValueResolutionError error'));
      } catch(exception) {
        should(exception).be.an.instanceof(fdsErrors.ValueResolutionError);
        done();
      }
    }
  );

  it('should interpolate if a number is passed as the interpolation specification', function(done) {
    try {
      attributeFunctionInterpolatorFunction = attributeFunctionInterpolator(666, domain, contextBroker);
      should(attributeFunctionInterpolatorFunction(token)).equal(666);
      done();
    } catch(exception) {
      should(exception).be.an.instanceof(fdsErrors.InvalidInterpolationSpec);
      done();
    }
  });

  it('should interpolate if a number is passed as a string as the interpolation specification', function(done) {
    try {
      attributeFunctionInterpolatorFunction = attributeFunctionInterpolator('666', domain, contextBroker);
      should(attributeFunctionInterpolatorFunction(token)).equal(666);
      done();
    } catch(exception) {
      should(exception).be.an.instanceof(fdsErrors.InvalidInterpolationSpec);
      done();
    }
  });

  it('should interpolate if a string is passed as the interpolation specification', function(done) {
    try {
      attributeFunctionInterpolatorFunction = attributeFunctionInterpolator('\"some-text\"', domain, contextBroker);
      should(attributeFunctionInterpolatorFunction(token)).equal('some-text');
      done();
    } catch(exception) {
      should(exception).be.an.instanceof(fdsErrors.InvalidInterpolationSpec);
      done();
    }
  });

  it('should interpolate if an array is passed as the interpolation specification', function(done) {
    try {
      attributeFunctionInterpolatorFunction = attributeFunctionInterpolator([1, 2, 3], domain, contextBroker);
      should(attributeFunctionInterpolatorFunction(token)).containEql(1);
      should(attributeFunctionInterpolatorFunction(token)).containEql(2);
      should(attributeFunctionInterpolatorFunction(token)).containEql(3);
      done();
    } catch(exception) {
      done(exception);
    }
  });

  it('should interpolate if an array is passed as a string as the interpolation specification', function(done) {
    try {
      attributeFunctionInterpolatorFunction = attributeFunctionInterpolator('[1, 2, 3]', domain, contextBroker);
      should(attributeFunctionInterpolatorFunction(token)).containEql(1);
      should(attributeFunctionInterpolatorFunction(token)).containEql(2);
      should(attributeFunctionInterpolatorFunction(token)).containEql(3);
      done();
    } catch(exception) {
      done(exception);
    }
  });

  it('should interpolate if a reference to an entity attribute is passed as the interpolation specification',
    function(done) {
      try {
        attributeFunctionInterpolatorFunction =
          attributeFunctionInterpolator('${{EntityId}{AttributeName}}', domain, contextBroker);
        should(attributeFunctionInterpolatorFunction(token)).equal(ATTRIBUTE_VALUE);
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should interpolate if an addition to a reference to an entity attribute is passed as the ' +
     'interpolation specification',
    function(done) {
      try {
        attributeFunctionInterpolatorFunction =
          attributeFunctionInterpolator('${{EntityId}{AttributeName}} + 111', domain, contextBroker);
        should(attributeFunctionInterpolatorFunction(token)).equal(ATTRIBUTE_VALUE + 111);
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should interpolate if a function invocation on a reference to an entity attribute is passed as the ' +
     'interpolation specification',
    function(done) {
      try {
        attributeFunctionInterpolatorFunction =
          attributeFunctionInterpolator('Math.pow(${{EntityId}{AttributeName}}, 2);', domain, contextBroker);
        should(attributeFunctionInterpolatorFunction(token)).equal(Math.pow(ATTRIBUTE_VALUE, 2));
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should throw an error if a invalid Javascript code with a reference to an entity attribute is passed as the ' +
     'interpolation specification',
    function(done) {
      try {
        attributeFunctionInterpolatorFunction =
          attributeFunctionInterpolator('Math.pow(${{EntityId}{AttributeName}}, 2', domain, contextBroker);
        should(attributeFunctionInterpolatorFunction(token)).equal(Math.pow(ATTRIBUTE_VALUE, 2));
        done(new Error('It should throw an ValueResolutionError error'));
      } catch(exception) {
        should(exception).be.an.instanceof(fdsErrors.ValueResolutionError);
        done();
      }
    }
  );

  it('should throw an error if the Context Broker responds with an error',
    function(done) {
      nock.restore();
      contextBrokerNock.post('/v1/queryContext').reply(404);
      try {
        attributeFunctionInterpolatorFunction = attributeFunctionInterpolator(
          '${{InexistentEntityId}{AttributeName}}', domain, contextBroker);
        attributeFunctionInterpolatorFunction(token);
        done(new Error('It should throw an ValueResolutionError error'));
      } catch(exception) {
        should(exception).be.an.instanceof(fdsErrors.ValueResolutionError);
        done();
      }
    }
  );
});
