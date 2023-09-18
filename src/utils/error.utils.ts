import {
	BadRequestException,
	UnauthorizedException,
	ForbiddenException,
	NotFoundException,
	ConflictException,
	UnprocessableEntityException,
	InternalServerErrorException,
	MethodNotAllowedException,
	NotAcceptableException,
	GoneException,
	PayloadTooLargeException,
	UnsupportedMediaTypeException,
	HttpException,
} from '@nestjs/common';

export function handleError(error: Error): void {
	// Handle the error here (e.g., log it, send a notification, etc.)
	console.error('An error occurred:', error.message);
}

export function throwBadRequestException(message): void {
	throw new BadRequestException(message);
}

export function throwUnauthorizedException(message): void {
	throw new UnauthorizedException(message);
}

export function throwForbiddenException(message): void {
	throw new ForbiddenException(message);
}

export function throwNotFoundException(message): void {
	throw new NotFoundException(message);
}

export function throwConflictException(message): void {
	throw new ConflictException(message);
}

export function throwUnprocessableEntityException(message): void {
	throw new UnprocessableEntityException(message);
}

export function throwInternalServerErrorException(message): void {
	throw new InternalServerErrorException(message);
}

export function throwNotAcceptableException(message): void {
	throw new NotAcceptableException(message);
}

export function throwMethodNotAllowedException(message): void {
	throw new MethodNotAllowedException(message);
}

export function throwGoneException(message): void {
	throw new GoneException(message);
}

export function throwPayloadTooLargeException(message): void {
	throw new PayloadTooLargeException(message);
}

export function throwUnsupportedMediaTypeException(message): void {
	throw new UnsupportedMediaTypeException(message);
}

export function dynamicCatchException(error) {
	console.log(error.name)
	if (error.name === "NotFoundException") {
		// Handle NotFoundException (404) here
		// For example, return a 404 response or log the error
		throwNotFoundException(error);
	} else if (error.name === "ValidationError") {
		// Handle BadRequestException (400) here
		// For example, return a 400 response or log the error
		throwBadRequestException(error);
	} else if (error.name === "UnauthorizedException") {
		// Handle UnauthorizedException (401) here
		// For example, return a 401 response or log the error
		throwUnauthorizedException(error);
	} else if (error.name === "ForbiddenException") {
		// Handle ForbiddenException (403) here
		// For example, return a 403 response or log the error
		throwForbiddenException(error);
	} else if (error.name === "InternalServerErrorException") {
		// Handle InternalServerErrorException (500) here
		// For example, return a 500 response or log the error
		throwInternalServerErrorException(error);
	} else if (error.name === "MethodNotAllowedException") {
		// Handle MethodNotAllowedException (405) here
		// For example, return a 405 response or log the error
		throwMethodNotAllowedException(error);
	} else if (error.name === "NotAcceptableException") {
		// Handle NotAcceptableException (406) here
		// For example, return a 406 response or log the error
		throwNotAcceptableException(error);
	} else if (error.name === "ConflictException") {
		// Handle ConflictException (409) here
		// For example, return a 409 response or log the error
		throwConflictException(error);
	} else if (error.name === "GoneException") {
		// Handle GoneException (410) here
		// For example, return a 410 response or log the error
		throwGoneException(error);
	} else if (error.name === "PayloadTooLargeException") {
		// Handle PayloadTooLargeException (413) here
		// For example, return a 413 response or log the error
		throwPayloadTooLargeException(error);
	} else if (error.name === "UnsupportedMediaTypeException") {
		// Handle UnsupportedMediaTypeException (415) here
		// For example, return a 415 response or log the error
		throwUnsupportedMediaTypeException(error);
	} else {
		// Handle other unexpected errors with InternalServerErrorException (500)
		// For example, return a generic 500 response or log the error
		throwInternalServerErrorException(error);
	}
	
}