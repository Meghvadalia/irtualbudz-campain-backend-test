import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import * as Joi from 'joi';

@Injectable()
export class JoiValidationPipe implements PipeTransform {
    constructor(private readonly schema: Joi.ObjectSchema) {}
  
    transform(updateData: any, metadata: ArgumentMetadata) {
        console.log("updateData",updateData)
      const { error } :any = this.schema.validate(updateData);
      if (error) {
        console.log(JSON.stringify(error.details[0].message));
        throw new BadRequestException(error.details[0].message, error);
      }
      return updateData;
    }
  }