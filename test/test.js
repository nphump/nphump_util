
const nu = require('../lib/nphump_util.js')

let test_number = 0;

function running(test)
{
	console.log("\nRunning test #" + test_number++ + " (" + test + ") ...");
}

function output(data)
{
	console.log("   output:" + data);
}

running("Call 'hostname' command with Program class");

(new nu.Process("hostname"))
	.then((data) => output(data))
	.then(() => running("Expiring Timer"))
	.then(() => {return new nu.Timer(10)})
	.then((data) => {if (data !== 'Expired') throw "Unexpected output from Timer: " + data})
	.then(() => console.log("\nSUCCESSFUL"))
	.catch((err) => {console.warn("\nFAILED: " + err); process.exit(1);})


