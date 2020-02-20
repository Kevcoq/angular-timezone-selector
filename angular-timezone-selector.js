/*global angular, moment, jstz*/

/**
 * angular-timezone-selector
 *
 * A simple directive that allows a user to pick their timezone
 *
 * Author:  Kevin Coquart <kevin.coquart.pro@gmail.com>
 * Date:    20/02/2020
 * License: MIT
 */

angular.module('angular-timezone-selector', [])
  .constant('moment', moment)
  .factory('timezoneFactory', ['moment', function (moment) {
    return {
      get: function () {
        const timezoneMap = {}
        moment.tz.names().forEach(zoneName => {
          const tz = moment.tz(zoneName)
          timezoneMap[zoneName] = {
            id: zoneName,
            name: zoneName.replace(/_/g, ' '),
            offset: 'UTC' + tz.format('Z'),
            nOffset: tz.utcOffset()
          }
        })
        return timezoneMap
      }
    }
  }])

  // Timezone name to country codemap
  .factory('zoneToCC', function () {
    // Note: zones is populated with the data from 'data/zone.csv' when this file is built
    const zones = []
    const zoneMap = {}
    zones.forEach(zone => zoneMap[zone.name] = zone.cca2)
    return zoneMap
  })

  // Country code to country name map
  .factory('CCToCountryName', function () {
    // Note: codes is populated with the data from 'data/cca2_to_country_name.csv' when this file is built
    const codes = []
    const codeMap = {}
    codes.forEach(code => codeMap[code.cca2] = code.name)
    return codeMap
  })

  .directive('timezoneSelector', ['moment', 'timezoneFactory', 'zoneToCC', 'CCToCountryName', function (moment, timezoneFactory, zoneToCC, CCToCountryName) {
    return {
      restrict: 'E',
      replace: true,
      template: '<select ng-options="item.country.id as item.country.name group by item.text for item in data" style="min-width:300px;"><option value=""></option></select>',
      scope: {
        ngModel: '=',
        translations: '='
      },
      link: function ($scope, elem, attrs) {
        // Native
        const sortBy = (key) => {
          return (a, b) => (a[key] > b[key]) ? 1 : ((b[key] > a[key]) ? -1 : 0)
        }

        // Native
        const get = (obj, path, defaultValue) => {
          const travel = regexp =>
            String.prototype.split
              .call(path, regexp)
              .filter(Boolean)
              .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj)
          const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/)
          return result === undefined || result === obj ? defaultValue : result
        }

        let extraTZs
        let data = []
        const timezones = timezoneFactory.get()

        // Group the timezones by their country code
        const timezonesGroupedByCC = {}
        Object.values(timezones).forEach(timezone => {
          if (get(zoneToCC, timezone.id, false)) {
            const CC = zoneToCC[timezone.id]
            timezonesGroupedByCC[CC] = !timezonesGroupedByCC[CC] ? [] : timezonesGroupedByCC[CC]
            timezonesGroupedByCC[CC].push(timezone)
          }
        })

        // Add the grouped countries to the data array with their country name as the group option
        Object.entries(timezonesGroupedByCC).forEach(entry => {
          const zonesByCountry = entry[1]
          const CC = entry[0]
          zonesByCountry.forEach(country => {
            data.push({
              text: CCToCountryName[CC] + ': ',
              country: country,
              firstNOffset: zonesByCountry[0].nOffset,
              firstOffset: zonesByCountry[0].offset
            })
          })
        })

        // Sort by UTC or country name
        if (attrs.sortBy === 'offset') {
          data = data.concat().sort(sortBy('nOffset'))
        } else {
          data = data.concat().sort(sortBy('text'))
        }

        // add initial options forlocal
        if (attrs.showLocal !== undefined) {
          if (jstz !== undefined) {
            // Make sure the tz from jstz has underscores replaced with spaces so it matches
            // the format used in timezoneFactory
            extraTZs = Object.values(timezones).filter(timezone => timezone.id === jstz.determine().name())
          } else {
            const localUTC = 'UTC' + moment().format('Z')
            extraTZs = Object.values(timezones).filter(timezone => timezone.offset === localUTC)
          }

          if (extraTZs !== undefined && extraTZs.length > 0) {
            extraTZs.forEach(extraTZ => {
              data.splice(0, 0, {
                text: get($scope, 'translations.local', 'Local') + ': ',
                country: extraTZ,
                firstNOffset: extraTZ.nOffset,
                firstOffset: extraTZ.offset
              })
            })
          }
        }

        if (attrs.setLocal !== undefined) {
          if (jstz !== undefined) {
            $scope.ngModel || ($scope.ngModel = jstz.determine().name())
          }
        }

        // add initial options
        if (attrs.primaryChoices !== undefined) {
          const primaryChoices = []
          attrs.primaryChoices.split(' ').forEach(choice => {
            primaryChoices.push(choice.replace('_', ' '))
          })
          extraTZs = timezones.filter(tz => primaryChoices.includes(tz.name))

          if (extraTZs !== undefined && extraTZs.length > 0) {
            extraTZs.forEach(extraTZ => {
              data.splice(0, 0, {
                text: get($scope, 'translations.local', 'Local') + ': ',
                country: extraTZ,
                firstNOffset: extraTZ.nOffset,
                firstOffset: extraTZ.offset
              })
            })
          }
        }

        // Annotate the names of the timezones if display UTC is true
        if (attrs.displayUtc === 'true') {
          data.forEach(item => {
            if (item.country.name.indexOf('(UTC') === -1) {
              item.country.name = item.country.name + ' (' + item.country.offset + ')'
            }
          })
        }

        // Put the data on the scope for access
        $scope.data = data

        // Initialise the chosen box
        elem.chosen({
          width: attrs.width || '300px',
          include_group_label_in_selected: true,
          search_contains: true,
          no_results_text: get($scope, 'translations.no_results_text',
            'No results, try searching for the name of your country or nearest major city.'),
          placeholder_text_single: get($scope, 'translations.placeholder', 'Choose a timezone')
        })

        // This is a setup function and this is a hack, but it works to fire the setup function once at the right time
        var watch = $scope.$watch('ngModel', setup)

        function setup () {
          if ($scope.initModel) {
            elem.val($scope.ngModel)
          }
          $scope.initModel = true
          elem.trigger('chosen:updated')
          watch()
        }
      }
    }
  }])
