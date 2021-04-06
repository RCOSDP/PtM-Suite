## polly

このディレクトリには、AWS Polly を呼び出すサンプルプログラムが含まれます。

以下の環境変数を適切に設定します。

- AWS_REGION
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY

test.sh は aws コマンドを使って takumi.mp3 ファイルを生成するサンプルプログラムです。

sample.py は、AWS Polly を使って sample.mp3 ファイルを生成する python プログラムです。

boto3 パッケージを pip または pip3 でインストールします。

```
$ pip install boto3
```

python または python3 でサンプルプログラムを実行すると、sample.mp3 ファイルが作成されます。

```
$ python sample.py
```

nsample.js は、AWS Polly を使って node.mp3 ファイルを生成する node.js プログラムです。AWS SDK をインストールします。

```
$ npm install aws-sdk
```

プログラムを実行すると node.mp3 ファイルが作成されます。

```
$ node nsample.js
```

## sapi

このディレクトリには、Windows SAPI を使って音声合成をするスクリプトが含まれます。コマンドプロンプトで、次のように実行します。

```
C:\Users\user\sapi> cscript haruka.js
```

## powershell

このディレクトリには、PowerPoint アプリを使って sample.pptx ファイルのスライド PNG 画像を生成する PowerShell スクリプト mkpng.ps1 が含まれます。次のように実行します。

```
PS C:\Users\user\powershell> .\mkpng.ps1
```

## sample1

このディレクトリには、ffmpeg などを使ってマニュアル操作で作成したビデオファイルが含まれます。
