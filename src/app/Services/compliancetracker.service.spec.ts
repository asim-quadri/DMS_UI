import { TestBed } from '@angular/core/testing';

import { CompliancetrackerService } from './compliancetracker.service';

describe('CompliancetrackerService', () => {
  let service: CompliancetrackerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CompliancetrackerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
