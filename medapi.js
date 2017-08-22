/*
 * TextMD Diagnosis API Access Functions
 */

//Import required modules
var request = require('request');

//Export this module to the main node file
var exports = module.exports = {};

/*
 * Gets diagnosis for a set of symptom id and choice_id parameters
 * formatted as an object, eg ['s_98':'present,'s_14':'absent'];
 */

exports.getDiagnosis = function(symptoms,sex,age){
    console.log(symptoms + " " + sex + " " + age);
    return new Promise((resolve, reject) => {
        //Ensure symptoms have been passed into this function
        if ( (symptoms != null) && (sex == 'male' || sex == 'female') && (age != null) ){

    	    //Prepare the output symptoms list
          var finalSymptomsList = new Array();
    	    var progressIterator = 0;
            //Iterate through all symptoms given
            //now make the POST to get a diagnosis using our new symptom id's
            //create evidence list
    		//	console.log("evidence is ");
    		//	console.log(evidenceList);
            //construct the JSON data
            var diagnosisBody =
                    {
                        'sex':sex,
                        'age':age,
                        'evidence':symptoms
                    };
            //  console.log("DIAGNOSIS BODY:");
            //  console.log(diagnosisBody);
            makePOSTRequest('diagnosis',diagnosisBody,function(err,resultData){
                if (!err){
                        // console.log(resultData);
                        //call back to the promise to indicate success
				        var isFinalDiagnosis = true;
				        if (resultData.question != null) { isFinalDiagnosis = false; }
				        resultData.isFinalDiagnosis = isFinalDiagnosis;
				        resultData.symptoms = symptoms;
                        resolve(resultData);
                }
                else{ // not success!
                        reject("failed to post with error: "+err.message);
				        console.log("error posting: "+err.message);
                }
            });
		}
		else { console.log("k="+k.toString()); }
		});
}

function makePOSTRequest(path,dataObject,callback) {
	//add the api key information from the environment
	//variables to the dataObject, the JSON request body
    var options = {
        url:'https://api.infermedica.com/v2/'+path,
        headers: {
            "app_id" : "dd20d4d6",
            "app_key" : "60419814a9f4a76540b3940de5da6384",
            "Accept":"application/json"
        },
        json: dataObject
    };
	options.headers['app_id'] = process.env.infermedicaAppId;
	options.headers['app_key'] = process.env.infermedicaAppKey;
	request.post(options,
	function (err, res, body) {
		if (!err && res.statusCode == 200){
			//function complete; call back
			callback(null,body);
		} else {
			//function complete with error; call back
			callback(err,body);
		}
	});
}
