// LINEのアクセストークン
var LINE_ACCESS_TOKEN = "アクセストークンを入れる";
// Google Cloud Vision API　Key
var GOOGLE_CLOUD_VISION_API_KEY = 'google api keyを入れる';

//LINEからメッセージが送られてきた時に動作する処理
function doPost(e) {
  // LINEメッセージタイプ
  var type = JSON.parse(e.postData.contents).events[0].message.type;
  // LINE返信用トークン
  var reply_token = JSON.parse(e.postData.contents).events[0].replyToken;

  // LINE返信用トークンが正常に取得できない場合
  if (typeof reply_token === 'undefined') {
    return;
  }

  // LINEから画像以外が送られた場合、定型文をLINEに返信する
  if (type !== 'image') {
    var result = '画像を送ってくれればテキストにして返信するよ';
    message_post(reply_token, result);
    return;
  }

  var messageId = JSON.parse(e.postData.contents).events[0].message.id;
  // LINEから画像を取得する
  var blob = get_line_content(messageId);
  
  // 文字起こし結果
  var result = imageAnnotate(blob);

  // 文字起こし結果をLINEに返信する
  message_post(reply_token, result);
  
  return;
}

// LINEから画像を取得する
function get_line_content(messageId) {
  var url = 'https://api.line.me/v2/bot/message/' + messageId + '/content';

  //blobに画像を格納
  var blob = UrlFetchApp.fetch(url, {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + LINE_ACCESS_TOKEN
    },
    'method': 'get'
  }); 
  return blob;
}

// Google Cloud Visionで文字起こしを行う
function imageAnnotate(file) {
  var payload = JSON.stringify({
    'requests':[
      {
        'image': {
          'content': Utilities.base64Encode(file.getBlob().getBytes())
        },
        'features': [
          {
            'type': 'TEXT_DETECTION'
          }
        ]
      }
    ]
  });

  var url = 'https://vision.googleapis.com/v1/images:annotate?key=' + GOOGLE_CLOUD_VISION_API_KEY;
  var options = {
    method : 'post',
    contentType: 'application/json', 
    payload : payload
  };

  //Vison APIに投げて,結果をresに格納
  var res = UrlFetchApp.fetch(url, options);
  var obj = JSON.parse(res.getContentText());
  
  //結果のJSONから文字起こし結果だけ抽出する
  if ('textAnnotations' in obj.responses[0]) {
    return obj.responses[0].textAnnotations[0].description;
  }
  return '文字を読み取れなかったよ。';
}

// 文字起こし結果をLINEに返信する
function message_post(token, message){
  var url = 'https://api.line.me/v2/bot/message/reply';

  UrlFetchApp.fetch(url, {

    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + LINE_ACCESS_TOKEN
    },
    'method': 'post',
    'payload': JSON.stringify({
      'replyToken': token,
      'messages': [{
        'type': 'text',
        'text': message
      }]
    })
  });
}