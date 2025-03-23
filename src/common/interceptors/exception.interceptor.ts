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
          return throwError(() => new HttpException(
            'Duplicate entry found', 
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
