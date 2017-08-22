var PythonShell = require('python-shell');

function getLatLong(locationString, callback) {
    var options = {
        mode: 'text',
        pythonPath:'/usr/bin/python',
        pythonOptions:['-u'], //required?
        scriptPath: '/home/ridoy/smsdoc',
        args: [locationString] //TODO: USER INPUT 
    };

    PythonShell.run('findHosp.py', options, function (err, results) {
        if (err) throw err;
        console.log('results: %j',results);
        callback(results);
    });
}

module.exports = {
    getLatLong: getLatLong
}
