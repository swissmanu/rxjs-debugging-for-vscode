const { interval } = require('rxjs');
const { map, take } = require('rxjs/operators');

module.exports = function exampleObservable() {
  return interval(1000).pipe(
    take(4),
    map((i) => i * 2),
    map((i) => i * 20)
  );
};
