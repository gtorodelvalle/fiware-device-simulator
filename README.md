# <a name="top">FIWARE Device Simulator</a>

* [Introduction](#introduction)
* [FIWARE Device Simulator CLI tool](#fiware-device-simulator-cli-tool)
    * [Simulation configuration file](#simulation-configuration-file)
* [FIWARE Device Simulator library](#fiware-device-simulator-library)
* [Development documentation](#development-documentation)
    * [Project build](#project-build)
    * [Testing](#testing)
    * [Coding guidelines](#coding-guidelines)
    * [Continuous testing](#continuous-testing)
    * [Source code documentation](#source-code-documentation)
    * [Code coverage](#code-coverage)
    * [Code complexity](#code-complexity)
    * [PLC](#plc)
    * [Development environment](#development-environment)
    * [Site generation](#site-generation)
* [Contact](#contact)

## Introduction

The FIWARE Device Simulator is a tool to generate data for the FIWARE ecosystem in the shape of entities and its associated attributes.

The FIWARE Device Simulator is composed of 2 main elements:

1. A **CLI tool** to run FIWARE-compatible devices.
2. The **device simulator library** itself.

Let's cover each one of them.

[Top](#top)

## FIWARE Device Simulator CLI tool

The FIWARE Device Simulator CLI tool is located in the [./bin](./bin) directory and it is called [`fiwareDeviceSimulatorCLI`](./bin/fiwareDeviceSimulatorCLI.js).

To run the FIWARE Device Simulator CLI tool just run:

```bash
./bin/fiwareDeviceSimulatorCLI
```

This will show the FIWARE Device Simulator CLI tool help:

```
Usage: fiwareDeviceSimulatorCLI [options]

  Options:

    -h, --help                                     output usage information
    -V, --version                                  output the version number
    -c, --configuration <configuration-file-path>  Absolute or relative path (from the root of the Node application) to the device simulator configuration file (mandatory)
```

As you can see, the FIWARE Device Simulator CLI tool requires the path to a simulation configuration file detailing the simulation to be run. This simulation configuration file is the cornerstone of the FIWARE Device Simulator tool and is detailed in the next section.

Since the FIWARE Device Simulator CLI tool uses the [logops](https://www.npmjs.com/package/logops) package for logging, the logging level can be set using the `LOGOPS_LEVEL` environment variable. On the other hand, the logging format can be set using the `LOGOPS_FORMAT` environment variable.

[Top](#top)

### Simulation configuration file

The simulation configuration file is a JSON-formatted text file detailing the characteristics of the device simulation which will be run.

An example simulation configuration file is shown next to give you a glimpse of its shape. After it, the accepted properties and options are properly detailed.

```json
  {
    "contextBroker": {
      "host": "localhost",
      "port": 1026,
      "ngsiVersion": "1.0"
    },
    "authentication": {
        "host": "localhost",
        "port": 5001,
        "service": "myService",
        "subservice": "/mySubService",
        "user": "userToGenerateAuthenticationTokens",
        "password": "passwordToGenerateAuthenticationTokens"
    },
  	"entities": [{
  		"schedule": "once",
  		"entity_name": "EntityName1",
  		"entity_type": "EntityType1",
  		"active": [{
  			"name": "active1",
  			"type": "number",
  			"value": "time-linear-interpolator([[0,0],[20,0.25],[21,0.50],[22,0.75],[23,1],[24,1]])"
  		}],
  		"staticAttributes": [{
  			"name": "static1",
  			"type": "string",
  			"value": "Value of static1"
  		}]
  	}, {
  		"schedule": "*/5 * * * * *",
  		"entity_name": "EntityName2",
  		"entity_type": "EntityType2",
  		"active": [{
  			"name": "active1",
  			"type": "number",
  			"value": "time-linear-interpolator([[0,0],[20,0.25],[21,0.50],[22,0.75],[23,1],[24,1]])"
  		}, {
  			"schedule": "*/1 * * * * *",
  			"name": "active2",
  			"type": "number",
  			"value": "time-step-before-interpolator([[0,0],[20,0.25],[21,0.50],[22,0.75],[23,1],[24,1]])"
  		}],
  		"staticAttributes": [{
  			"name": "static1",
  			"type": "string",
  			"value": "Value of static1"
  		}]
  	}, {
  		"count": "3",
  		"entity_type": "EntityType3",
  		"schedule": "*/1 * * * * *",
  		"active": [{
  			"name": "active1",
  			"type": "percentage",
  			"value": "time-random-linear-interpolator([[0,0],[20,random(25,45)],[21,random(50,75)],[22,100],[24,0]])"
  		}, {
  			"schedule": "*/5 * * * * *",
  			"object_id": "a2",
  			"name": "active2",
  			"type": "percentage",
  			"value": "time-random-linear-interpolator([[0,0],[20,random(25,45)],[21,random(50,75)],[22,100],[24,0]])"
  		}],
  		"staticAttributes": [{
  			"name": "static1",
  			"type": "percentage",
  			"value": "time-random-linear-interpolator([[0,0],[20,random(25,45)],[21,random(50,75)],[22,100],[24,0]])"
  		}]
  	}],
  	"devices": [{
  		"schedule": "once",
  		"device_id": "DeviceId1",
  		"entity_name": "DeviceName1",
  		"entity_type": "DeviceType1",
  		"active": [{
  			"object_id": "a1",
  			"name": "active1",
  			"type": "number",
  			"value": "time-linear-interpolator([[0,0],[20,0.25],[21,0.50],[22,0.75],[23,1],[24,1]])"
  		}],
  		"staticAttributes": [{
  			"object_id": "s1",
  			"name": "static1",
  			"type": "string",
  			"value": "Value of static1"
  		}]
  	}, {
  		"schedule": "*/5 * * * * *",
  		"device_id": "DeviceId2",
  		"entity_name": "DeviceName2",
  		"entity_type": "DeviceType2",
  		"active": [{
  			"object_id": "a1",
  			"name": "active1",
  			"type": "number",
  			"value": "time-linear-interpolator([[0,0],[20,0.25],[21,0.50],[22,0.75],[23,1],[24,1]])"
  		}, {
  			"schedule": "*/1 * * * * *",
  			"object_id": "a2",
  			"name": "active2",
  			"type": "number",
  			"value": "time-step-after-interpolator([[0,0],[20,0.25],[21,0.50],[22,0.75],[23,1],[24,1]])"
  		}],
  		"staticAttributes": [{
  			"object_id": "s1",
  			"name": "static1",
  			"type": "string",
  			"value": "Value of static1"
  		}]
  	}, {
  		"count": "5",
  		"entity_type": "DeviceType3",
  		"schedule": "*/1 * * * * *",
  		"active": [{
  			"object_id": "a1",
  			"name": "active1",
  			"type": "percentage",
  			"value": "time-random-linear-interpolator([[0,0],[20,random(25,45)],[21,random(50,75)],[22,100],[24,0]])"
  		}, {
  			"schedule": "*/5 * * * * *",
  			"object_id": "a2",
  			"name": "active2",
  			"type": "percentage",
  			"value": "time-random-linear-interpolator([[0,0],[20,random(25,45)],[21,random(50,75)],[22,100],[24,0]])"
  		}],
  		"staticAttributes": [{
  			"object_id": "s1",
  			"name": "static1",
  			"type": "percentage",
  			"value": "time-random-linear-interpolator([[0,0],[20,random(25,45)],[21,random(50,75)],[22,100],[24,0]])"
  		}]
  	}]
  }
```

The simulation configuration file accepts the following JSON properties or entries:

* **contextBroker**: Includes information about the context broker where the data will be stored.
    * **host**: The host machine name or IP address where the Context Broker is running (or more concretely of the PEP protecting the access to the Context Broker API).
    * **port**: The port where the Context Broker host machine is listening for API requests (or more concretely of the PEP protecting the access to the Context Broker API).
    * **ngsiVersion**: The NGSI version to be used in the requests sent to the Context Broker. Currently, versions `1.0` and `2.0` are supported.
* **authentication**: Includes information about the Identity Service to get tokens to be included in the Context Broker requests.
    * **host**: The host machine or IP where the Identity Service is running.
    * **port**: The port where the Identity Service is listening for requests.
    * **service**: The service associated to the entities and devices included in this simulation configuration file. The authorization tokens will be requested for this service and it will be included in all the interactions with the Context Broker. Distinct simulation should be run for distinct services providing the concrete service in its simulation configuration file.
    * **subsrvice**: The subservice or service path associated to the entities and devices included in this simulation configuration file. The authorization tokens will be requested for this service and it will be included in all the interactions with the Context Broker. Distinct simulation should be run for distinct subservices providing the concrete service in its simulation configuration file.
    * **user**: The user to be used in the authorization token requests for the provided service and subservice.
    * **password**: The password to be used in the authorization token requests for the provided service and subservice.
* **entities**: Information about the entities to be updated during this concrete simulation.
    * **schedule**: Cron-style schedule (according to [https://www.npmjs.com/package/node-schedule#cron-style-scheduling](https://www.npmjs.com/package/node-schedule#cron-style-scheduling)) to schedule the updates of the entity. For example: `*/5 * * * * *` will update the attributes of the entity for which there is no `schedule` information, see below, every 5 seconds, whereas `0 0 0 * * *` will update the attributes of the entity for which there is no `schedule` information, see below, at 00:00 of every first day of each month. A very useful tool for dealing with cron-style schedules can be found at [http://crontab.guru/](http://crontab.guru/). An additional accepted value `once` is included to force the update of the entity only once at the beginning of the simulation.
    * **entity_name**: The name of the entity. The `entity_name` should not be provided if the `count` is provided.
    * **count**: The number of entities to simulate and update. For example, if a value of 3 is provided as the `count` property, 3 entities with names `<entity_type>:1`, `<entity_type>:2` and `<entity_type>:3` will be created and updated accordingly substituting the `<entity_type>` by its provided value (see just below) and according to its active and static attribute simulation specification (see below).
    * **entity_type**: The type of the entity.
    * **active**: List of attributes which will be updated according to their `schedule`s or the main entity `schedule` and the provided `value` (see just below).
        * **schedule**: The schedule by which this attribute should be updated. See the `schedule` property at the entity level above. It is an optional property. In case it is not specified, the entity level `schedule` property will be used.
        * **name**: The name of the attribute.
        * **type**: The type of the attribute.
        * **value**: The value of the attribute. This is the property which provides flexibility and realism to the FIWARE Device Simulator tool. It accepts static values (such as numbers (i.e., `123`), text (i.e., `the attribute value`), arrays (i.e., `[1, 2, 3]`), JSON objects (i.e., `{"key": "value"}`), etc.) as well as interpolator function specifications which the FIWARE Device Simulator tool will use to generate the final values. The supported interpolator function specifications are:
            1. **`time-linear-interpolator`**: It returns float values. On the other hand, it accepts an array of 2 elements arrays corresponding to the decimal hours (see [https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours)) of the day and its specified value. For example, a time linear interpolator specification such as: `[[0,0],[20,0.25],[21,0.50],[22,0.75],[23,1],[24,1]]` will return `0` if the interpolated value is requested at the `00:00` hours, `0.25` if the interpolated value is requested at the `20:00` hours and `0.125` if the interpolated value is requested at the `10:00` hours according to a linear interpolation between `0` and `20` as the decimal hours in the x-axis. This is the reason why a `time-linear-interpolator` is typically specified providing values for the `0` and `24` values in the x-axis according to the available decimal hours in any day. A valid attribute value using the `time-linear-interpolator` is: `time-linear-interpolator([[0,0],[20,0.25],[21,0.50],[22,0.75],[23,1],[24,1]])`.
            2. **`time-random-linear-interpolator`**: It returns float values. On the other hand, it accepts an array of 2 elements arrays corresponding to the decimal hours (see [https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours)) of the day and its specified value which may include the `random()` directive. For example, a time ransom linear interpolator specification such as: `[[0,0],[20,random(0.25,0.50)],[24,1]]` will return `0` if the interpolated value is requested at the `00:00` hours, a random number bigger than `0.25` and smaller than `0.50` if the interpolated value is requested at the `20:00` hours and the corresponding interpolated value between the previous y-axis values if it is requested at a time between the `00:00` hours and the `20:00` hours. This is the reason why a `time-random-linear-interpolator` is typically specified providing values for the `0` and `24` values in the x-axis according to the available decimal hours in any day. A valid attribute value using the `time-random-linear-interpolator` is: `time-random-linear-interpolator([[0,0],[20,random(0.25,0.50)],[24,1]])`.
            3. **`time-step-before-interpolator`**: It returns float values. On the other hand, it accepts an array of 2 elements arrays corresponding to the decimal hours (see [https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours)) of the day and its specified value. For example, a time step before interpolator specification such as: `[[0,0],[20,0.25],[21,0.50],[22,0.75],[23,1],[24,1]]` will return `0` if the interpolated value is requested at the `00:00` hours, `0.25` if the interpolated value is requested at the `20:00` hours and `0.25` if the interpolated value is requested at any time between the `00:00` hours and the `20:00` hours (notice it is called "step-before"). This is the reason why a `time-step-before-interpolator` is typically specified providing values for the `0` and `24` values in the x-axis according to the available decimal hours in any day. A valid attribute value using the `time-step-before-interpolator` is: `time-step-before-interpolator([[0,0],[20,0.25],[21,0.50],[22,0.75],[23,1],[24,1]])`.
            4. **`time-step-after-interpolator`**: It returns float values. On the other hand, it accepts an array of 2 elements arrays corresponding to the decimal hours (see [https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours)) of the day and its specified value. For example, a time step after interpolator specification such as: `[[0,0],[20,0.25],[21,0.50],[22,0.75],[23,1],[24,1]]` will return `0` if the interpolated value is requested at the `00:00` hours, `0.25` if the interpolated value is requested at the `20:00` hours and `0` if the interpolated value is requested at any time between the `00:00` hours and the `20:00` hours (notice it is called "step-after"). This is the reason why a `time-step-after-interpolator` is typically specified providing values for the `0` and `24` values in the x-axis according to the available decimal hours in any day. A valid attribute value using the `time-step-after-interpolator` is: `time-step-before-interpolator([[0,0],[20,0.25],[21,0.50],[22,0.75],[23,1],[24,1]])`.
            5. **`date-increment-interpolator`**: It returns dates in UTC format. On the other hand, it accepts a JSON object including 2 properties: 1) `origin` (the date from when the date will be incremented or `now` for the current date when the value is interpolated) and 2) `increment` (the number of seconds the origin should incremented by. For example, a date increment interpolator specification such as: `{\"origin\": \"now\", \"increment\": 86400}` will return the current hour incremented in `86400` seconds, this is, 1 day, when the interpolated value is requested to be updated. A valid attribute value using the `date-increment-interpolator` is: `date-increment-interpolator({\"origin\": \"now\", \"increment\": 2592000})`.
    * **staticAttributes**: List of attributes which will be included in every update of the entity. Static attributes are just like the active attributes previously described with 1 main remarks: they do not include a `schedule` property since the schedule of the updates of the entity and its attributes is determined by the `schedule` property at the active attributes level or the one specified at the entity level. Although staticAttributes may use any of the available interpolators as their `value` property, they typically include fixed values and no any type of interpolation.
* **devices**: Information about the devices to be updated during this concrete simulation. The `device` property is just like the `entity` property described before with 2 additions:
    1. An additional `device_id` property at the `device` level specifying the device identifier (in case the `count` property is used, the `device_id` property is set just like the `entity_name` as describe above in the `count` property description).
    2. An additional `object_id` property at the `active` or `staticAttributes` level specifying the attribute object (short) identifier.

Following the description of the simulation configuration file accepted properties and leaning on the [FIWARE waste management harmonized data models](http://fiware-datamodels.readthedocs.io/en/latest/WasteManagement/doc/introduction/index.html), we provide a simulation configuration real example file to automatically generate waste management data, more concretely simulating the dynamic filling levels for 8 waste containers spread out at 4 areas (`Oeste` (i.e., West), `Norte` (i.e., North), `Este` (i.e., East) and `Sur` (i.e., South) of the Distrito Telefónica area (where the Telefónica headquarters are located) in Madrid.

```json
{
  "contextBroker": {
    "host": "195.235.93.224",
    "port": 10027,
    "ngsiVersion": "1.0"
  },
  "authentication": {
      "host": "195.235.93.224",
      "port": 15001,
      "service": "theService",
      "subservice": "/theSubservice",
      "user": "theUser",
      "password": "thePassword"
  },
  "entities": [
    {
      "schedule": "once",
      "entity_name": "WasteContainerIsle:Oeste",
      "entity_type": "WasteContainerIsle",
      "staticAttributes": [
        {
          "name": "name",
          "type": "string",
          "value": "Distrito Telefónica - Oeste"
        },
        {
          "name": "description",
          "type": "string",
          "value": "Zona de contenedores Oeste de Distrito Telefónica"
        },
        {
          "name": "features",
          "type": "list",
          "value": ["surface"]
        },
        {
          "name": "location",
          "type": "geo:json",
          "value": [[[-3.6642676591873165,40.51337501088891],[-3.66318941116333,40.51437011409327],[-3.666316866874695,40.51642960455014],[-3.667373657226562,40.51549162664228],[-3.6642676591873165,40.51337501088891]]]
        },
        {
          "name": "address",
          "type": "address",
          "value": {
            "streetAddress" : "Zona Oeste, Ronda de la Comunicación s/n",
            "addressLocality": "Madrid",
            "addressCountry": "ES"
          }
        },
        {
          "name": "containers",
          "type": "list",
          "value": ["WasteContainer:DTO:001", "WasteContainer:DTO:002"]
        }
      ]
    },
    {
      "schedule": "once",
      "entity_name": "WasteContainerIsle:Norte",
      "entity_type": "WasteContainerIsle",
      "staticAttributes": [
        {
          "name": "name",
          "type": "string",
          "value": "Distrito Telefónica - Norte"
        },
        {
          "name": "description",
          "type": "string",
          "value": "Zona de contenedores Norte de Distrito Telefónica"
        },
        {
          "name": "features",
          "type": "list",
          "value": ["surface"]
        },
        {
          "name": "location",
          "type": "geo:json",
          "value": [[[-3.66318941116333,40.51437827061587],[-3.662030696868896,40.51548754844881],[-3.6651098728179927,40.51761633170772],[-3.6664187908172607,40.51649893283121],[-3.66318941116333,40.51437827061587]]]
        },
        {
          "name": "address",
          "type": "address",
          "value": {
            "streetAddress" : "Zona Norte, Ronda de la Comunicación s/n",
            "addressLocality": "Madrid",
            "addressCountry": "ES"
          }
        },
        {
          "name": "containers",
          "type": "list",
          "value": ["WasteContainer:DTN:001", "WasteContainer:DTN:002"]
        }
      ]
    },
    {
      "schedule": "once",
      "entity_name": "WasteContainerIsle:Este",
      "entity_type": "WasteContainerIsle",
      "staticAttributes": [
        {
          "name": "name",
          "type": "string",
          "value": "Distrito Telefónica - Este"
        },
        {
          "name": "description",
          "type": "string",
          "value": "Zona de contenedores Este de Distrito Telefónica"
        },
        {
          "name": "features",
          "type": "list",
          "value": ["surface"]
        },
        {
          "name": "location",
          "type": "geo:json",
          "value": [[[-3.6642730236053462,40.51338316753258],[-3.6614298820495605,40.5115234270992],[-3.6603784561157227,40.51245330376326],[-3.663200139999389,40.51439458365814],[-3.6642730236053462,40.51338316753258]]]
        },
        {
          "name": "address",
          "type": "address",
          "value": {
            "streetAddress" : "Zona Este, Ronda de la Comunicación s/n",
            "addressLocality": "Madrid",
            "addressCountry": "ES"
          }
        },
        {
          "name": "containers",
          "type": "list",
          "value": ["WasteContainer:DTE:001", "WasteContainer:DTE:002"]
        }
      ]
    },
    {
      "schedule": "once",
      "entity_name": "WasteContainerIsle:Sur",
      "entity_type": "WasteContainerIsle",
      "staticAttributes": [
        {
          "name": "name",
          "type": "string",
          "value": "Distrito Telefónica - Sur"
        },
        {
          "name": "description",
          "type": "string",
          "value": "Zona de contenedores Sur de Distrito Telefónica"
        },
        {
          "name": "features",
          "type": "list",
          "value": ["surface"]
        },
        {
          "name": "location",
          "type": "geo:json",
          "value": [[[-3.663210868835449,40.51437011409327],[-3.662030696868896,40.515512017605886],[-3.6591768264770512,40.513627866381356],[-3.660399913787842,40.51245330376326],[-3.663210868835449,40.51437011409327]]]
        },
        {
          "name": "address",
          "type": "address",
          "value": {
            "streetAddress" : "Zona Sur, Ronda de la Comunicación s/n",
            "addressLocality": "Madrid",
            "addressCountry": "ES"
          }
        },
        {
          "name": "containers",
          "type": "list",
          "value": ["WasteContainer:DTS:001", "WasteContainer:DTS:002"]
        }
      ]
    },
    {
      "schedule": "once",
      "entity_name": "WasteContainerModel:001",
      "entity_type": "WasteContainerModel",
      "staticAttributes": [
        {
          "name": "width",
          "type": "number",
          "value": 0.50
        },
        {
          "name": "height",
          "type": "number",
          "value": 0.80
        },
        {
          "name": "depth",
          "type": "number",
          "value": 0.40
        },
        {
          "name": "volumeStored",
          "type": "number",
          "value": 150
        },
        {
          "name": "brandName",
          "type": "string",
          "value": "Modelo de Contenedor 001"
        },
        {
          "name": "modelName",
          "type": "string",
          "value": "001"
        },
        {
          "name": "compliantWith",
          "type": "list",
          "value": ["UNE-EN 840-2:2013"]
        },
        {
          "name": "madeOf",
          "type": "string",
          "value": "plastic"
        },
        {
          "name": "features",
          "type": "list",
          "value": ["wheels", "lid"]
        },
        {
          "name": "category",
          "type": "list",
          "value": ["dumpster"]
        }
      ]
    }
  ],
  "devices": [
    {
      "device_id": "WasteContainer:DTO:001",
      "entity_name": "WasteContainer:DTO:001",
      "entity_type": "WasteContainer",
      "schedule": "*/5 * * * * *",
      "active": [
        {
          "name": "fillingLevel",
          "type": "number",
          "value": "time-random-linear-interpolator([[0,0],[20,random(0.25,0.50)],[21,random(0.50,0.75)],[22,0.75],[23,1],[24,1]])"
        },
        {
          "schedule": "0 0 0 * * *",
          "name": "dateLastEmptying",
          "type": "date",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
        },
        {
          "schedule": "0 0 0 1 * *",
          "name": "dateNextActuation",
          "type": "date",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 2592000})"
        }
      ],
      "staticAttributes": [
        {
          "name": "refWasteContainerModel",
          "type": "string",
          "value": "WasteContainerModel:001"
        },
        {
          "name": "containerIsle",
          "type": "string",
          "value": "WasteContainerIsle:Oeste"
        },
        {
          "name": "serialNumber",
          "type": "string",
          "value": "WasteContainer:DTO:001"
        },
        {
          "name": "location",
          "type": "Point",
          "value": [-3.6661827564239498,40.51538151533159]
        },
        {
          "name": "category",
          "type": "list",
          "value": ["surface"]
        },
        {
          "name": "status",
          "type": "string",
          "value": "ok"
        }
      ]
    },
    {
      "device_id": "WasteContainer:DTO:002",
      "entity_name": "WasteContainer:DTO:002",
      "entity_type": "WasteContainer",
      "schedule": "*/5 * * * * *",
      "active": [
        {
          "name": "fillingLevel",
          "type": "number",
          "value": "time-random-linear-interpolator([[0,0],[20,random(0.25,0.50)],[21,random(0.50,0.75)],[22,0.75],[23,1],[24,1]])"
        },
        {
          "schedule": "0 0 0 * * *",
          "name": "dateLastEmptying",
          "type": "date",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
        },
        {
          "schedule": "0 0 0 1 * *",
          "name": "dateNextActuation",
          "type": "date",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 2592000})"
        }
      ],
      "staticAttributes": [
        {
          "name": "refWasteContainerModel",
          "type": "string",
          "value": "WasteContainerModel:001"
        },
        {
          "name": "containerIsle",
          "type": "string",
          "value": "WasteContainerIsle:Oeste"
        },
        {
          "name": "serialNumber",
          "type": "string",
          "value": "WasteContainer:DTO:002"
        },
        {
          "name": "location",
          "type": "Point",
          "value": [-3.666096925735473,40.515112353588606]
        },
        {
          "name": "category",
          "type": "list",
          "value": ["surface"]
        },
        {
          "name": "status",
          "type": "string",
          "value": "ok"
        }
      ]
    },
    {
      "device_id": "WasteContainer:DTN:001",
      "entity_name": "WasteContainer:DTN:001",
      "entity_type": "WasteContainer",
      "schedule": "*/5 * * * * *",
      "active": [
        {
          "name": "fillingLevel",
          "type": "number",
          "value": "time-random-linear-interpolator([[0,0],[20,random(0.25,0.50)],[21,random(0.50,0.75)],[22,0.75],[23,1],[24,1]])"
        },
        {
          "schedule": "0 0 0 * * *",
          "name": "dateLastEmptying",
          "type": "date",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
        },
        {
          "schedule": "0 0 0 1 * *",
          "name": "dateNextActuation",
          "type": "date",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 2592000})"
        }
      ],
      "staticAttributes": [
        {
          "name": "refWasteContainerModel",
          "type": "string",
          "value": "WasteContainerModel:001"
        },
        {
          "name": "containerIsle",
          "type": "string",
          "value": "WasteContainerIsle:Norte"
        },
        {
          "name": "serialNumber",
          "type": "string",
          "value": "WasteContainer:DTN:001"
        },
        {
          "name": "location",
          "type": "Point",
          "value": [-3.6647772789001465,40.51664574542514]
        },
        {
          "name": "category",
          "type": "list",
          "value": ["surface"]
        },
        {
          "name": "status",
          "type": "string",
          "value": "ok"
        }
      ]
    },
    {
      "device_id": "WasteContainer:DTN:002",
      "entity_name": "WasteContainer:DTN:002",
      "entity_type": "WasteContainer",
      "schedule": "*/5 * * * * *",
      "active": [
        {
          "name": "fillingLevel",
          "type": "number",
          "value": "time-random-linear-interpolator([[0,0],[20,random(0.25,0.50)],[21,random(0.50,0.75)],[22,0.75],[23,1],[24,1]])"
        },
        {
          "schedule": "0 0 0 * * *",
          "name": "dateLastEmptying",
          "type": "date",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
        },
        {
          "schedule": "0 0 0 1 * *",
          "name": "dateNextActuation",
          "type": "date",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 2592000})"
        }
      ],
      "staticAttributes": [
        {
          "name": "refWasteContainerModel",
          "type": "string",
          "value": "WasteContainerModel:001"
        },
        {
          "name": "containerIsle",
          "type": "string",
          "value": "WasteContainerIsle:Norte"
        },
        {
          "name": "serialNumber",
          "type": "string",
          "value": "WasteContainer:DTN:002"
        },
        {
          "name": "location",
          "type": "Point",
          "value": [-3.6647450923919673,40.51627055704617]
        },
        {
          "name": "category",
          "type": "list",
          "value": ["surface"]
        },
        {
          "name": "status",
          "type": "string",
          "value": "ok"
        }
      ]
    },
    {
      "device_id": "WasteContainer:DTE:001",
      "entity_name": "WasteContainer:DTE:001",
      "entity_type": "WasteContainer",
      "schedule": "*/5 * * * * *",
      "active": [
        {
          "name": "fillingLevel",
          "type": "number",
          "value": "time-random-linear-interpolator([[0,0],[20,random(0.25,0.50)],[21,random(0.50,0.75)],[22,0.75],[23,1],[24,1]])"
        },
        {
          "schedule": "0 0 0 * * *",
          "name": "dateLastEmptying",
          "type": "date",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
        },
        {
          "schedule": "0 0 0 1 * *",
          "name": "dateNextActuation",
          "type": "date",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 2592000})"
        }
      ],
      "staticAttributes": [
        {
          "name": "refWasteContainerModel",
          "type": "string",
          "value": "WasteContainerModel:001"
        },
        {
          "name": "containerIsle",
          "type": "string",
          "value": "WasteContainerIsle:Este"
        },
        {
          "name": "serialNumber",
          "type": "string",
          "value": "WasteContainer:DTE:001"
        },
        {
          "name": "location",
          "type": "Point",
          "value": [-3.6606144905090328,40.5138236248174]
        },
        {
          "name": "category",
          "type": "list",
          "value": ["surface"]
        },
        {
          "name": "status",
          "type": "string",
          "value": "ok"
        }
      ]
    },
    {
      "device_id": "WasteContainer:DTE:002",
      "entity_name": "WasteContainer:DTE:002",
      "entity_type": "WasteContainer",
      "schedule": "*/5 * * * * *",
      "active": [
        {
          "name": "fillingLevel",
          "type": "number",
          "value": "time-random-linear-interpolator([[0,0],[20,random(0.25,0.50)],[21,random(0.50,0.75)],[22,0.75],[23,1],[24,1]])"
        },
        {
          "schedule": "0 0 0 * * *",
          "name": "dateLastEmptying",
          "type": "date",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
        },
        {
          "schedule": "0 0 0 1 * *",
          "name": "dateNextActuation",
          "type": "date",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 2592000})"
        }
      ],
      "staticAttributes": [
        {
          "name": "refWasteContainerModel",
          "type": "string",
          "value": "WasteContainerModel:001"
        },
        {
          "name": "containerIsle",
          "type": "string",
          "value": "WasteContainerIsle:Este"
        },
        {
          "name": "serialNumber",
          "type": "string",
          "value": "WasteContainer:DTE:002"
        },
        {
          "name": "location",
          "type": "Point",
          "value": [-3.661140203475952,40.513668649435985]
        },
        {
          "name": "category",
          "type": "list",
          "value": ["surface"]
        },
        {
          "name": "status",
          "type": "string",
          "value": "ok"
        }
      ]
    },
    {
      "device_id": "WasteContainer:DTS:001",
      "entity_name": "WasteContainer:DTS:001",
      "entity_type": "WasteContainer",
      "schedule": "*/5 * * * * *",
      "active": [
        {
          "name": "fillingLevel",
          "type": "number",
          "value": "time-random-linear-interpolator([[0,0],[20,random(0.25,0.50)],[21,random(0.50,0.75)],[22,0.75],[23,1],[24,1]])"
        },
        {
          "schedule": "0 0 0 * * *",
          "name": "dateLastEmptying",
          "type": "date",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
        },
        {
          "schedule": "0 0 0 1 * *",
          "name": "dateNextActuation",
          "type": "date",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 2592000})"
        }
      ],
      "staticAttributes": [
        {
          "name": "refWasteContainerModel",
          "type": "string",
          "value": "WasteContainerModel:001"
        },
        {
          "name": "containerIsle",
          "type": "string",
          "value": "WasteContainerIsle:Sur"
        },
        {
          "name": "serialNumber",
          "type": "string",
          "value": "WasteContainer:DTS:001"
        },
        {
          "name": "location",
          "type": "Point",
          "value": [-3.6622023582458496,40.51242067673018]
        },
        {
          "name": "category",
          "type": "list",
          "value": ["surface"]
        },
        {
          "name": "status",
          "type": "string",
          "value": "ok"
        }
      ]
    },
    {
      "device_id": "WasteContainer:DTS:002",
      "entity_name": "WasteContainer:DTS:002",
      "entity_type": "WasteContainer",
      "schedule": "*/5 * * * * *",
      "active": [
        {
          "name": "fillingLevel",
          "type": "number",
          "value": "time-random-linear-interpolator([[0,0],[20,random(0.25,0.50)],[21,random(0.50,0.75)],[22,0.75],[23,1],[24,1]])"
        },
        {
          "schedule": "0 0 0 * * *",
          "name": "dateLastEmptying",
          "type": "date",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
        },
        {
          "schedule": "0 0 0 1 * *",
          "name": "dateNextActuation",
          "type": "date",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 2592000})"
        }
      ],
      "staticAttributes": [
        {
          "name": "refWasteContainerModel",
          "type": "string",
          "value": "WasteContainerModel:001"
        },
        {
          "name": "containerIsle",
          "type": "string",
          "value": "WasteContainerIsle:Sur"
        },
        {
          "name": "serialNumber",
          "type": "string",
          "value": "WasteContainer:DTS:002"
        },
        {
          "name": "location",
          "type": "Point",
          "value": [-3.662030696868896,40.512893767156115]
        },
        {
          "name": "category",
          "type": "list",
          "value": ["surface"]
        },
        {
          "name": "status",
          "type": "string",
          "value": "ok"
        }
      ]
    }
  ]
}
```

The four mentioned areas or `WasteContainerIsle`s (`Oeste` (i.e., West), `Norte` (i.e., North), `Este` (i.e., East) and `Sur` (i.e., South) at Distrito Telefónica) and the 8 waste containers or `WasteContainer`s can be graphically seen online as a [http://geojson.io/](http://geojson.io/) map at [http://bl.ocks.org/anonymous/raw/82837480c5685f8cffa9d9c013197b0d/](http://bl.ocks.org/anonymous/raw/82837480c5685f8cffa9d9c013197b0d/).

The previously mentioned waste management simulation configuration file will generate entities and attributes in the specified Context Broker such as the ones depicted in the following Telefónica's IoT Platform Portal screenshot:

![Telefónica's IoT Platform Portal screenshot](https://dl.dropboxusercontent.com/u/2461997/Images/Urbo_portal_entities_screenshot.png "Telefónica's IoT Platform Portal screenshot")

The generated entities and attributes can also be checked in this [CSV file](https://dl.dropboxusercontent.com/u/2461997/Docs/Urbo_waste_management_entities.csv).

[Top](#top)

## FIWARE Device Simulator library

The FIWARE Device Simulator library can be found in the [./lib](./lib) directory. It is composed of:

1. The main [`./lib/fiwareDeviceSimulator.js`](./lib/fiwareDeviceSimulator.js) file. It exposes the following functions:
    1. `start()`: it takes a simulation configuration JSON object and returns an instance of `EventEmitter` which informs of the following events to the client:
        * `token-request`: Whenever a new authorization token is requested. No event object is passed as additional information for this event occurrence.
        * `token-response`: Whenever a new authorization token is received. The passed event includes the following properties:
            * - `expires_at`: The expiration date
        * `token-request-scheduled`: Whenever a new authorization token request is scheduled. The passed event includes the following properties:
            * `scheduled_at`: The scheduled date
        * `update-scheduled`: Whenever a new entity update is scheduled. The passed event includes the following properties:
            * `schedule`: The schedule
            * `entity`: Information about the entity to be updated
            * `attributes`: The attributes to be updated
      * `update-request`: Whenever a new entity update is requested.
          * `request`: Details about the update request
      * `update-response`: Whenever a new entity update response is received.
          * `request`: Details about the update request
          * `response`: The body of the received update response
      * `error`: Whenever an error happens
          * `error`: The error
          * `request`: The optional associated request (optional)
      * `stop`: Whenever the simulation is stopped. No event object is passed as additional information for this event occurrence.
      * `end`: Whenever the simulation ends. No event object is passed as additional information for this event occurrence.
    2. `stop()`: it stops the currently running simulation, if any, and emits the `stop` event.
2. The [`./lib/validators/fiwareDeviceSimulatorValidator.js`](./lib/validators/fiwareDeviceSimulatorValidator.js) file. It exposes the following functions:
    * `validateConfiguration`: Validates a simulation configuration object asynchronously taking the simulation configuration object as input as well as a callback which will be called once the validation has been completed passing an error object with further information about the problem in case the simulation configuration object was not valid.
3. The [`./lib/errors`](./lib/errors) directory including:
    1. The [`fdsErrors.js`](./lib/errors/fdsErrors.js) file. It includes the errors which may be sent when running a device simulation.
4. The [`./lib/interpolators`](./lib/interpolators) directory including:
    1. The [`dateIncrementInterpolator.js`](./lib/interpolators/dateIncrementInterpolator.js) file. It implements the date-increment-interpolator attribute value resolver.
    2. The [`linearInterpolator.js`](./lib/interpolators/linearInterpolator.js) file. It implements the time-linear-interpolator attribute value resolver.
    3. The [`randomLinearInterpolator.js`](./lib/interpolators/randomLinearInterpolator.js) file. It implements the time-random-linear-interpolator attribute value resolver.
    4. The [`stepAfterInterpolator.js`](./lib/interpolators/stepAfterInterpolator.js) file. It implements the time-step-after-interpolator attribute value resolver.
    5. The [`stepBeforeInterpolator.js`](./lib/interpolators/stepBeforeInterpolator.js) file. It implements the time-step-before-interpolator attribute value resolver.

[Top](#top)

## Development documentation

### Project build

The project is managed using Grunt Task Runner.

For a list of available task, type
```bash
grunt --help
```

The following sections show the available options in detail.

[Top](#top)

### Testing

[Mocha](http://visionmedia.github.io/mocha/) Test Runner + [Chai](http://chaijs.com/) Assertion Library + [Sinon](http://sinonjs.org/) Spies, stubs.

The test environment is preconfigured to run [BDD](http://chaijs.com/api/bdd/) testing style with
`chai.expect` and `chai.should()` available globally while executing tests, as well as the [Sinon-Chai](http://chaijs.com/plugins/sinon-chai) plugin.

Module mocking during testing can be done with [proxyquire](https://github.com/thlorenz/proxyquire)

To run tests, type
```bash
grunt test
```

Tests reports can be used together with Jenkins to monitor project quality metrics by means of TAP or XUnit plugins.
To generate TAP report in `report/test/unit_tests.tap`, type
```bash
grunt test-report
```

[Top](#top)

### Coding guidelines

jshint, gjslint

Uses provided .jshintrc and .gjslintrc flag files. The latter requires Python and its use can be disabled
while creating the project skeleton with grunt-init.
To check source code style, type
```bash
grunt lint
```

Checkstyle reports can be used together with Jenkins to monitor project quality metrics by means of Checkstyle
and Violations plugins.
To generate Checkstyle and JSLint reports under `report/lint/`, type
```bash
grunt lint-report
```

[Top](#top)

### Continuous testing

Support for continuous testing by modifying a src file or a test.
For continuous testing, type
```bash
grunt watch
```

[Top](#top)

### Source code documentation

dox-foundation

Generates HTML documentation under `site/doc/`. It can be used together with jenkins by means of DocLinks plugin.
For compiling source code documentation, type
```bash
grunt doc
```

[Top](#top)

### Code coverage

Istanbul

Analizes the code coverage of your tests.

To generate an HTML coverage report under `site/coverage/` and to print out a summary, type
```bash
# Use git-bash on Windows
grunt coverage
```

To generate a Cobertura report in `report/coverage/cobertura-coverage.xml` that can be used together with Jenkins to
monitor project quality metrics by means of Cobertura plugin, type
```bash
# Use git-bash on Windows
grunt coverage-report
```

[Top](#top)

### Code complexity

Plato

Analizes code complexity using Plato and stores the report under `site/report/`. It can be used together with jenkins
by means of DocLinks plugin.
For complexity report, type
```bash
grunt complexity
```

[Top](#top)

### PLC

Update the contributors for the project
```bash
grunt contributors
```

[Top](#top)

### Development environment

Initialize your environment with git hooks.
```bash
grunt init-dev-env
```

We strongly suggest you to make an automatic execution of this task for every developer simply by adding the following
lines to your `package.json`
```
{
  "scripts": {
     "postinstall": "grunt init-dev-env"
  }
}
```

[Top](#top)

### Site generation

There is a grunt task to generate the GitHub pages of the project, publishing also coverage, complexity and JSDocs pages.
In order to initialize the GitHub pages, use:

```bash
grunt init-pages
```

This will also create a site folder under the root of your repository. This site folder is detached from your repository's
history, and associated to the gh-pages branch, created for publishing. This initialization action should be done only
once in the project history. Once the site has been initialized, publish with the following command:

```bash
grunt site
```

This command will only work after the developer has executed init-dev-env (that's the goal that will create the detached site).

This command will also launch the coverage, doc and complexity task (see in the above sections).

[Top](#top)

## Contact

* Germán Toro del Valle ([german.torodelvalle@telefonica.com](mailto:german.torodelvalle@telefonica.com), [@gtorodelvalle](http://www.twitter.com/gtorodelvalle))

[Top](#top)
