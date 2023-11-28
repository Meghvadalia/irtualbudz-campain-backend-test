import { openai } from 'src/main';

export const generateTemplateMessage = async (prompt: string) => {
	const chatCompletion = await openai.chat.completions.create({
		messages: [{ role: 'user', content: prompt }],
		model: 'gpt-3.5-turbo',
	});

	return chatCompletion.choices;
};
