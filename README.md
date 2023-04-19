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
				(send "dong" to message.from;) : 0
		);
	`)
);
```
