var fs = require('fs');
var AWS = require('aws-sdk');

var polly = new AWS.Polly();

var params = {
  OutputFormat: "mp3",
  SampleRate: "8000",
  Text: "ご当地グルメ「浜松餃子」が有名な浜松市は、去年1年間の1世帯当たりのギョーザの購入額が3766円となり、ライバルの宇都宮市を73円上回って2年ぶりに日本一の座を奪還しました。",
  TextType: "text",
  VoiceId: "Takumi"
};

(async function(){
  try {
    let data = await polly.synthesizeSpeech(params).promise();
    console.log(data);
    fs.writeFileSync("node.mp3", data.AudioStream);
  } catch(e) {
    console.log(e);
  }
})();
