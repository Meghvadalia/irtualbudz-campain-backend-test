import * as fs from 'fs';
import * as path from 'path';

export const createDirectoryIfNotExists = async (directoryPath: string) => {
	if (!fs.existsSync(directoryPath)) {
		fs.mkdirSync(directoryPath, { recursive: true });
	}
};

export const uploadFiles = async (files, destinationDir: string) => {
	const filePaths: string[] = [];

	let keyword = 'public/';
	let result: string;
	const index = destinationDir.indexOf(keyword);

	if (index !== -1) {
		result = destinationDir.substring(index + keyword.length);
	} else {
		console.log('Keyword not found in the input string.');
	}

	for (const file of files) {
		const fileNameWithoutExtension = file.originalname.split('.').slice(0, -1).join('.');
		const fileNameWithTimestamp = `${fileNameWithoutExtension}_${Date.now()}.${file.originalname.split('.').pop()}`;
		const fileNameWithUnderscores = fileNameWithTimestamp.replace(/ /g, '_');

		const fileDestination = path.join(destinationDir, fileNameWithUnderscores);
		try {
			fs.writeFileSync(fileDestination, file.buffer);
		} catch (error) {
			console.error('Error writing file:', error);
		}
		filePaths.push(`/${keyword}${result}/${fileNameWithUnderscores}`);
	}

	return filePaths;
};
