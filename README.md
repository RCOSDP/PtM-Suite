# PtM-Suite

## 何をするシステムか

マイクロソフト社のパワーポイントの内容から、Note部分の読み上げをスピーチシンセサイザーに読み上げさせ、動画教材を作成するシステムです。生成した動画とともに、作成者が付与した著者、利用ライセンスなどのメタデータを含む登録用データが出力されます。この登録用データを用いれば、LTI-MCを導入した各種LMSに動画教材を登録することができます。

## システムの全体像

以下のリポジトリには PtM の旧版と現行版の両方を含んでいます。旧版は、GitHub Actionを用いて GitHub上に格納したパワーポイントから動画教材を作成します。これに対して、現行版は、Wasm (Web Assemby) を用いた動画変換が可能なWebサイトを用意し、このサイトにログインしたユーザが、パワーポイントの読み込みと動画教材の生成を行います。

- [RCOSDP/PtM-Suite](https://github.com/RCOSDP/PtM-Suite)

以下は、PtM で生成した動画教材の登録先となる動画教材 (マイクロコンテンツ) の管理システムです。

- [RCOSDP/GakuNinLMS-LTI-MC](https://github.com/RCOSDP/GakuNinLMS-LTI-MC)

## システムのコンポーネント（アドイン）

PowerPoint のアドインとして、WebPageを表示させて、自分のコンピュータまたは、Amazon Polly などのサービスと連携させるために、下記のコンポーネントを使用します。

- ppt-addin-vue  (アドイン本体)
- server  (アドイン用サーバ)

## システムのコンポーネント (GitHub Action版)

GitHubレポジトリ上の workフォルダ上で、GitHub Action を用いて動画教材の生成を行います。

## システムのコンポーネント（Wasm版）

Amazon Polly による合成音声を用いて動画教材を生成する機能の Wasm 版コンポーネントです。現行版 [PtMサーバ](https://ptm.nii.ac.jp/)では、このコンポーネントが動作しています。

- wasm-app (Wasm版PtMアプリ) 


## 本リポジトリの構成


```
/
+ README.md このファイル
+ docs/spec/ 仕様書置き場
  + access.md アクセス制限機能について
  + import.md pptとマイクロコンテンツ のデータ項目のすり合わせなど
+ ppt-addin-vue/ PPT用のPtMアドイン
+ server/ アドインを配布するサーバ兼 aws polly proxy
+ ppt2video/ パワーポイントを動画に変換するnode.jsプログラム
+ wasm-app/ Webアプリ (Wasm版) 
+ test/ テスト用パワーポイントファイル
+ misc/ サンプルスクリプト、ファイルなど 
+ work/ GitHub Action用作業領域
+ .github/workflows ワークフローファイル (GitHub Action版)
```

## ワークフロー (GitHub Action版)

レポジトリには、次の GitHub Actions ワークフローが定義されています。

|名称|ファイル名|内容|
|---|---|---|
|PPT2VIDEO|ppt2video.yml|test/vuca.pptxファイルを動画に変換する|
|ONPUSH|onpush.yml|mainブランチへのgit pushで動作し、変更されたパワーポイントファイルを動画に変換する|

PPT2VIDEOワークフローは、Actionsページの Run workflow ボタンから起動します。

## License
This project is released under the MIT License. The full text can be found in the [LICENSE file](LICENSE).

## Contributors
We appreciate contributions to this project. A list of all contributors can be found in the [CONTRIBUTORS file](CONTRIBUTORS.md).

These documents serve to ensure transparency and equality among all participants in the project, accurately reflecting each member's involvement and the collective nature of the project.
