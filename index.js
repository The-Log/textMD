var https = require('https'),
    http = require('http'),
    url = require('url'),
    sw = require('stopword'),
    each = require('async-each'),
    findHosp = require('./findHosp.js');
    mongoose = require('mongoose');

const Grid = require('bigparser')
var searchTerm = ""

require('dotenv').config();
var medapi = require('./medapi.js');

// Set up incoming messages server
http.createServer(incomingMessageHandler).listen(process.env.PORT);

require('./models/Users.js');
var Symptom = require('./models/Symptoms.js');
var User = mongoose.model('User');

var lastShownOptions = [];

function incomingMessageHandler(req, res) {
    console.log('Received incoming text message');

    res.writeHead(200, {
        "Content-Type": "text/html"
    });
    res.end();

    if (req.method === 'GET') {
        var urlParts = url.parse(req.url, true);
        var phone = urlParts.query['msisdn'];
        var textBody = urlParts.query['text'];

        if (!textBody) return sendMessage('Sorry, I did not understand that. Can you please try again?');

        User.findOne({
            "phone": phone
        }, function(err, user) {
            if (!user) {
                var user = new User();
                user.date = Date.now();
                user.phone = phone;
                lastShownOptions = [];
                user.numQuestions = 0;
                user.save(function() {
                    sendMessage('Hello! Welcome to TextMD. Before we start, please tell us your age and your sex.');
                });
            } else {
                if (!user.age || !user.sex) {
                    var processedReply = processDemographicsReply(textBody);
                    if (!processedReply.ok) {
                        sendMessage('Sorry, I did not understand that. Can you please try again?');
                    } else {
                        user.age = processedReply.age;
                        user.sex = processedReply.sex;
                        user.save(function() {
                            sendMessage('Where are you located? Be as specific as you can.');
                        });
                    }
                } else if (user.loc.length === 0) {
                    findHosp.getLatLong(textBody, function(latLong) {
                        user.loc = {
                            lat: parseFloat(latLong[0]),
                            long: parseFloat(latLong[1])
                        };
                        user.closestHospital = {
                            lat: parseFloat(latLong[2]),
                            long: parseFloat(latLong[3]),
                            info: latLong[4]
                        };
                        user.save(function() {
                            sendMessage('Thank you. Can you tell us what symptoms you are experiencing?');
                        });
                    });
                } else {
                    if (user.symptoms.length === 0) {
                        symptomNamesToIds(textBody, user)
                            .then((symptomIds) => {
                                console.log(processSymptomString(textBody))

                                var fdsf = processSymptomString(textBody);

                                var bigparse = new Grid("2018ankurm@gmail.com", "BigBarserBandhi", '5998a0e1eead21301bfe5c5e', function() {
                                    bigparse.getRows({
                                        'rowCount': '4',
                                        'search': {
                                            "target": [fdsf[0]]
                                        },
                                        columns: ["Source", "Weight"]
                                    }, function(rows) {
                                            console.log(rows)
                                            var tt = rows[0];
                                            var ll = rows[0];
                                            for (i = 0; i< rows.length; i++) {
                                                if (parseInt(tt.data[1]) < parseInt(rows[i].data[1])) {
                                                    tt = rows[i]
                                                }
                                                if (parseInt(ll.data[1]) > parseInt(rows[i].data[1])) {
                                                    ll = rows[i]
                                                }
                                            }
                                            if (tt.data[0] != ll.data[0])
                                            sendMessage('It is very likely that you are experiencing symptoms of either ' + tt.data[0] + ' or ' + ll.data[0] + '. We recommend that you see a health professional as soon as possible.\n' + user.closestHospital[0].info);
                                            else
                                            sendMessage('It is very likely that you are experiencing symptoms of ' + tt.data[0] + '. We recommend that you see a health professional as soon as possible.\n' + user.closestHospital[0].info);

                                    });
                                });

                                return medapi.getDiagnosis(symptomIds, user.sex, user.age);
                            })
                            .then((data) => {
                                console.log(data)
                                user.symptoms = data.symptoms;
                                lastShownOptions = data.question.items;
                                user.numQuestions++;
                                user.save(function(err, user) {
                                    var question = data.question.text + '\n';
                                    if (data.question.items.length === 1) {
                                        question += '1. Yes\n2. No'
                                    } else {
                                        for (var i = 1; i < data.question.items.length + 1; i++) {
                                            question += i + '. ' + data.question.items[i - 1].name + '\n';
                                        }
                                        question += data.question.items.length + 1 + '. None of the above'
                                    }
                                    sendMessage(question);
                                });
                            });
                    } else {
                        if (typeof parseInt(textBody) === 'number' &&
                            !isNaN(parseInt(textBody)) &&
                            parseInt(textBody) <= lastShownOptions.length + 1) {
                            var index = parseInt(textBody) - 1;
                            if (index === lastShownOptions.length) {
                                for (var i = 0; i < lastShownOptions.length; i++) {
                                    user.symptoms.push({
                                        'id': lastShownOptions[i].id,
                                        'choice_id': 'absent'
                                    });
                                }
                            } else {
                                user.symptoms.push({
                                    'id': lastShownOptions[index].id,
                                    'choice_id': 'present'
                                });
                            }
                            var tempSymptoms = [];
                            for (var i = 0; i < user.symptoms.length; i++) {
                                tempSymptoms.push({
                                    'id': user.symptoms[i].id,
                                    'choice_id': user.symptoms[i].choice_id
                                });
                            }
                            medapi.getDiagnosis(tempSymptoms, user.sex, user.age)
                                .then((data) => {
                                    console.log(user.numQuestions, data.conditions[0]);
                                    if (user.numQuestions < 10 && data.conditions[0].probability < 0.5) {
                                        lastShownOptions = data.question.items;
                                        user.numQuestions++;
                                        user.save(function() {
                                            var question = data.question.text + '\n';
                                            if (data.question.items.length === 1) {
                                                question += '1. Yes\n2. No'
                                            } else {
                                                for (var i = 1; i < data.question.items.length + 1; i++) {
                                                    question += i + '. ' + data.question.items[i - 1].name + '\n';
                                                }
                                                question += data.question.items.length + 1 + '. None of the above'
                                            }
                                            sendMessage(question);
                                        });
                                    } else {
                                        var primeCandidate = data.conditions[0];
                                        var message = '';
                                        if (primeCandidate.probability > 0.5) {
                                            message = 'It is very likely that you are experiencing symptoms of ' + primeCandidate.name + '. We recommend that you see a health professional as soon as possible.\n' + user.closestHospital[0].info;
                                            user.diagnosis = [{
                                                "id": primeCandidate.id,
                                                "name": primeCandidate.name
                                            }]
                                        } else {
                                            message = 'It doesn\'t seem likely that you have any illnesses, but be aware that your symptoms are common in patients who have ' + data.conditions[0].name + ' and ' + data.conditions[1].name + '.';
                                            user.diagnosis = [];
                                        }
                                        user.save(function() {
                                            sendMessage(message);
                                        });
                                    }
                                });
                        } else {
                            sendMessage('Sorry, I did not understand that. Can you please try again?');
                        }
                    }
                }
            }
        });
    }
}

function symptomNamesToIds(textBody, user) {
    return new Promise((resolve, reject) => {
        var processedSymptoms = processSymptomString(textBody);
        var symptomIds = [];
        each(processedSymptoms, function(symptom, done) {
            var query = {
                '$and': [{
                        'name': {
                            '$regex': symptom
                        },
                        'parent_relation': null
                    },
                    {
                        '$or': [{
                                'sex_filter': 'both'
                            },
                            {
                                'sex_filter': user.sex
                            }
                        ]
                    }
                ]
            };
            Symptom.model.find(query, function(err, res) {
                if (err) {
                    done(err, null);
                }
                if (res.length > 0) {
                    var id = res[0].id;
                    var minLength = res[0].name.length;
                    for (var i = 0; i < res.length; i++) {
                        if (res[i].name.length < minLength) {
                            minLength = res[i].name.length;
                            id = res[i].id;
                        }
                    }
                    symptomIds.push({
                        id: id,
                        choice_id: 'present'
                    });
                }
                done();
            });
        }, function(err) {
            resolve(symptomIds);
        });
    });
}

function processSymptomString(string) {
    var tokens = string.split(' ');
    var processed = sw.removeStopwords(tokens);
    var processed = processed.map(function(str) {
        var desired = str.replace(/[^\w\s]/gi, '').toLowerCase();
        return desired;
    });
    console.log(processed);
    return processed;
}

function processDemographicsReply(string) {
    var tokens = string.split(' ');
    var female = false;
    var age = 0;
    for (entry of tokens) {
        if (entry === 'female') female = true;
    }
    for (entry of tokens) {
        if (typeof parseInt(entry) === 'number' && !isNaN(parseInt(entry))) age = parseInt(entry);
    }
    return {
        ok: true,
        sex: (female) ? 'female' : 'male',
        age: age
    };
}

function sendMessage(msg) {
    var data = JSON.stringify({
        api_key: process.env.NEXMO_KEY,
        api_secret: process.env.NEXMO_SECRET,
        to: '12028230953',
        from: '12015109672',
        text: msg
    });
    var options = {
        host: 'rest.nexmo.com',
        path: '/sms/json',
        port: 443,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
        }
    };

    var req = https.request(options);

    req.write(data);
    req.end();

    var responseData = '';
    req.on('response', function(res) {
        res.on('data', function(chunk) {
            responseData += chunk;
        });
        res.on('end', function() {
            var decodedResponse = JSON.parse(responseData);
            decodedResponse['messages'].forEach(function(message) {
                if (message['status'] === "0") {} else {}
            });
        });
    });
}
