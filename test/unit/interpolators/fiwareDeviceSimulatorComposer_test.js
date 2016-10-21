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
var fdsErrors = require(ROOT_PATH + '/lib/errors/fdsErrors');
var fiwareDeviceSimulatorComposer = require(ROOT_PATH + '/lib/composers/fiwareDeviceSimulatorComposer');

describe('fiwareDeviceSimulatorComposer tests', function() {
  it('should not transform anything if no template is included', function() {
    fiwareDeviceSimulatorComposer.compose(
      {
        should: 'not-transform-anything'
      },
      function(err, newConfiguration) {
        should(err).equal(null);
        should(newConfiguration).containEql({should: 'not-transform-anything'});
      }
    );
  });

  it('should throw an error if a template cannot be resolved', function(done) {
    try{
      fiwareDeviceSimulatorComposer.compose(
        {
          property: 'import(inexistent-template)'
        },
        function(err) {
          should(err).be.an.instanceof(fdsErrors.SimulationConfigurationNotValid);
          done();
        }
      );
    } catch (exception) {
      done(exception);
    }
  });

  it('should tranform a template if defined in the exports property', function(done) {
    try{
      fiwareDeviceSimulatorComposer.compose(
        {
          exports: {
            template: 'template-value'
          },
          property: 'import(template)'
        },
        function(err, newConfiguration) {
          should(err).equal(null);
          should(newConfiguration).containEql({property: 'template-value'});
          done();
        }
      );
    } catch (exception) {
      done(exception);
    }
  });

  it('should tranform a number template if defined in an external template file', function(done) {
    try{
      fiwareDeviceSimulatorComposer.compose(
        {
          property: 'import(test/unit/templates/template-number)'
        },
        function(err, newConfiguration) {
          should(err).equal(null);
          should(newConfiguration).containEql({property: 666});
          done();
        }
      );
    } catch (exception) {
      done(exception);
    }
  });

  it('should tranform a string template if defined in an external template file', function(done) {
    try{
      fiwareDeviceSimulatorComposer.compose(
        {
          property: 'import(test/unit/templates/template-string)'
        },
        function(err, newConfiguration) {
          should(err).equal(null);
          should(newConfiguration).containEql({property: 'template-value'});
          done();
        }
      );
    } catch (exception) {
      done(exception);
    }
  });

  it('should tranform an array template if defined in an external template file', function(done) {
    try{
      fiwareDeviceSimulatorComposer.compose(
        {
          property: 'import(test/unit/templates/template-array)'
        },
        function(err, newConfiguration) {
          should(err).equal(null);
          should(newConfiguration.property).containEql(1);
          should(newConfiguration.property).containEql(2);
          should(newConfiguration.property).containEql(3);
          done();
        }
      );
    } catch (exception) {
      done(exception);
    }
  });

  it('should tranform an object template if defined in an external template file', function(done) {
    try{
      fiwareDeviceSimulatorComposer.compose(
        {
          property: 'import(test/unit/templates/template-object)'
        },
        function(err, newConfiguration) {
          should(err).equal(null);
          should(newConfiguration.property).containEql({property1: 'value1'});
          should(newConfiguration.property).containEql({property2: 'value2'});
          should(newConfiguration.property).containEql({property3: 'value3'});
          done();
        }
      );
    } catch (exception) {
      done(exception);
    }
  });
});
