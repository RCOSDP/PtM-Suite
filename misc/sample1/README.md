- 発表資料v5.2.pptx から 3ページのサンプル PPTファイルを作成
  - PPTアプリでスライドのイメージを保存

```
$ ffmpeg -i sample/slide1.png
Input #0, png_pipe, from 'sample/slide1.png':
  Duration: N/A, bitrate: N/A
    Stream #0:0: Video: png, rgba(pc), 1280x720 [SAR 3779:3779 DAR 16:9], 25 tbr, 25 tbn, 25 tbc
```

- awscli でノートの内容を mp3 ファイルに変換

```
$ sudo apt install python-pip
$ pip install awscli

$ aws polly synthesize-speech --region ap-northeast-1 --output-format mp3 --voice-id Takumi --text ... 1.mp3

$ ffmpeg -i 1.mp3
Input #0, mp3, from '1.mp3':
  Metadata:
    encoder         : Lavf58.45.100
  Duration: 00:00:09.09, start: 0.000000, bitrate: 48 kb/s
    Stream #0:0: Audio: mp3, 22050 Hz, mono, s16p, 48 kb/s
```

- スライドPNGファイルとノート音声から動画を生成

```
$ ffmpeg -f image2 -i sample/slide1.png -i 1.mp3 -c:v libx264 -vf fps=25,format=yuv420p -strict -2 1.mp4
$ ffmpeg -i 1.mp4
Input #0, mov,mp4,m4a,3gp,3g2,mj2, from '1.mp4':
  Metadata:
    major_brand     : isom
    minor_version   : 512
    compatible_brands: isomiso2avc1mp41
    encoder         : Lavf56.40.101
  Duration: 00:00:09.14, start: 0.046440, bitrate: 138 kb/s
    Stream #0:0(und): Video: h264 (High) (avc1 / 0x31637661), yuv420p, 1280x720 [SAR 1:1 DAR 16:9], 5607 kb/s, 25 fps, 25 tbr, 12800 tbn, 50 tbc (default)
    Metadata:
      handler_name    : VideoHandler
    Stream #0:1(und): Audio: aac (LC) (mp4a / 0x6134706D), 22050 Hz, mono, fltp, 112 kb/s (default)
    Metadata:
      handler_name    : SoundHandler
```

- スライド毎の動画を結合

```
$ cat list
file 1.mp4
file 2.mp4
file 3.mp4
$ ffmpeg -f concat -i list -strict -2 all.mp4
```

- ファイルサイズ
  - 80KB x ページ数 + 10KB x 秒数
  - 発表資料v5.2.pptx は 18ページ
  - 18分で説明すると全部で 12MB程度

```
バイト数 ファイル名
 917953  sample.pptx

 180599  slide1.png
 216198  slide2.png
 909156  slide3.png

  54588  1.mp3
  37661  2.mp3
  24966  3.mp3

 158637  1.mp4
 121428  2.mp4
 106964  3.mp4

 503815  all.mp4
```
