/** @typedef { import("wechaty").Wechaty } Wechaty */
/** @typedef { import("wechaty").Room } Room */
/** @typedef { import("wechaty").Message } Message */
var EventEmitter = require('events');
var chatscript = require('chatscript');
var ORIGINAL = Symbol('original');

/**
 * @param {string} program
 */
module.exports = function WechatyChatscriptPlugin(program) {
	return function (/** @type {Wechaty} */bot) {
		var environment = new chatscript.Environment(new chatscript.Scope(require('l-library')));
		var machine = new chatscript.Machine(environment, {
			receive() {
				return new Promise(resolve => {
					bot.once('message', message => {
						resolve([new chatscript.Value.String(message.text()), new Contact(message.talker())]);
					});
				});
			},
			async send(message, receiver) {
				await receiver[ORIGINAL].say(message.value);
			}
		});
		var eventEmitter = new EventEmitter();
		setTimeout(async () => {
			try {
				machine.run(chatscript.parse(program));
				while (!machine.step(machine.await ? await machine.await : undefined));
				bot.on('message', listener);
			} catch (e) {
				if (e instanceof chatscript.ParseError || e instanceof chatscript.Error)
					eventEmitter.emit('error', e);
				else throw e;
			}
		}, 0);
		return Object.assign(() => {
			bot.off('message', listener);
		}, { eventEmitter: eventEmitter });
		async function listener(/** @type {Message} */message) {
			try {
				var g = machine.emit({
					type: 'receive',
					argument: new Message(message)
				});
				for (; ;) {
					var { value: value, done: done } = g.next(value instanceof Promise ? await value : undefined);
					if (done) break;
				}
			} catch (e) {
				if (e instanceof chatscript.Error)
					eventEmitter.emit('error', e);
				else throw e;
			}
		}
		/** @param {import("wechaty").Contact} contact */
		function Contact(contact) {
			return Object.assign(new chatscript.Value.Object({
				get name() { return contact.name() }
			}), { [ORIGINAL]: contact });
		}
		/** @param {import("wechaty").Message} message */
		function Message(message) {
			return Object.assign(new chatscript.Value.Object({
				get text() { return new chatscript.Value.String(message.text()); },
				get sender() { return new Contact(message.talker()); }
			}), { [ORIGINAL]: message });
		}
	};
};
