# ppt-addin-vue

ノートや本文で選択した文字列を、ブラウザの音声合成機能や AWS Polly を使って再生することができる、PowerPoint 用オフィスアドインのサンプルです。

## Deploy on Vercel

Vercel にデプロイして使う場合、この ppt-addin-vue と server の 2 つのデプロイをペアで利用することに注意して、次の手順でデプロイしてください。

- `app-addin-vue/src/main.js` の `const server = 'https://polly-server-one.vercel.app'` で設定している URL を `server` をデプロイした先のサイトとする
  - 変更するときはローカルだけで無く github に push が必要です。vercel の環境変数で上書きできるようにすると便利だろうが今のところそれは未対応
- Vercel デプロイのセットアップ
  - `New Project` でこのリポジトリを `Import` する
  - `Import Project` で `ppt-addin-vue` ディレクトリを選択する
  - `PROJECT NAME` は `polly-addon-test` など自由に設定
  - `FRAMEWORK PRESET` = Vue.js (自動認識される)
  - `ROOT DIRECTORY` = ppt-addin-vue (先ほど選んだもの)
  - `Environment Variables` に次を設定
    - `POLLY_SERVER` に server をデプロイしたサイト (`https://polly-server-test.vercel.app` など) を設定
- デプロイされたら `Settings` - `Domains` で `polly-addon-test.vercel.app` となっていることを確認。別のものに変更したければ変更する
- 先ほどデプロイした先のドメインをアドオンフレームに読み込むようにするため `manifest.xml` の中の `http://localhost:3000/` を全て `http://polly-addon-test/` のように一括置き換えして `manifest-vercel.xml` のように別ファイルで保存する
- 新しく作った manifest をオフィスに読み込む (手順は下記ローカル開発時と同じ)

## Local Development

開発用サーバを使う場合は、keys ディレクトリに localhost証明書が必要です。localhost証明書は、以下のページの「アプリをセキュリティ保護する」の方法で入手します。

Vue を使用して Excel 作業ウィンドウ アドインを作成する
https://docs.microsoft.com/ja-jp/office/dev/add-ins/quickstarts/excel-quickstart-vue

以下の 3つのファイルが必要です。

- keys/localhost.key
- keys/localhost.crt
- keys/ca.crt

## Project setup
```
npm install
```

## Compiles and hot-reloads for development

開発用サーバは、次の方法で起動します。

```
npm run serve
```

アドインを次の方法で PowerPoint アプリに挿入します。

1. office.com で PowerPoint for the web を起動する
2. [挿入]-[アドイン]で Office アドイン ダイアログが表示される
3. ダイアログで [マイアドインのアップロード]をクリック、[参照...]で manifest.xml を選んで [アップロードする]

PowerPoint で [ホーム]-[Show Taskpane]をクリックすると、アドインが表示されます。

文字列を選択してアドインの[音声合成]をクリックすると、ブラウザの音声合成機能で再生します。

文字列を選択して[AWS Polly]をクリックすると、AWS Polly で合成した音声を再生します。AWS Polly を使って再生する場合は ../server が必要です。

## Compiles and minifies for production

以下のコマンドで dist ディレクトリに production コードが生成されます。

```
npm run build
```

## Lints and fixes files
```
npm run lint
```

## Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
