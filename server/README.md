## server

AWS Polly への proxy 機能を含む web サーバです。次の 2つの方法で使うことができます。

- 単独でアドイン用サーバとして使用する
- ppt-addin-vue 開発用サーバと共に使用する

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
