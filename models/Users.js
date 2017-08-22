var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
    "phone": String,
    "date": {
        type: Date,
        default: Date.now()
    },
    "symptoms": [
        {
            "id": String,
            "choice_id": String
        }
    ],
    "diagnosis": [
        {
            "name": String,
            "id": String
        }
    ],
    "sex": String,
    "age": Number,
    "loc": [],
    "closestHospital": [],
    "numQuestions": 0
});

mongoose.model('User', UserSchema, 'users');
