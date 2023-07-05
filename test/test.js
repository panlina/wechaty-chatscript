/** @typedef { import("wechaty").Message } Message */
/** @typedef { import("wechaty").Contact } Contact */
/** @typedef { import("wechaty").Room } Room */

var assert = require('assert');
var EventEmitter = require('events');
var { Wechaty, Message } = require('wechaty')
var { PuppetMock, mock: { Mocker } } = require('wechaty-puppet-mock');
var WechatyChatscriptPlugin = require('..');

it('', async () => {
	var mocker = new Mocker();

	var puppet = new PuppetMock({ mocker });
	var bot = new Wechaty({ puppet });
	bot.use(new WechatyChatscriptPlugin(`
		on receive message do (
			message.text = "ding" ?
				(send "dong" to message.sender;) : 0
		);
	`));

	await bot.start();

	mocker.scan('https://github.com/wechaty', 1);
	var user = mocker.createContact();
	mocker.login(user);

	var contact = mocker.createContact();

	await sleep(100);
	contact.say("ding").to(user);

	var message = await waitForMessage(contact);
	assert.equal(message.text(), "dong");

	await bot.stop();
});

it('echo', async () => {
	var mocker = new Mocker();

	var puppet = new PuppetMock({ mocker });
	var bot = new Wechaty({ puppet });
	bot.use(new WechatyChatscriptPlugin(`
		while 1 do {
			var message;
			var sender;
			receive message from sender;
			send message to sender;
		}
	`));

	await bot.start();

	mocker.scan('https://github.com/wechaty', 1);
	var user = mocker.createContact();
	mocker.login(user);

	var contact = mocker.createContact();

	await sleep(100);
	contact.say("a").to(user);

	var message = await waitForMessage(contact);
	assert.equal(message.text(), "a");

	await bot.stop();
});

describe('emit errors', () => {
	it('parse error', async () => {
		var mocker = new Mocker();

		var puppet = new PuppetMock({ mocker });
		var bot = new Wechaty({ puppet });
		var installer = new WechatyChatscriptPlugin(")");
		var uninstaller = installer(bot);

		await waitForError(uninstaller.eventEmitter);
	});
	it('runtime error', async () => {
		var mocker = new Mocker();

		var puppet = new PuppetMock({ mocker });
		var bot = new Wechaty({ puppet });
		var installer = new WechatyChatscriptPlugin("a;");
		var uninstaller = installer(bot);

		await waitForError(uninstaller.eventEmitter);
	});
	it('handler runtime error', async () => {
		var mocker = new Mocker();

		var puppet = new PuppetMock({ mocker });
		var bot = new Wechaty({ puppet });
		var installer = new WechatyChatscriptPlugin("on receive message do a;");
		var uninstaller = installer(bot);

		await bot.start();

		mocker.scan('https://github.com/wechaty', 1);
		var user = mocker.createContact();
		mocker.login(user);

		var contact = mocker.createContact();

		await sleep(100);
		contact.say("a").to(user);

		await waitForError(uninstaller.eventEmitter);

		await sleep(100);
		contact.say("a").to(user);

		await waitForError(uninstaller.eventEmitter);

		await bot.stop();
	});
});

/**
 * @param {Contact | Room} conversation
 * @return {Promise<Message>}
 */
function waitForMessage(conversation) {
	return require('promise-timeout').timeout(
		new Promise(resolve => {
			conversation.once('message', resolve);
		}),
		100
	);
}

/**
 * @param {EventEmitter} eventEmitter
 * @return {Promise<Error>}
 */
function waitForError(eventEmitter) {
	return require('promise-timeout').timeout(
		new Promise(resolve => {
			eventEmitter.once('error', resolve);
		}),
		100
	);
}

/**
 * @param {number} time
 * @return {Promise<void>}
 */
function sleep(time) {
	return new Promise(resolve => {
		setTimeout(resolve, time);
	});
}
