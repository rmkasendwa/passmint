import { Equals } from 'class-validator';

export class CancelEventDto {
  @Equals(true, { message: 'Confirm cancellation before continuing.' })
  confirm: boolean;
}
