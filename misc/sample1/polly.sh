# TEXT="現代社会は，変動性，不確実性，複雑性，曖昧性の頭文字をとってブーカ時代とされています。"
# FILE=1.mp3

# TEXT="ブーカ時代に求められる学びを提供する学習システムの開発を目指しています。"
# FILE=2.mp3

TEXT="郵便馬車をどんなに繋げてみても鉄道にはなりません。"
FILE=3.mp3

aws polly synthesize-speech --region ap-northeast-1 --output-format mp3 --voice-id Takumi --text $TEXT $FILE
