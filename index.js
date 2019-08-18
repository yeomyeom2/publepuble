var express = require('express');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var dbconfig = require('./config/database.js');
var connection = mysql.createConnection(dbconfig);

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

// configuration ===============================================================
app.set('port', process.env.PORT || 80);

app.post('/', function(req, res){
  res.send('Root');
});

app.post('/chatbot', function(req, res){
    
    /* 요청 텍스트 */
    var text = req.body.text, 
        textSplit = text.split(' '),
        rsv_category = textSplit[1],
        rsv_date = textSplit[2];

console.log(text);

    /* 날짜 */
    var today = new Date(),
        month = today.getMonth()+1,
        day = today.getDate();
        
    month = month >= 10 ? month : '0' + month;
    day = day >= 10 ? day : '0' + day;

    today = month + day;
    /* //날짜 */
    
    if(textSplit[0] == '@예약') {
        if(rsv_category == '컴투스' || rsv_category == '게임빌' || rsv_category == 'etc') {
            /* 날짜 입력 X */
            if(rsv_date == null) {
                connection.query('SELECT * from tbl_chatbot WHERE category="' + rsv_category + '" AND day=' + today, function(err, rows) {
                    if(err) throw err;

                    //폴더가 몇 개 있는지 계산한 후 -> 폴더가 없으면 통으로, 있으면 그 다음 번호로
                    if(rows.length == 0) { //폴더가 없는 경우 통으로 사용
                        connection.query('INSERT INTO tbl_chatbot (category, day, folder) VALUES ("' + rsv_category + '", "' + today + '", 0)', function(err, result){});
                    }else { //다음 번호의 폴더로 등록
                        if( rows.length == 1) {
                            connection.query('UPDATE tbl_chatbot SET folder = "1" WHERE category="' + rsv_category + '" AND day=' + today, function(err, result){});
                        }
                        connection.query('INSERT INTO tbl_chatbot (category, day, folder) VALUES ("' + rsv_category + '", "' + today + '", '+ (rows.length+1) + ')', function(err, result){});
                    }
                });

                res.send("예약 되었습니다.");
            }
            /* 날짜 입력 O */
            else if(rsv_date != null) {
                connection.query('SELECT * from tbl_chatbot WHERE category="' + rsv_category + '" AND day=' + rsv_date, function(err, rows) {
                    if(err) throw err;

                    if(rows.length == 0) {
                        connection.query('INSERT INTO tbl_chatbot (category, day, folder) VALUES ("' + rsv_category + '", "' + rsv_date + '", 0)', function(err, result){});
                    }else {
                        if( rows.length == 1) {
                            connection.query('UPDATE tbl_chatbot SET folder = "1" WHERE category="' + rsv_category + '" AND day=' + rsv_date, function(err, result){});
                        }
                        connection.query('INSERT INTO tbl_chatbot (category, day, folder) VALUES ("' + rsv_category + '", "' + rsv_date + '", '+ (rows.length+1) + ')', function(err, result){});
                    }
                });
                res.send("예약 되었습니다.");
            }
        }else {
            res.send("올바른 명령어를 입력해주세요.<br><br>명령어 목록 :<br>@예약 컴투스<br>@예약게임빌<br><br>@조회<br><br>@취소");
        }
    }else if(textSplit[0] == '@조회') {
        rsv_date = textSplit[1];

        if(rsv_date == null) { //날짜 입력 X
            connection.query('SELECT * from tbl_chatbot WHERE day="' + today + '" ORDER BY category ASC, folder ASC', function(err, rows) {
                if(err) throw err;
/*
                var todayArr = [];

                for(var i=0 ; i <= rows.length ; i++) {
                    //res.send(rows[i]);
                    console.log(rows[i]);
                    //todayArr[i] = rows[i];
                }

                res.send(rows);
                */
            });
        }else if(rsv_date != null) { //날짜 입력 O
            connection.query('SELECT * from tbl_chatbot WHERE day="' + rsv_date + '" ORDER BY category ASC, folder ASC', function(err, rows) {
                if(err) throw err;

                var db_result = rows;
                var result = {};
                
                for(var d in db_result) {
                    
                    // 새로운object result를 만들어서
                    // 거기에 게임빌, 컴투스가 없으면 (hasOwnProperty 로 체크) result에 게임빌, 컴투스 카테고리를 만듬
                    // 있는경우는 만들지않음
                    
                    if(!result.hasOwnProperty(db_result[d]['category'])) result[db_result[d]['category']] = [];
                    
            
            
                    // db결과 루프돌면서 카테고리가 일치하는 곳에 아이템 추가
                
                    result[db_result[d]['category']].push(db_result[d]);
                }
            

                //console.log(rows[1].category);

                res.send(result);
            });
        }
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
    

/*
  connection.query('SELECT * from tbl_chatbot', function(err, rows) {
    if(err) throw err;
    console.log('The solution is: ', rows);
    var category = req.body.categroy;
    //res.send(category);

     
  console.log(category);

  });

 */
});

app.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});

/*
<script>

   var db_result = [
     { id: 14, category: '게임빌', day: '0702', folder: 1, name: null },
     { id: 15, category: '게임빌', day: '0702', folder: 2, name: null },
     { id: 16, category: '게임빌', day: '0702', folder: 3, name: null },
     { id: 17, category: '게임빌', day: '0702', folder: 4, name: null },
     { id: 18, category: '게임빌', day: '0702', folder: 5, name: null },
     { id: 7, category: '컴투스', day: '0702', folder: 1, name: null },
     { id: 9, category: '컴투스', day: '0702', folder: 2, name: null },
     { id: 10, category: '컴투스', day: '0702', folder: 3, name: null },
     { id: 11, category: '컴투스', day: '0702', folder: 4, name: null },
     { id: 12, category: '컴투스', day: '0702', folder: 5, name: null },
     { id: 19, category: '컴투스', day: '0702', folder: 6, name: null } 
   ];
   
   var result = {};
   
   for(var d in db_result) {
      
      // 새로운object result를 만들어서
      // 거기에 게임빌, 컴투스가 없으면 (hasOwnProperty 로 체크) result에 게임빌, 컴투스 카테고리를 만듬
      // 있는경우는 만들지않음
      
      if(!result.hasOwnProperty(db_result[d]['category'])) result[db_result[d]['category']] = [];
      


      // db결과 루프돌면서 카테고리가 일치하는 곳에 아이템 추가
   
      result[db_result[d]['category']].push(db_result[d]);
   }

   console.log(result);
</script>
*/