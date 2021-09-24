import { exampleObservable } from './observable';

exampleObservable().subscribe((v) => {
  document.querySelector('body').textContent = `Value: ${v}`;
});
