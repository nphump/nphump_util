
const nu = require('../lib/nphump_util.js')

let test_number = 0;

function running(test) {
	console.log(`\nRunning test #${++test_number} (${test}) ...`);
}

async function testAsync(sleepMs) {
	return await new Promise((resolve, reject) => { setTimeout(() => resolve("done"), sleepMs) });  
}

running("Call 'hostname' command with Program class");
(nu.run("hostname"))
.then((data) => {if (data.length < 1) throw `Unexpected output from run: ${data}`})
.then(() => running("Expiring Timer"))
.then(() => nu.sleep(10))
.then((data) => {if (data !== 'Expired') throw `Unexpected output from Timer: ${data}`})
.then(() => running("isEmptyHash"))
.then(() => nu.isEmptyHash({}))
.then((data) => {if (data !== true) throw `Unexpected output from isEmptyHash(): ${data}`})
.then(() => running("base64Encode"))
.then(() => nu.base64Encode('jaffa'))
.then((data) => {if (data !== 'amFmZmE=') throw `Unexpected output from base64Encode(): ${data}`})
.then(() => running("base64Decode"))
.then(() => nu.base64Decode('amFmZmE='))
.then((data) => {if (data !== 'jaffa') throw `Unexpected output from base64Decode(): ${data}`})
.then(() => running("htmlEncode"))
.then(() => nu.htmlEncode('<Hello & Goodbye>'))
.then((data) => {if (data !== '&lt;Hello &amp; Goodbye&gt;') throw `Unexpected output from htmlEncode(): ${data}`})
.then(() => running("randomString"))
.then(() => nu.randomString(10))
.then((data) => {if (data.length !== 10) throw `Unexpected output from randomString(): ${data}`})
.then(() => running("pad10"))
.then(() => nu.pad10(2))
.then(() => running("niceDate"))
.then(() => nu.niceDate())
.then(() => running("log"))
.then(() => nu.log("Test log message"))
.then(() => running("warn"))
.then(() => nu.warn("Test warn message"))
.then(() => running("debug"))
.then(() => nu.debug("Test debug message"))
.then(() => running("linearRegression"))
.then(() => nu.linearRegression([[1,1], [2,2], [3,3]]))
.then((data) => {if ((data.m != 1) || (data.c != 0) || (data.r2 != 1)) throw `Unexpected output from linearRegression(): ${JSON.stringify(data)}`})
.then(() => running("multiplex"))
.then(() => nu.multiplex(testAsync, [1,2,3,5,10,20,50], 3))
.then((data) => {if (Object.keys(data).length !== 7) throw `Unexpected output from multiplex(): ${JSON.stringify(data)}`;
	for (key in data) { if (data[key] !== 'done') throw `Unexpected output from multiplex(): ${JSON.stringify(data)}` }})

.then(() => console.log("\nSUCCESSFUL"))
.catch((err) => {console.warn("\nFAILED: " + err); process.exit(1);})
