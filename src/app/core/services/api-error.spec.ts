import { TestBed } from '@angular/core/testing';
import { ApiError, type ApiErrorState } from './api-error';

describe('ApiError', () => {
  let apiError: ApiError;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    apiError = TestBed.inject(ApiError);
  });

  it('starts without an error', () => {
    expect(apiError.error()).toBeNull();
  });

  it('publishes a reported error through its signal', () => {
    const error: ApiErrorState = {
      status: 503,
      message: 'Service unavailable',
      url: '/api/profile',
    };

    apiError.report(error);

    expect(apiError.error()).toEqual(error);
  });

  it('clears the current error', () => {
    apiError.report({
      status: 500,
      message: 'Server error',
      url: '/api/profile',
    });

    apiError.clear();

    expect(apiError.error()).toBeNull();
  });
});
