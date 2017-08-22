// const Grid = require('bigparser')
// var bigparser = new Grid("2018ankurm@gmail.com", "BigBarserBandhi", 'Symptoms_disease',function(){
//     bigparser.getRows({'rowCount': '4', 'search':{global: ["pain"]}, columns:["film Name ","year"]}, function(rows){ console.log(rows);});
// });
const Grid = require('bigparser')
var movies = new Grid("2018ankurm@gmail.com", "BigBarserBandhi", 'Movie Beta',function(){
    movies.login("2018ankurm@gmail.com", "BigBarserBandhi");
    movies.getRows({'rowCount': '4', 'search': {global: ["X-men","x-men 2"]}, columns:["film Name ","year"]}, function(rows){ console.log(rows);});
});