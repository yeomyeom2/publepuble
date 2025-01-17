var express = require('express');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var dbconfig = require('./config/database.js');
var connection = mysql.createConnection(dbconfig);

var request = require('request');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

// configuration ===============================================================
app.set('port', process.env.PORT || 80);

app.post('/', function(req, res){
  res.send('Root');
});

app.post('/chatbot', function(req, res){

    //console.log(req.body.events[0].source, req.body.events[0].replyToken, req.body.events[0].message.type, req.body.events[0].message.text, req.body.events[0].source.userId);
    //console.log(req.body.events[0].source);
    //console.log(req.body.events[0].replyToken);
    //console.log(req.body.events[0].message.type);
    //console.log(req.body.events[0].message.text);
    //console.log(req.body.events[0].source.userId);

    var users = {
        'U32195acf313dbd21c064d18647c65f05' : '염혜진',
        'U3fa6149a2759af7d5f738ce0642eeaf9' : '이지원',
        'Ude13e829165d6ae4777aa0a89147eb64' : '권성수',
        'U345dc90a4ab459eda6590f73a3e72627' : '백재욱',
        'U665f5ccfbade255cd6e780e97e8c0253' : '김상호',
        'U4bfb42cf2a76945e1cddf89b0e3b7c28' : '이승제',
        'Uc6e5da89664a582daa6af1ae41b3b397' : '곽선민',
        'U80a05002ba042eca173050115f4b56bb' : '최현선'
    };

    var uid = req.body.events[0].source.userId;
    var replyToken = req.body.events[0].replyToken;

    /* 날짜 */
    var today = new Date(),
        month = today.getMonth()+1,
        day = today.getDate();
        
    month = month >= 10 ? month : '0' + month;
    day = day >= 10 ? day : '0' + day;

    today = String(month) + String(day);
    console.log(today)
    /* //날짜 */

    /* 요청 텍스트 */
    if(req.body.events[0].message.type == 'text') {
        var text = req.body.events[0].message.text,
            textSplit = text.split(' '),
            rsv_category = textSplit[1],
            rsv_date = textSplit[2];

    
        if(textSplit[0] == '@예약') {
            if(rsv_category == '컴투스' || rsv_category == '게임빌' || rsv_category == 'etc') {
                connection.query('SELECT * from tbl_chatbot WHERE category="' + rsv_category + '" AND day=' + (rsv_date == null ? today : rsv_date), function(err, rows) {
                    if(err) throw err;

                    //폴더가 몇 개 있는지 계산한 후 -> 폴더가 없으면 통으로, 있으면 그 다음 번호로
                    if(rows.length == 0) { //폴더가 없는 경우 통으로 사용
                        connection.query('INSERT INTO tbl_chatbot (category, day, folder, name) VALUES ("' + rsv_category + '", "' + (rsv_date == null ? today : rsv_date) + '", 0, "' + users[uid] + '")', function(err, result){
                            replyMessage(replyToken, users[uid] + " - " + (rsv_date == null ? '오늘(' + today + ') ' : rsv_date + ' ') + rsv_category + " 폴더 통으로 예약 되었습니다.");
                        });
                        res.send("");
                    }else { //다음 번호의 폴더로 등록
                        if( rows.length == 1) {
                            connection.query('UPDATE tbl_chatbot SET folder = "1" WHERE category="' + rsv_category + '" AND day=' + (rsv_date == null ? today : rsv_date), function(err, result){});
                        }
                        connection.query('INSERT INTO tbl_chatbot (category, day, folder, name) VALUES ("' + rsv_category + '", "' + (rsv_date == null ? today : rsv_date) + '", '+ (rows.length+1) + ', "' + users[uid] + '")', function(err, result){
                            //var txtChange = replyMessage(replyToken, users[uid] + " - " + (rsv_date == null ? '오늘(' + today + ') ' : rsv_date + ' ') + rsv_category + " 1번으로 변경 되었습니다.");
                            replyMessage(replyToken, users[uid] + " - " + (rsv_date == null ? '오늘(' + today + ') ' : rsv_date + ' ') + rsv_category + " " + (rows.length+1) + "번 예약 되었습니다.");
                        });

                        res.send("예약 되었습니다.");
                    }
                    
                });


            }else {
                //replyMessage("올바른 명령어를 입력해주세요.<br><br>명령어 목록 :<br>@예약 컴투스<br>@예약게임빌<br><br>@조회");
                res.send("");
            }
        }else if(textSplit[0] == '@조회') {
            rsv_date = textSplit[1];
            
            connection.query('SELECT * from tbl_chatbot WHERE day="' + (rsv_date == null ? today : rsv_date) + '" ORDER BY category DESC, folder ASC', function(err, rows) {
                if(err) throw err;

                var result = {};
                var retText = (rsv_date == null ? '오늘(' + today + ')' : rsv_date);

                for(var d in rows) {
                    if(!result.hasOwnProperty(rows[d]['category'])) result[rows[d]['category']] = [];
                    
                    result[rows[d]['category']].push(rows[d]);
                }

                for(var d in result) {
                    retText += "\n\n[" + d + "]";
                    for(var e in result[d]) {
                        retText +=  '\n' + result[d][e]['folder'] + '번 : ' + result[d][e]['name'];
                    }
                }

                replyMessage(replyToken, retText);
                res.send("");
            });
        }else if(textSplit[0] == '@취소') {
            if(rsv_date == null) { //날짜 입력 X
                connection.query('SELECT * from tbl_chatbot WHERE day="' + today + '"ORDER BY category ASC, folder ASC', function(err, rows) {
                    if(err) throw err;

                    for(var i=0 ; i <= rows.length ; i++) {
                        //res.send(rows[i]);
                        console.log('오늘 <br>컴투스'+rows[i]);
                    }
                });
            }else if(rsv_date != null) { //날짜 입력 O
                connection.query('SELECT * from tbl_chatbot WHERE day=' + rsv_date, function(err, rows) {
                    if(err) throw err;

                    res.send(rows);
                });
            }
        }else {
            res.send("올바른 명령어를 입력해주세요.<br><br>명령어 목록 :<br>@예약 컴투스<br>@예약 게임빌<br><br>@조회 날짜<br><br>@취소");
        }
    }
});

app.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});

function replyMessage(token, message) {
    var m = [{
        "type": "text",
        "text": message
    }];

    request.post({
        headers: {'Content-Type':'application/json','Authorization':'Bearer CKuBFnDd9Ti+ccqSBwZjSlTl1B2Un9shhcETq2x6O4k2ptiyCGGCIxPL9hHfV7kMd60FDX9nl5ww2CCN9H6lpYhifpoU35glS0FgK47VAFNWjgdtR6I2UqbvYJu8Totv+sC/pPb3s+Yoxz82GhupDgdB04t89/1O/w1cDnyilFU='},
        url: 'https://api.line.me/v2/bot/message/reply',
        body : {'replyToken':token, 'messages':m},
        json: true
    },function (error, response, body) {

    });
}

function resultInquiry() {
    var result = {};
    var retText = (rsv_date == null ? '오늘' : rsv_date) + '\n';

    for(var d in rows) {
        if(!result.hasOwnProperty(rows[d]['category'])) result[rows[d]['category']] = [];
        
        result[rows[d]['category']].push(rows[d]);
    }

    for(var d in result) {
        retText += d + "\n\n";
        for(var e in result[d]) {
            retText += result[d][e]['folder'] + '번 : ' + result[d][e]['name'] + '\n';
        }
    }
}