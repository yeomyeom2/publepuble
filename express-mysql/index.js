var express = require('express');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var dbconfig = require('./config/database.js');
var connection = mysql.createConnection(dbconfig);

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.set('port', process.env.PORT || 3000);

app.get('/', function(req, res){
    res.send('Root');
});

app.get('/persons', function(req, res){
    /*
    connection.query('SELECT * from Persons', function(err, rows){
        if(err) throw err;

        console.log('The solution is: ', rows);

        res.send(rows);
    });
    */
    var user_id = req.param('id');
    var user_name = req.param('name');
    var user_age = req.param('age');
    
    res.send(user_id + ', ' + user_name + ', ' + user_age);
});

app.listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});