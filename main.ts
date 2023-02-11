import { Editor, Plugin, requestUrl } from 'obsidian';

export default class ObsidianLanguageAnkiPlugin extends Plugin {
	onload() {
		function isOnlyBulletPrefix(value: string) {
			return value.startsWith("- [") || value === "-";
		}

		this.addCommand({
			id: "translate-word",
			name: "Translate selected word",
			hotkeys: [{modifiers: ["Mod", "Shift"], key: "a"}],
			editorCallback: (editor: Editor) => {
				const DELIMITER = " = ";
				const currentLine = editor.getCursor().line;

				const value = editor.getLine(currentLine);

				if (value.length === 0 || isOnlyBulletPrefix(value)) {
					return;
				}

				if (value.contains(DELIMITER)) {
					return;
				}

				this.translateWord(value)
					.then((res) => editor.setLine(currentLine, `${value}${DELIMITER}${res}`));
			},
		});
	}

	private async translateWord(value: string) {
		const url = `https://translate.google.com/translate_a/single` +
			'?client=at' +
			'&dt=t' + // return sentences
			'&dj=1' // result as pretty json instead of deep nested arrays
		;
		const body = this.buildBody(value);
		const response = await requestUrl({
			method: 'POST',
			url: url,
			body: body,
			contentType: 'application/x-www-form-urlencoded;charset=utf-8'
		})
		console.log(response.status)
		console.log(response)
		return response.json['sentences'][0]['trans']
	}

	protected buildBody(inputText: string) {
		return 'sl=en&tl=ru&q=' + encodeURIComponent(inputText);
	}
}
