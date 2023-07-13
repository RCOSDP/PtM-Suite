## ppt2video

ppt2video は、AWS Polly を使って PowerPoint 文書から動画を生成するコマンドです。

実行時には、以下の環境変数を適切に設定します。

- AWS_REGION
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY

GitHub Actions 及び以下の環境で動作を確認しています。

Ubuntu 20.04.5 LTS
x86_64 アーキテクチャ

$ node -v
v16.19.0

## 使い方

ppt2video コマンドは、次のように使います。

```
node bin/ppt2video.js ファイル名
```

ファイル名には、パワーポイントファイル名 filename.pptx を指定します。あらかじめパワーポイントアプリで、スライドイメージの PNG ファイルを作成しておきます。具体的な手順は次のとおりです。

1. [ファイル]-[名前を付けて保存] でパワーポイントファイルがあるディレクトリを選択
2. [ファイルの種類]を[PNGポータブルネットワークグラフィックス形式(*.png)]に設定する
3. [保存]ボタンを押して、エクスポートするスライドを[すべてのスライド]にする

filename ディレクトリに各スライドの PNG ファイルが保存されていることを確認してください。

インストール方法によっては、次のように使うことも可能です。

```
bin/ppt2video.js ファイル名
ppt2video ファイル名
```

以下のコマンドラインオプション及び環境変数をサポートしています。

|オプション|デフォルト値|環境変数|
|---------|-----------|-------|
|-t,--tempDir|.|PPT2VIDEO_TEMP_DIR|
|-o,--outputDir|.|PPT2VIDEO_OUTPUT_DIR|
|--libDir|<インストール先>/lib|PPT2VIDEO_LIB_DIR|
|--ffmpegCmd|ffmpeg|PPT2VIDEO_FFMPEG_CMD|
|--sampleRate|22010|PPT2VIDEO_SAMPLERATE|
|--voice|Takumi|PPT2VIDEO_VOICE|
|--delay|1.0|PPT2VIDEO_DELAY|
|--pad|1.0|PPT2VIDEO_PAD|
|--fade|0|PPT2VIDEO_FADE|
|-v,--vcodec|libopenh264|PPT2VIDEO_VCODEC|
|--voption||PPT2VIDEO_VOPTION|
|--acodec|aac|PPT2VIDEO_ACODEC|
|--aoption||PPT2VIDEO_AOPTION|
|--logfile|ppt2video.log|PPT2VIDEO_LOGFILE|
|--loglevel|info|PPT2VIDEO_LOGLEVEL|
|-n, --novideo|false||

-t,--tempDir で一時ファイルを作成するディレクトリを指定します。.mp3 ファイルなどの一時ファイルは、コマンド終了時に削除されます。

-o,--outputDir で出力ファイルを作成するディレクトリを指定します。

--libDir で taka jar ファイルや OpenH264ライブラリを格納するディレクトリを指定します。デフォルトは、ppt2video コマンドのインストール先 lib ディレクトリです。

--sampleRate, --voice で Amazon Polly で音声合成するパラメータを指定します。

--delay, --pad, --fade では、トピック毎のビデオに設定する無音区間や fade-in, fade-out の時間のデフォルト値を指定します。

-v,--vcodec では、ffmpeg でビデオを生成するときのビデオコーデックを指定します。libopenh264 と libx264 を選択できます。

--logfile でログファイルの名前を指定します。ログは指定したファイルに追記されます。ファイル名のデフォルトは ppt2video.log です。

--loglevel には、trace, debug, info, warn, error, fatal のいずれかを指定します。

-n, --novideo を指定すると、ビデオを作成せずに、インポート json ファイルを生成します。

## セットアップ(ローカル環境)

ローカル環境で ppt2video コマンドを動作させる手順を示します。

以下のコマンドを実行します。

```
npm install
```

lib ディレクトリに https://github.com/RCOSDP/GakuNinLMS-M-CMS/releases/tag/binary の Assets から以下のファイルをダウンロードします。

- ffmpeg.bz2
- libopenh264-2.1.1-linux64.6.so.bz2

gz ファイルを展開し、ffmpeg に実行権を付与します。

```
bunzip2 ffmpeg.bz2
chmod +x ffmpeg
bunzip2 libopenh264-2.1.1-linux64.6.so.bz2
ln -s libopenh264-2.1.1-linux64.6.so libopenh264.so.6
```

この状態で、以下のいずれかの方法でコマンドを起動できます。

bin/ppt2video.js
node bin/ppt2video.js

さらに以下のコマンドを実行すると、/usr/local/bin/ppt2video コマンドが使えるようになります。

```
npm install -g
```

## セットアップ(GitHub Actions)

GitHub Actions で ppt2video コマンドを動作させる手順を示します。

### Secrets

レポジトリの [Settings]-[Secrets] で、以下の secret を適切に設定します。

- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY

### バイナリ

GitHub Actions runner から以下のバイナリがダウンロードできるようにします。

- ffmpeg.bz2
- libopenh264-2.1.1-linux64.6.so.bz2

GitHub レポジトリの [Code]タブで、"binary" という Tag のリリースを作成し、上記のバイナリを Assets として登録します。リリース本体の Source code (zip)や Source code (tar.gz)は使用しません。

libopenh264-2.1.1-linux64.6.so.bz2 は、https://github.com/cisco/openh264/releases からダウンロードします。

ffmpeg は、次の手順で作成します。

1. openh264 をビルドする
2. openh264 を使う設定で ffmpeg をビルドする

以下の作業ログを参考にしてください。

openh264 をビルドしてインストールする。

```
$ sudo apt-install nasm

$ git clone -b v2.1.1 --depth 1 --single-branch https://github.com/cisco/openh264.git
$ cd openh264
$ make
...
g++ -O3 -DNDEBUG -m64 -DX86_ASM -DHAVE_AVX2 -Wall -fno-strict-aliasing -fPIC -MMD -MP -fstack-protector-all -DGENERATED_VERSION_HEADER -DHAVE_AVX2 -I./codec/api/svc -I./codec/common/inc -Icodec/common/inc  -I./codec/decoder/core/inc -I./codec/decoder/plus/inc -c -o codec/decoder/core/src/manage_dec_ref.o ...
...
$ sudo make install
sh ./codec/common/generate_version.sh ./
Keeping existing codec/common/inc/version_gen.h
mkdir -p /usr/local/include/wels
install -m 644 .//codec/api/svc/codec*.h /usr/local/include/wels
mkdir -p /usr/local/lib
install -m 644 libopenh264.a /usr/local/lib
mkdir -p /usr/local/lib
install -m 755 libopenh264.so.2.1.1 /usr/local/lib
if [ "so.2.1.0" != "so" ]; then \
  cp -a libopenh264.so.5 /usr/local/lib ; \
  cp -a libopenh264.so /usr/local/lib ; \
fi
mkdir -p /usr/local/lib/pkgconfig
install -m 644 openh264.pc /usr/local/lib/pkgconfig
```

ダウンロードしたバイナリでビルドしたバイナリを置き換える。

```
$ sudo cp <somewhere>/libopenh264-2.1.1-linux64.6.so /usr/local/lib/libopenh264.so.2.1.1
$ sudo rm /usr/local/lib/libopenh264.a
```

ffmpeg をビルドする。

```
$ sudo apt-get install libmp3lame-dev

$ git clone https://git.ffmpeg.org/ffmpeg.git
$ git checkout n3.4.8
$ ./configure --enable-libopenh264
$ make

$ ldd ffmpeg
...
      libopenh264.so.6 => /usr/local/lib/libopenh264.so.6 (0x00007fefa6070000)
...
```

## GitHub Packages

GitHub Packages にパッケージを登録する場合は、次のようにします。

- Personal Access Token(PAT) とレジストリを ~/.npmrc ファイルに登録する
- または、レジストリにログインする
- npm publish する

詳細は、以下のページを参照してください。

https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry

パッケージは、Packages ページから削除できます。

## Vimeo Upload

Vimeo に動画をアップロードする場合は，以下の環境変数を適切に設定します．

- VIMEO_ACCESS_TOKEN
- VIMEO_CLIENT_ID
- VIMEO_CLIENT_SECRET
- VIMEO_PROJECT_ID

アクセストークンは，"Interact" "Upload" のスコープが必要です．

PROJECT_IDは，アップロードするフォルダのIDを入力します．

アクセストークンの生成方法については，以下のページを参照してください．

https://vimeo.zendesk.com/hc/ja/articles/360042445032