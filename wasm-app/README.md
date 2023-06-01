# wasm-app

ブラウザで音声合成ビデオを作成するWebアプリです。

ユーザは、ブラウザを使用して、CHiBi-CHiLOにアップロードできる音声合成スライドビデオファイルを作成することができます。

Webサーバとして polly proxy (以下 server)を使用します。server が Amazon Polly を使って音声合成します。

WASM版Webアプリは、以下の機能をサポートする Chrome 及び Edge ブラウザで動作します。

- Fie System Access API
- WebCodec
- WebAssembly
- SharedArrayBuffer

## 音声合成ビデオの作成手順

ユーザは、以下の手順で音声合成ビデオを作成します。

1. ブラウザでWebアプリを開く
2. パワーポイントファイルとスライドファイルを含むディレクトリを開く
3. パワーポイントファイルを選択してビデオファイルを作成する
4. zipファイルを保存する

## ビルド方法

レポジトリのトップディレクトリに移動します。

- アドインのビルド

```
$ cd ppt-addin-vue
$ npm install
$ npm run build
$ cd ..
```

- ppt2video のビルド

```
$ cd ppt2video
$ npm install
$ npm run build
$ cd ..
```

- wasm-app のビルド

```
$ cd wasm-app
$ yarn
$ yarn build
$ cd ..
```

- polly proxy の初期設定とビルド済みファイルのコピー
  - ブラウザに配布するファイルが server/dist ディレクトリに収集される

```
$ cd server
$ npm install
$ npm run copy
```

## server 及び Web アプリの起動方法

- アクセス制限なしで動作確認する
  - AWS用環境変数を適切に設定する
    - AWS_REGION
    - AWS_ACCESS_KEY_ID
    - AWS_SECRET_ACCESS_KEY

  - polly proxy の起動

```
$ cd server
$ PROT=http POLLY_WASM=true node bin/www
```

  - chrome ブラウザで http://localhost:3000/app にアクセスする

- アクセス制限あり、アドイン用サイトに機能追加する場合
  - ビルド、npm run copy 済みの server 以下すべてをコピー
  - Apache の設定を変更して /app を SP配下にする
  - /ffmpeg を配布する
  - 環境変数 POLLY_WASM=true を追加して polly proxy を起動する

## server の仕様

- POLLY_WASM 環境変数が true のとき WASM版がサポートされる
  - デフォルトは false

- アドイン、WASM版を同時にサポートする

- 学認SP と組み合わせてアクセス制限機能に対応する
  - 認証されたユーザだけが WASM版を使用できる
  - 使用量制限や使用量ログの記録が行える

- ログ
  - アドインとはパスが異なる
  - ユーザは記録されない

```
::1 - POST /app/polly 200 - 24
::1 - POST /app/polly 200 - 35
::1 - POST /app/polly 200 - 46
```

- パス

|用途      |パス              |サーバ |
|----------|------------------|------------------------- |
|addin     |/polly            |polly proxy |
|addin     |/login            |polly proxy |
|addin     |/index.html       |Apache または polly proxy |
|addin     |/finished.html    |Apache または polly proxy |
|addin     |/dialog/start     |学認SP |
|WASM版    |/app/index.html   |学認SP |
|WASM版    |/app/polly        |学認SP |
|WASM版    |/ffmpeg/...       |Apache または polly proxy |
