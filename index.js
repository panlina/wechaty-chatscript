/** @typedef { import("wechaty").Wechaty } Wechaty */
/** @typedef { import("wechaty").Room } Room */
/** @typedef { import("wechaty").Message } Message */
var chatscript = require('chatscript');
var ORIGINAL = Symbol('original');

/**
 * @param {string} program
 */
module.exports = function WechatyChatscriptPlugin(program) {
	return function (/** @type {Wechaty} */bot) {
		var environment = new chatscript.Environment(new chatscript.Scope({}));
		var machine = new chatscript.Machine(environment, {
			async send(message, receiver) {
				await receiver[ORIGINAL].say(message.value);
			}
		});
		(async () => {
			machine.run(chatscript.parse(program));
			while (!(await machine.step()));
			bot.on('message', listener);
		})();
		return () => {
			bot.off('message', listener);
		};
		async function listener(/** @type {Message} */message) {
			var g = machine.emit({
				type: 'receive',
				argument: new Message(message)
			});
			while (!(await g.next()).done);
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
				get from() { return new Contact(message.talker()); }
			}), { [ORIGINAL]: message });
		}
	};
};
