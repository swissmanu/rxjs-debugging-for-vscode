import { TestBed } from '@angular/core/testing';

import { ObservableService } from './observable.service';

describe('ObservableService', () => {
  let service: ObservableService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ObservableService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
