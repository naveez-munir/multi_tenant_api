import { Matches, IsEmail, ValidationOptions } from 'class-validator';

export function IsPakistaniCNIC(validationOptions?: ValidationOptions) {
  return Matches(/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/, {
    message: 'CNIC must be in format: 00000-0000000-0',
    ...validationOptions
  });
}

export function IsPakistaniPhone(validationOptions?: ValidationOptions) {
  return Matches(/^(\+92|0)[0-9]{10}$/, {
    message: 'Phone must be a valid Pakistan number (e.g., +923001234567 or 03001234567)',
    ...validationOptions
  });
}
