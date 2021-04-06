# ppt-addin-vue

ノートや本文で選択した文字列を、ブラウザの音声合成機能や AWS Polly を使って再生することができる、PowerPoint 用オフィスアドインのサンプルです。

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
