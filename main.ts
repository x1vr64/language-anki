import { Editor, Plugin, requestUrl } from 'obsidian';

const DELIMITER = " = ";

function isOnlyBulletPrefix(value: string) {
	return value.trim().startsWith("- [") || value.trim() === "-";
}

export default class MyPlugin extends Plugin {
	onload() {
		this.addCommand({
			id: "translate-word",
			name: "Translate selected word",
			hotkeys: [{modifiers: ["Mod", "Shift"], key: "a"}],
			editorCallback: (editor: Editor) => {
				const currentLine = editor.getCursor().line;

				// pick at most 30 character. We only need find delimiter
				const value = editor.getLine(currentLine).substring(0, 30).trimEnd();
				console.log(`Selected line ${currentLine}. Value: ${value}`)

				if (value.length === 0 || isOnlyBulletPrefix(value)) {
					console.log(`Empty line. Skip`)
					return;
				}

				if (value.contains(DELIMITER)) {
					console.log(`Line ${currentLine} contains delimiter:[${DELIMITER}]. Skip`)
					return;
				}

				this.translateWord(value)
					.then((res) => editor.setLine(currentLine, `${value}${DELIMITER}${res}`));
			},
		});
	}

	private async translateWord(value: string) {
		console.log(`Send request to google api. Translate value: ${value}`)
		const url = [
			`https://translate.google.com/translate_a/single`,
			'?client=at',
			'&dt=t',  // return sentences
			// '&dt=rm', // add translit to sentences
			'&dj=1',  // result as pretty json instead of deep nested arrays
		].join('');
		const body = this.buildBody(value);

		const {sentences} = await requestUrl({
			method: 'POST',
			url: url,
			body: body,
			contentType: 'application/x-www-form-urlencoded;charset=utf-8'
		}).json
		return sentences[0]['trans']
	}

	protected buildBody(inputText: string) {
		const params = {
			sl: 'en',
			tl: 'ru',
			q: inputText,
		};
		return new URLSearchParams(params).toString();
	}
}
