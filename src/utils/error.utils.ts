import {
	BadRequestException,
	UnauthorizedException,
	ForbiddenException,
	NotFoundException,
	ConflictException,
	UnprocessableEntityException,
	InternalServerErrorException,
} from '@nestjs/common';

export function handleError(error: Error): void {
	// Handle the error here (e.g., log it, send a notification, etc.)
	console.error('An error occurred:', error.message);
}

export function throwBadRequestException(message: string): void {
	throw new BadRequestException(message);
}

export function throwUnauthorizedException(message: string): void {
	throw new UnauthorizedException(message);
}

export function throwForbiddenException(message: string): void {
	throw new ForbiddenException(message);
}

export function throwNotFoundException(message: string): void {
	throw new NotFoundException(message);
}

export function throwConflictException(message: string): void {
	throw new ConflictException(message);
}

export function throwUnprocessableEntityException(message: string): void {
	throw new UnprocessableEntityException(message);
}

export function throwInternalServerErrorException(message: string): void {
	throw new InternalServerErrorException(message);
}
