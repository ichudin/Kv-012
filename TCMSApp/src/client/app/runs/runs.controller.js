/**
 * @ngdoc controller
 * @name runsController
 * @memberOf app.runs
 * @description Controls runs view logic
 */

(function () {
    'use strict';

    angular
        .module('app.runs')
        .controller('RunsController', RunsController);

    RunsController.$inject = ['$scope', 'logger', 'FakeRunsFactory', 'dataWrapper',
        'filterFields', 'RunsApiService', 'moment'];

    function RunsController($scope, logger, fakeRuns, dataWrapper, filterFields, RunsApiService, moment) {

        var vm = this;
        vm.deleteSelectedRuns = deleteSelectedRuns;
        vm.selectedRuns = [];
        vm.runCheckBoxClick = runCheckBoxClick;
        vm.refreshView = refreshView;
        vm.processData = processData;

        refreshView();

        function processData(result) {

            if (result.length === 0) {
                result = fakeRuns(100, 10, 3);
                result.forEach(function (data) {
                    RunsApiService.save(data);
                });

            }

            vm.runs = result;
            vm.selectRun = selectRun;
            vm.selectedRun = (vm.runs.length === 0 ? null : vm.runs[0]);
            vm.progress = getProgress();
            vm.testClusters = clusterizeTests();
            vm.filterFields = filterFields.runs.getFields();

            activate();
        }

        function refreshView() {
            RunsApiService.query().$promise.then(processData);
        }

        /**
         * Activates logger notification
         *
         * @memberOf runsController
         * @example
         * activate();
         */
        function activate() {
            logger.info('Activated Runs View');
        }

        /**
         * calculation number of passed and failed tests in selected run
         * @returns {{passed: number, failed: number, length: *}}
         */
        function getProgress() {
            if (vm.selectedRun === null) return;

            var progress = {passed: 0, failed: 0, length: vm.selectedRun.tests.length};

            for (var i = 0; i < vm.selectedRun.tests.length; i++) {
                if (vm.selectedRun.tests[i].status === 'passed') progress.passed++;
                if (vm.selectedRun.tests[i].status === 'failed') progress.failed++;
            }

            return progress;
        }

        /**
         * change selected run index and recalculate progress object
         * @param id
         */
        function selectRun(id) {
            if (id !== vm.selectedRun._id) {
                for (var i = 0; i < vm.runs.length; i++) {
                    if (vm.runs[i]._id === id) {
                        vm.selectedRun = vm.runs[i];
                        break;
                    }

                }
                vm.progress = getProgress();
                vm.testClusters = clusterizeTests();
            }
        }

        /**
         * add and remove row indexes form array of selected runs by checkboxes
         * @param e - event object
         * @param i - index of run
         */
        function runCheckBoxClick(e, i) {
            e.stopPropagation();
            if (e.target.checked) vm.selectedRuns.push(i);
            else vm.selectedRuns.splice(vm.selectedRuns.indexOf(i), 1);
        }

        /**
         * function for clusterization test cases in selected test run by their suite
         * @returns {*} array of clusters
         */
        function clusterizeTests() {
            if (vm.runs.length === 0) return;

            var tests = vm.selectedRun.tests;

            if (tests.length === 0) return [];

            tests = tests.sort(function (a, b) {
                return (a.suite <= b.suite ? 0 : 1);
            });
            var clusters = [[tests[0]]];

            for (var i = 1; i < tests.length; i++) {
                if (clusters[clusters.length - 1].length === 0 || tests[i].suite !== clusters[clusters.length - 1][0].suite) {  // jshint ignore:line
                    clusters[clusters.length] = [];
                }
                clusters[clusters.length - 1].push(tests[i]);
            }

            return clusters;

        }

        function deleteSelectedRuns() {
            var length = vm.selectedRuns.length;
            for (var i = 0; i < length; i++) {
                RunsApiService.remove({id: vm.runs[vm.selectedRuns[i]]._id}).$promise.then(function() {
                    refreshView();
                }, function(err) {
                    refreshView();
                });
                vm.runs.splice(vm.selectedRuns[i], 1);
                for (var j = i + 1; j < length; j++) {
                    vm.selectedRuns[j]--;
                }
            }
            vm.selectedRuns.length = 0;
        }
    }
})();
