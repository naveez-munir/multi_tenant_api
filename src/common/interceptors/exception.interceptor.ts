import { 
  Injectable, 
  NestInterceptor, 
  ExecutionContext, 
  CallHandler, 
  HttpException, 
  HttpStatus, 
  Logger 
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ExceptionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ExceptionInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError(error => {
        this.logger.error(`Exception caught: ${error.message}`, error.stack);
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
          return throwError(() => new HttpException('Invalid ID format', HttpStatus.BAD_REQUEST));
        }
        
        if (error.name === 'ValidationError') {
          return throwError(() => new HttpException(
            { message: 'Validation Error', details: error.errors },
            HttpStatus.BAD_REQUEST
          ));
        }
        if (error.code === 11000) { // MongoDB duplicate key error
          const fieldMatch = error.message.match(/index:\s+(?:.*\$)?(\w+)_\d+\s+dup key/);
          const valueMatch = error.message.match(/dup key:\s+{\s+(\w+):\s+"?([^"}\s]+)"?/);
          
          let fieldName = fieldMatch ? fieldMatch[1] : 'unknown';
          let fieldValue = valueMatch ? valueMatch[2] : 'unknown';
          return throwError(() => new HttpException(
            `Duplicate entry found, The ${fieldName} '${fieldValue}' already exists`, 
            HttpStatus.CONFLICT
          ));
        }

        if (error instanceof HttpException) {
          return throwError(() => error);
        }

        return throwError(() => new HttpException(
          'Internal server error', 
          HttpStatus.INTERNAL_SERVER_ERROR
        ));
      })
    );
  }
}
