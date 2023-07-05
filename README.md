# wechaty-chatscript

A Wechaty plugin that implements chatscript.

## Usage

```js
var { Wechaty } = require('wechaty');
var WechatyChatscriptPlugin = require('wechaty-chatscript');
var bot = new Wechaty();
bot.use(
	WechatyChatscriptPlugin(`
		on receive message do (
			message.text = "ding" ?
				(send "dong" to message.sender;) : 0
		);
	`)
);
```

### Listen to errors

Use `uninstaller.eventEmitter` to listen to errors.

```js
var { Wechaty } = require('wechaty');
var WechatyChatscriptPlugin = require('wechaty-chatscript');
var bot = new Wechaty();
var installer = WechatyChatscriptPlugin("a;");
var uninstaller = installer(bot);
uninstaller.eventEmitter.on('error', e => { console.log(e); });
```
