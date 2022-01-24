
const cp = require('child_process');

// Timer to work with promises and support cancellation, state querying
// This class is not itself a promise, but is "thenable"
class Timer {
	constructor(ms) {
		let self = this;
		self.state = "Pending";
		self.promise = new Promise(function(resolve, reject) { self.id = setTimeout(function() {self.state = "Expired"; resolve(self.state)}, ms); self.reject = reject} );
		self.then = self.promise.then.bind(self.promise);
	}

	cancel() {
		if (this.state === "Pending") {
			clearTimeout(this.id);
			this.state = "Cancelled";
			this.reject(this.state);
			return true;
		}
		return false;
	}
}

function sleep(ms) {
	return new Timer(ms);
}

/* Demo
let timer1 = nu.sleep(5000);
timer1.then((res) => console.log(res)).catch((ex) => console.error(ex));

console.log("timer1 state: " + timer1.state);
setTimeout(function(){timer1.cancel()}, 2000);

OR

nu.sleep(5000).then(() => console.log("5 seconds has elapsed")).then(() => sleep(3000)).then(() => console.log(".. now another 3 seconds has elapsed"));

*/

// Run an external program as a child process, and capture output with a promise
// This class is not itself a promise, but is "thenable"
class Process {
	constructor(program, stdinData, args) {
		let self = this;
		self.running = true;
		self.promise = new Promise(function(resolve, reject) { self.resolve = resolve; self.reject = reject });
		self.then = self.promise.then.bind(self.promise);
		self.stdoutData = "";
		self.stderrData = "";
		self.proc = cp.spawn(program, args);
		self.proc.on('error', function(err) { self.running = false; self.reject(err) });
		if (self.proc.hasOwnProperty('stdout')) {
			self.proc.stdout.setEncoding('utf8');
			self.proc.stdout.on('data', data => {self.stdoutData += data});
		}
		if (self.proc.hasOwnProperty('stderr')) {
			self.proc.stderr.setEncoding('utf8');
			self.proc.stderr.on('data', data => {self.stderrData += data});
		}
		if (stdinData) {
			if (self.proc.hasOwnProperty('stdin'))
			{
				self.proc.stdin.setEncoding('utf8');
				self.proc.stdin.on('error', () => {});
				self.proc.stdin.write(stdinData);
				self.proc.stdin.end();
			}
		}
		self.proc.on('exit', function(exitCode, signal) {this.exitCode = exitCode; this.signal = signal; this.running = false; if (exitCode === 0) {self.resolve(self.stdoutData)} else {self.reject("exitCode: " + exitCode + ", signal: " + signal + ", stdout: " + self.stdoutData + ", stderr: " + self.stderrData)}});
	}

	cancel() {
		if (this.running)
		{
			this.proc.kill();
			return true;
		}
		return false;
	}
}

function run(program, stdinData, args) {
	return new Process(program, stdinData, args);
}

/* Demo
nu.run("ls").then((data) => console.log("Successful: " + data)).catch((data) => console.log("Failed: " + data));

OR

async function ls() {
	let result = await nu.run("ls");
	console.log("Directory listing is: " + result);
}

ls();

*/

function isEmptyHash(hash) {
	for (var key in hash) return false;
	return true;
}

function base64Encode(str) {
	let buf = new Buffer.from(str);
	return buf.toString('base64');
}

function base64Decode(str) {
	let buf = new Buffer.from(str, 'base64');
	return buf.toString('ascii');
}

function htmlEncode(str) {
	return str.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/'/g, '&#39;')
		.replace(/"/g, '&#34;');
}

function randomString(length) {
	var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	var result = '';
	for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
	return result;
}

function pad10(num) {
	return "" + (num < 10 ? ("0" + num) : num);
}

function niceDate() {
	var d = new Date();
	return "" + d.getFullYear() + pad10(d.getMonth() + 1) + pad10(d.getDate()) + pad10(d.getHours()) + pad10(d.getMinutes())  + pad10(d.getSeconds());
}

function log(msg, flag) {
	if (flag === undefined ) flag = '.';

	let col = (flag === '*' ? '\x1b[31m%s\x1b[0m' : '%s');
	
	console.log(col, flag + niceDate() + ' ' + msg);
}

function warn(msg) {
	log(msg, '*');
}

function debug(msg) {
	if (process.env.DEBUG) log(msg, ' ');
}

// Fit data in the form [[0,1], [1,3], [4,5]] to a straight line 'y = mx + c'. r2 varies from 0 to 1 (perfect line)
function linearRegression(data) {
	let n = data.length;
	let sum_x = 0;
	let sum_y = 0;
	let sum_xy = 0;
	let sum_xx = 0;
	let sum_yy = 0;

	for (let i = 0; i < n; i++) {
		sum_x += data[i][0]
		sum_y += data[i][1];
		sum_xy += data[i][0] * data[i][1];
		sum_xx += data[i][0] * data[i][0];
		sum_yy += data[i][1] * data[i][1];
	} 

	let m = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x);
	let c = (sum_y - m * sum_x) / n;
	let r2 = Math.pow(n * sum_xy - sum_x * sum_y, 2) / (n * sum_xx - sum_x * sum_x) / (n * sum_yy - sum_y * sum_y);

	return {m, c, r2};
}

// Run function "fn" many times, in parallel, with each call passed an entry in parameters array
// Useful for consulting a large number of URLs
async function multiplex(fn, parameters, concurrent = 5) {
    let promiseQueue = [];
	let parameterQueue = [];
    let results = {};
    for (parameter of parameters) {
        const promise = fn(parameter)
			.then((res) => {let i = promiseQueue.indexOf(promise); 
				results[parameterQueue[i]] = res;
				promiseQueue.splice(i, 1); parameterQueue.splice(i, 1);})
			.catch(e => {let i = promiseQueue.indexOf(promise); let res = `fn threw exception: ${e}`;
				results[parameterQueue[i]] = res;
				promiseQueue.splice(i, 1); parameterQueue.splice(i, 1);})
        promiseQueue.push(promise);
		parameterQueue.push(parameter);
        
        if (promiseQueue.length >= concurrent) await Promise.race(promiseQueue);
    }

	await Promise.all(promiseQueue);

	return results;
};

module.exports = {Timer, sleep, Process, run, isEmptyHash, base64Encode, base64Decode, htmlEncode,
	randomString, pad10, niceDate, log, warn, debug, linearRegression, multiplex};

/* Module usage:
const nu = require('nphump_util');
console.log(nu.isEmptyHash({}));
*/
