import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'getFileExtension',
})
export class GetFileExtension implements PipeTransform {
  transform(filename: string) {
    return filename.split('.').at(-1);
  }
}
