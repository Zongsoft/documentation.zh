import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 在相邻的 discussions、framework、hosting、tools 工作树上核对文档摘录。
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const records = JSON.parse(fs.readFileSync(path.join(root, '.gitbook/discussions-examples.json'), 'utf8'));
const errors = [];
const read = file => fs.readFileSync(file, 'utf8').replace(/\r/g, '');
const normalize = text => {
	const lines = text.trimEnd().split('\n');
	const indent = Math.min(...lines.filter(line => line.trim()).map(line => line.match(/^\t*/)[0].length));
	return lines.map(line => line.startsWith('\t'.repeat(indent)) ? line.slice(indent) : line).join('\n');
};

for(const record of records) {
	const repository = /^(framework|hosting|tools)\//.test(record.file) ? record.file : 'discussions/' + record.file;
	const source = path.resolve(root, '..', repository);
	try {
		const excerpt = read(source).split('\n').slice(record.start - 1, record.end).join('\n');
		if(normalize(excerpt) !== normalize(record.code))
			errors.push(`${record.page}: 源码摘录已变化：${record.file}:${record.start}`);
		const page = read(path.join(root, record.page));
		if(!page.includes('\n' + record.code + '\n```'))
			errors.push(`${record.page}: 正文中的代码与来源记录不一致：${record.file}`);
	} catch(error) {
		errors.push(`${record.page}: ${error.message}`);
	}
}

if(errors.length) {
	console.error(errors.join('\n'));
	process.exitCode = 1;
} else {
	console.log(`通过：${records.length} 段摘录，${new Set(records.map(record => record.page)).size} 篇页面。`);
}
