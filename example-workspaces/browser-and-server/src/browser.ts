import { exampleObservable } from './observable';

exampleObservable().subscribe((x) => {
  document.querySelector('body').textContent = `Value: ${x}`;
});
