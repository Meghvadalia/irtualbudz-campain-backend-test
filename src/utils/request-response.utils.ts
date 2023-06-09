import {
	ValidationPipe,
	BadRequestException,
	HttpException,
	HttpStatus,
	ArgumentsHost,
	Catch,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { Response } from 'express';
export async function validateRequest<T extends object>(
	data: T,
	dtoClass: new () => T
): Promise<void> {
	const transformedData = plainToClass(dtoClass, data);
	const errors = await validate(transformedData);

	if (errors.length > 0) {
		const errorMessage = formatValidationErrors(errors);
		throw new BadRequestException(errorMessage);
	}
}

export function validateResponse<T>(data: T, dtoClass: new () => T): T {
	return plainToClass(dtoClass, data);
}

export function formatValidationErrors(errors: ValidationError[]): string {
	return errors
		.map((error) => {
			const constraints = Object.values(error.constraints);
			return constraints.join(', ');
		})
		.join(', ');
}

export function sendSuccess<T>(
	data: T,
	message: string = 'Success',
	statusCode: number = HttpStatus.OK
): ApiResponse<T> {
	return {
		status: 'success',
		statusCode,
		message,
		data,
	};
}

export function sendError<T>(
	message: string,
	statusCode: number
): ApiResponse<T> {
	return {
		status: 'error',
		statusCode,
		message,
		data: null,
	};
}

export interface ApiResponse<T> {
	status: 'success' | 'error';
	statusCode: number;
	message: string;
	data: T | null;
}

@Catch()
export class AllExceptionsFilter {
	catch(exception: any, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const status =
			exception instanceof HttpException
				? exception.getStatus()
				: HttpStatus.INTERNAL_SERVER_ERROR;
		const message =
			exception instanceof HttpException
				? exception.message
				: 'Internal Server Error';

		response.status(status).json(sendError(message, status));
	}
}
