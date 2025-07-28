# wasm-app

ブラウザで音声合成ビデオを作成するWebアプリです。

ユーザは、ブラウザを使用して、GakuNinLMS-M-CMSにアップロードできる音声合成スライドビデオファイルを作成することができます。

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

## server 及び Web アプリの起動方法 (アクセス制限なし)

アクセス制限なしで動作確認する場合は、次のようにします。

- polly proxy を起動する
  - AWS用環境変数を適切に設定する
    - AWS_REGION
    - AWS_ACCESS_KEY_ID
    - AWS_SECRET_ACCESS_KEY

```
$ cd server
$ PROT=http POLLY_WASM=true node bin/www
```

- chrome ブラウザで http://localhost:3000/app にアクセスする

## server 及び Web アプリの起動方法 (アクセス制限あり,sample-login 使用)

アクセス制限あり、sample-login を使用して動作確認する場合は、次のようにします。

- sample-login を起動する

```
$ export POLLY_PASSWORD=chilo
$ export POLLY_LOGIN_URL=http://localhost:3000/login
$ export POLLY_DIALOG_FINISHED_URL=http://localhost:3000/app

$ cd sample-login
$ PORT=3006 PROT=http bin/www
```

- polly proxy を起動する
  - AWS用環境変数を適切に設定する

```
$ export POLLY_APP_START_URL=http://localhost:3006/dialog/start

$ cd server
$ PROT=http POLLY_WASM=true POLLY_AUTHORIZATION=true node bin/www
```

- chrome ブラウザで http://localhost:3000/app にアクセスする

## server の仕様

- POLLY_WASM 環境変数が true のとき WASM版がサポートされる (デフォルト false)
  - /app, /app/polly などへのアクセスが有効になる
  - アドイン、WASM版を同時にサポートする

- POLLY_AUTHORIZATION 環境変数が true のとき、アドイン,WASM版ともにトークンを使ったアクセス制限を行う
  - sample-login, sample-gakunin と組み合わせてアクセス制限機能に対応する
  - 認証されたユーザだけが アドイン,WASM版を使用できる
  - 使用量制限や使用量ログの記録が行える
  - アクセス制限の詳細は docs/spec/access.md に記載

- パス

アドインとWASM版が使用するパスは、以下のとおりです。

|用途      |パス              |サーバ |
|----------|------------------|------------------------- |
|addin     |/polly            |polly proxy (トークン) |
|addin     |/login            |polly proxy |
|addin     |/index.html       |Apache または polly proxy |
|addin     |/finished.html    |Apache または polly proxy |
|addin     |/dialog/start     |学認SP, sample-gakunin    |
|WASM版*1  |/app/start        |学認SP, sample-gakunin    |
|WASM版*2  |/app/index.html   |polly proxy |
|WASM版*3  |/app/polly        |polly proxy (トークン) |
|WASM版*4  |/app/log          |polly proxy (トークン) |
|WASM版    |/ffmpeg/...       |polly proxy |

*1 sample-gakunin を addin 用とは別設定でもう1つ追加で動作させる
*2 WASM版 /app/index.html は SP 配下に入れない
*3 WASM版 /app/polly 呼び出しは SP 配下に入れない、トークンをチェックする
*4 WASM版 /app/log ログ保存 API を追加、トークンをチェックする

sample-gakunin 実行後に redirect する先は /app にします。index.php の以下の設定が変更になります。

```
$POLLY_DIALOG_FINISHED_URL = 'https://localhost:3000/finished.html';
```

sample-gakunin を配置するパス /app/start を、server の環境変数 POLLY_APP_START_URL で指定します。
server の動作に必要な環境変数については、以下の表を参考にしてください。

| 環境変数              | 設定値 |
|-----------------------|--------|
| AWS_REGION            | 適切な値 |
| AWS_ACCESS_KEY_ID     | 適切な値 |
| AWS_SECRET_ACCESS_KEY | 適切な値 |
| POLLY_WASM            | true |
| POLLY_AUTHORIZATION   | true |
| POLLY_LOGDIR その他   | docs/spec/ascess.md 参照 |
| POLLY_APP_START_URL   | 例: https://host/app/start |
