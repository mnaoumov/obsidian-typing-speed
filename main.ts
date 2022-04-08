import { App, Editor, editorViewField, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface TypingSpeedSettings {
	metrics: string;
}

const DEFAULT_SETTINGS: TypingSpeedSettings = {
	metrics: 'wpm'
}

function average_array(array: number[]): number {
	var avg = 0;
	array.forEach((val: number, idx: number) => {
		avg += val;
	});

	return avg / array.length;
}

export default class TypingSpeedPlugin extends Plugin {
	settings: TypingSpeedSettings;

	keyTyped: number[] = [0];
	wordTyped: number[] = [0];

	keyTypedInSecond: number = 0;
	wordTypedInSecond: number = 0;
	keyTypedSinceSpace: number = 0;

	statusBarItemEl: HTMLElement;
	async onload() {
		await this.loadSettings();

		this.statusBarItemEl = this.addStatusBarItem();
		this.statusBarItemEl.setText('');

		this.addSettingTab(new TypingSpeedSettingTab(this.app, this));

		this.registerDomEvent(document, 'keydown', (evt: KeyboardEvent) => {

			// only some key are valid
			const keyRegex: RegExp = /^[A-Za-z,;1-9]$/g;

			if (evt.key.match(keyRegex)) {
				this.keyTypedInSecond += 1;
				this.keyTypedSinceSpace += 1;
			}

			if (evt.key == ' ' && this.keyTypedSinceSpace != 0) {
				this.wordTypedInSecond += 1;
				this.keyTypedSinceSpace = 0;
			}

		});

		this.registerInterval(window.setInterval(() => {

			var average = 0;
			if (this.settings.metrics == 'cps') {
				if (this.keyTyped.push(this.keyTypedInSecond) > 10) {
					this.keyTyped.shift();
				}
				average = Math.round(average_array(this.keyTyped));
				this.keyTypedInSecond = 0;


			}
			else if (this.settings.metrics == 'wpm') {

				if (this.wordTyped.push(this.wordTypedInSecond) > 10) {
					this.wordTyped.shift();
				}
				average = Math.round(average_array(this.wordTyped) * 60);
				this.wordTypedInSecond = 0;

			}

			this.statusBarItemEl.setText(average + ' ' + this.settings.metrics);
		}, 1000));
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


class TypingSpeedSettingTab extends PluginSettingTab {
	plugin: TypingSpeedPlugin;

	constructor(app: App, plugin: TypingSpeedPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Settings for typing-speed plugin' });

		new Setting(containerEl)
			.setName('Typing speed metric')
			.setDesc('choose which metric to use for typing speed')
			.addDropdown(text => text
				.addOption('wpm', 'word per minute')
				.addOption('cps', 'character per second')
				.setValue(this.plugin.settings.metrics)
				.onChange(async (value) => {
					this.plugin.settings.metrics = value;
					await this.plugin.saveSettings();
				}));
	}
}