import { App, Editor, Notice, Plugin, PluginSettingTab, requestUrl, Setting } from 'obsidian';

interface AnkiPluginSettings {
	googleApiKey: string;
}

const DEFAULT_SETTINGS: AnkiPluginSettings = {
	googleApiKey: 'default'
}

export default class ObsidianLanguageAnkiPlugin extends Plugin {
	settings: AnkiPluginSettings;

	async onload() {
		await this.loadSettings();

		function isOnlyBulletPrefix(value: string) {
			return value.startsWith("- [") || value === "-";
		}

		this.addCommand({
			id: "translate-word",
			name: "Translate selected word",
			hotkeys: [{modifiers: ["Mod", "Shift"], key: "a"}],
			editorCallback: (editor: Editor) => {
				if (this.settings.googleApiKey === 'default') {
					new Notice('Google api key not set');
					return;
				}

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

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new AnkiSettingTab(this.app, this));
	}

	private async translateWord(value: string) {
		const url = 'https://translation.googleapis.com/language/translate/v2'
		const body = {
			"q": value,
			"source": "en",
			"target": "ru",
			"format": "text"
		};
		const response = await requestUrl({
			throw: false,
			method: 'POST',
			url: url,
			body: JSON.stringify(body),
			headers: {
				'Authorization': `Bearer ${this.settings.googleApiKey}`,
				'x-goog-user-project': 'neat-striker-377509',
			},
			contentType: 'application/json; charset=utf-8'
		})
		if (response.status != 200) {
			return JSON.stringify(response, null, 2)
		}
		return response.json['data']['translations'][0]['translatedText']
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


class AnkiSettingTab extends PluginSettingTab {
	plugin: ObsidianLanguageAnkiPlugin;

	constructor(app: App, plugin: ObsidianLanguageAnkiPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Language Anki settings'});

		new Setting(containerEl)
			.setName('Google api key')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.googleApiKey)
				.onChange(async (value) => {
					this.plugin.settings.googleApiKey = value;
					await this.plugin.saveSettings();
				}));
	}
}
