import * as fs from 'fs';
import * as path from 'path';

export const createDirectoryIfNotExists = async (directoryPath: string) => {
	if (!fs.existsSync(directoryPath)) {
		fs.mkdirSync(directoryPath, { recursive: true });
	}
};

export const uploadFiles = async (files, destinationDir: string) => {
	const filePaths: string[] = [];
	const maxFileSizeInBytes = 4 * 1024 * 1024;

	const keyword = 'public/';
	let result: string;
	const index = destinationDir.indexOf(keyword);

	if (index !== -1) {
		result = destinationDir.substring(index + keyword.length);
	} else {
		console.log('Keyword not found in the input string.');
	}

	for (const file of files) {
		if (file.size > maxFileSizeInBytes) {
			console.error(`File ${file.originalname} exceeds the allowed size limit of 4MB.`);
			throw new Error(`File ${file.originalname} exceeds the allowed size limit of 4MB.`);
		}

		const fileNameWithoutExtension = file.originalname.split('.').slice(0, -1).join('.');
		const fileNameWithTimestamp = `${fileNameWithoutExtension}_${Date.now()}.${file.originalname
			.split('.')
			.pop()}`;
		const fileNameWithUnderscores = fileNameWithTimestamp.replace(/ /g, '_');

		const fileDestination = path.join(destinationDir, fileNameWithUnderscores);
		try {
			fs.writeFileSync(fileDestination, file.buffer);
			filePaths.push(`/${keyword}${result}/${fileNameWithUnderscores}`);
		} catch (error) {
			console.error('Error writing file:', error);
		}
	}

	return filePaths;
};
