const nu = require('../lib/nphump_util.js')

function timer_check(res)
{
	if (res == 'Expired')
	{
		console.log('Timer - worked');
	}
	else
	{
		console.log('Timer - unexpected output: ' + res);
		process.exit(1);
	}
}

let timer1 = new nu.Timer(1000);
timer1.promise.then(timer_check).catch(timer_check);

