import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CommonService {

  formatDateString(inputDate: string, inputFormat: string = 'yyyy-MM-ddTHH:mm:ss',  outputFormat: string = 'dd-MM-yyyy'): string {
    const parsedDate = new Date(inputDate);
    if (!isNaN(parsedDate.getTime())) {
      // Parse successful, format the date according to outputFormat
      return this.formatDate(parsedDate, outputFormat);
    } else {
      throw new Error('Invalid input date format or input date string.');
    }
  }

  private formatDate(date: Date, format: string= 'dd-MM-yyyy'): string {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    // Pad single digit day/month with zero
    const formattedDay = day < 10 ? `0${day}` : day;
    const formattedMonth = month < 10 ? `0${month}` : month;

    // Replace tokens in outputFormat with actual date values
    return format
      .replace('dd', `${formattedDay}`)
      .replace('MM', `${formattedMonth}`)
      .replace('yyyy', `${year}`);
  }
}
