export function uniqueKeys(template) {
	const regex = /{{(.*?)}}/g;
	const matches = template.match(regex);
	let replaceKeys = [];
	if (matches) {
		for (const match of matches) {
			const value = match.replace(/{{'|'}}/g, '').trim();
			replaceKeys.push(value);
		}
	} else {
		console.log('No {{variables}} found in the HTML content.');
	}
	replaceKeys = [...new Set(replaceKeys)];
	return replaceKeys;
}

export function templateUpdateFun(template: string, replaceArray) {
	for (let i = 0; i < replaceArray.length; i++) {
		const element = replaceArray[i];
		if(element.categoryData){
			template = template.replace(element.searchKey, element.value + ' "categoryImageTag="'+element.categoryData );
		}else{
			template = template.replace(element.searchKey, element.value ? element.value : '');
		}
	}
	return template;
}

export function formatDateRange(start, end) {
	const startDate = new Date(start);
	const endDate = new Date(end);
  
	const formatter = new Intl.DateTimeFormat('en-US', { month: 'long' });
  
	const startMonth = formatter.format(startDate);
	const endMonth = formatter.format(endDate);
  
	if (startMonth === endMonth) {
	  return `All ${startMonth}`;
	} else {
	  return `${new Date(startDate).getDate()} ${startMonth} To ${new Date(startDate).getDate()} ${endMonth}`;
	}
}