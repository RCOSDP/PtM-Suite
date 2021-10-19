## server

AWS Polly への proxy 機能を含む web サーバです。次の 2つの方法で使うことができます。

- 単独でアドイン用サーバとして使用する
- ppt-addin-vue 開発用サーバと共に使用する

## Deploy on Vercel

Vercel には次の手順でデプロイしてください。

- Vercel デプロイのセットアップ
  - `New Project` でこのリポジトリを `Import` する
    - 同一リポジトリからデプロイできる数の制限に引っかかったらリポジトリをまず github でフォークし、フォークした先のリポジトリをインポートすること
  - `Import Project` でこの `server` ディレクトリを選択する
  - `PROJECT NAME` は `polly-server-test` など自由に設定
  - `FRAMEWORK PRESET` = Other
  - `ROOT DIRECTORY` = server (先ほど選んだもの)
  - `Environment Variables` に次の三つを設定
    - `AWS_REGION_POLLY`, `AWS_ACCESS_KEY_ID_POLLY`, `AWS_SECRET_ACCESS_KEY_POLLY`
    - 標準の変数名は予約されているため末尾に `_POLLY` を付けたものを設定していることに注意
- デプロイされたら `Settings` - `Domains` で `polly-server-test.vercel.app` となっていることを確認。別のものに変更したければ変更する
- ここでデプロイしたサーバに対してアドオンから問い合わせを行うようにするため、ppt-addon-vue のデプロイ時に `POLLY_SERVER` 環境変数に `https://polly-server-test.vercel.app` を設定する (`src/main.js` で `server` 定数として読み込まれる) 必要があることに注意
- 続けて ppt-addon-vue も Vercel デプロイしてオフィスにアドインとして読み込んで使う

## Local Server

以下の環境変数を適切に設定します。

- AWS_REGION
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY

単独でアドイン用サーバとして使用する場合は、次の準備が必要です。

- keys ディレクトリに localhost 証明書を置く
- ppt-addin-vue で npm run build して生成された dist ディレクトリをコピーする

次のように起動します。

```
npm start
```

ppt-addin-vue 開発用サーバと共に以下の構成で動作させる場合は、`PORT=3003 PROT=http node bin/www` で起動します。

```
アドイン <-> ppt-addin-vue 開発用サーバ <-> tts/server <-> AWS Polly
```
