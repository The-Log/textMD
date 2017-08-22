var mongoose = require('mongoose');

var SymptomSchema = new mongoose.Schema({
    "name": String,
    "id": String
});

module.exports.model = mongoose.model('Symptom', SymptomSchema, 'symptoms');
