
const cp = require('child_process');

// Timer to work with promises and support cancellation, state querying
class Timer {
	constructor(ms) {
		let self = this;
		this.state = "Pending";
		this.promise = new Promise(function(resolve, reject) { self.id = setTimeout(function() {self.state = "Expired"; resolve(self.state)}, ms); self.reject = reject} );
	}

	cancel() {
		if (this.state === "Pending")
		{
			clearTimeout(this.id);
			this.state = "Cancelled";
			this.reject(this.state);
			return true;
		}
		return false;
	}
}
/* Demo
let timer1 = new Timer(5000);
timer1.promise.then((res) => console.log(res)).catch((ex) => console.error(ex));

console.log("timer1 state: " + timer1.state);
setTimeout(function(){timer1.cancel()}, 2000);

OR

(new Timer(5000)).promise.then(() => console.log("5 seconds has elapsed")).then(() => (new Timer(3000)).promise).then(() => console.log(".. now another 3 seconds has elapsed"));

*/

// Run an external program as a child process, and capture output with a promise
class Process {
	constructor(program, stdin_data, args) {
		let self = this;
		self.running = true;
		self.promise = new Promise(function(resolve, reject) { self.resolve = resolve; self.reject = reject });
		self.stdout_data = "";
		self.stderr_data = "";
		self.proc = cp.spawn(program, args);
		self.proc.on('error', function(err) { self.running = false; self.reject(err) });
		if (self.proc.hasOwnProperty('stdout'))
		{
			self.proc.stdout.setEncoding('utf8');
			self.proc.stdout.on('data', data => {self.stdout_data += data});
		}
		if (self.proc.hasOwnProperty('stderr'))
		{
			self.proc.stderr.setEncoding('utf8');
			self.proc.stderr.on('data', data => {self.stderr_data += data});
		}
		if (stdin_data)
		{
			if (self.proc.hasOwnProperty('stdin'))
			{
				self.proc.stdin.setEncoding('utf8');
				self.proc.stdin.on('error', () => {});
				self.proc.stdin.write(stdin_data);
				self.proc.stdin.end();
			}
		}
		self.proc.on('exit', function(exit_code, signal) {this.exit_code = exit_code; this.signal = signal; this.running = false; if (exit_code === 0) {self.resolve(self.stdout_data)} else {self.reject("exit_code: " + exit_code + ", signal: " + signal + ", stdout: " + self.stdout_data + ", stderr: " + self.stderr_data)}});
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
/* Demo
let program = "./processor.pl";
let proc = new Process(program,undefined,["1"]);
proc.promise.then((data) => console.log("Successful: " + data)).catch((data) => console.log("Failed: " + data));
*/

function is_empty_hash(hash)
{
	for (var key in hash) return false;
	return true;
}

function base64_encode(str)
{
	let buf = new Buffer.from(str);
	return buf.toString('base64');
}

function base64_decode(str)
{
	let buf = new Buffer.from(str, 'base64');
	return buf.toString('ascii');
}

function html_encode(str)
{
    return $('<span>').text(str).html();
}

function random_string(length)
{
	var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	var result = '';
	for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
	return result;
}

function pad_10(num)
{
	return "" + (num < 10 ? ("0" + num) : num);
}

function nice_date()
{
	var d = new Date();
	return "" + d.getFullYear() + pad_10(d.getMonth() + 1) + pad_10(d.getDate()) + pad_10(d.getHours()) + pad_10(d.getMinutes())  + pad_10(d.getSeconds());
}

function log(msg, flag)
{
	if (flag === undefined ) flag = '.';

	let col = (flag === '*' ? '\x1b[31m%s\x1b[0m' : '%s');
	
	console.log(col, flag + nice_date() + ' ' + msg);
}

function warn(msg)
{
	log(msg, '*');
}

function debug(msg)
{
	if (cfg.parameters.debug) log(msg, ' ');
}

module.exports = {Timer, is_empty_hash, base64_encode, base64_decode, html_encode, random_string, pad_10, nice_date, log, warn, debug, Process};
/* Module usage:
const nu = require('nphump_util');
console.log(nu.is_empty_hash({}));
*/