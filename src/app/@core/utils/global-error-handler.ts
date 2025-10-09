import { ErrorHandler, Injectable } from '@angular/core';

export class GlobalErrorHandler implements ErrorHandler {
  constructor() {}
  handleError(errorMsg: any) {
    // this.utilsService.showWarning(error);
    console.error('An error occurred : ', errorMsg);
  }
}
