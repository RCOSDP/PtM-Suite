# CHiLO-Speech

## 1. Introduction

### (1) CHiLO-Speechとは
CHiLO-Speechは，[学習支援システムCHiBi-CHiLO](https://github.com/npocccties/chibichilo)に対応した，音声合成ビデオ作成ツールです．

マイクロソフト社製パワーポイントにナレーション原稿を記載して，GitHubのCHiLO-Speechレポジトリにアップロードする，CHiBi-CHiLOに対応した合成音声付きビデオ教材が作成できます．

![CHiLO-Speech概要](docs/assets/image01.png)

### (2) 合成音声付きビデオ教材作成手順

CHiLO-Speechを利用してビデオ教材を作成する手順は次の通りとなっています．

* __Step1．__ パワーポイントにナレーションを記述する． 
* __Step2．__ パワーポイントをGithubにアップロードし音声合成ビデオに変換する． 
* __Step3．__ GitHubからダウンロードしたZIPファイルをCHiBi-CHiLOに登録する．

ビデオ教材作成手順の詳細は，[CHiLO-Speechマニュアル](https://docs.cccties.org/chilospeech/)　をご覧下さい．

### (3) CHiBi-CHiLOとは

CHiBi-CHiLOとは，LMSと外部接続する[LTIツールプロバイダー](https://www.imsglobal.org/activity/learning-tools-interoperability) です．
ビデオを共有・再利用することを目的に開発されました．YoutubeやVimeoなどのインターネット上のビデオを組み合わせ，「ブック」と呼ばれる形式のビデオ教材としてLMSで配信することができます．

CHiBi-CHiLOの詳細は[CHiBi-CHiLO  Documentation](https://npocccties.github.io/chibichilo/)をご覧下さい．

## 2. Architecture

### (1) システム構成

CHiLO-Speechのシステム構成は，以下の通りです．

1. 確認用アドイン　([manifest](manifest)) 
    *  パワーポイントに記述するナレーション原稿を確認するためのパワーポイントのアドインです． 
2. 中継サーバー　([ppt-addin-vue](ppt-addin-vue/)，[server](server))
    *  確認用アドインとAmazon pollyを中継するサーバーです． 
3. Amazon Polly　(https://aws.amazon.com/jp/polly/) 
    * AWSが提供するTTS（Text-to-Speech）エンジンのクラウドサービスです． あらかじめ，AWS Pollyのアクセスキーが必要です．
4. GitHub専用レポジトリ (本レポジトリ)
    * 本レポジトリです．GitHub Actionsにより，アップロードしたパワーポイントを合成音声ビデオ（MP4）に変換します．[workフォルダ](work/)にパワーポイントをアップロードすると，ビデオとWowza用CHiBi-CHiLO登録ファイル（JSON）が出力される．[uploadフォルダ](upload/)にアップロードすると，Vimeo用CHiBi-CHiLO登録ファイルが出力され，ビデオは，Vimeoに自動的登録される．
5. LMS
    * CHiBi-CHiLOに登録したビデオ教材を配信するLTI対応のLMS（Learning Management Service）です．
6. CHiBi-CHiLO　(https://github.com/npocccties/chibichilo)
    * GitHub専用レポジトリからダウンロードしたZipファイルをCHiBi-CHiLOに登録すると，ビデオ教材としてLMSで配信できます．
7. VODサーバー
    * GitHub専用レポジトリからダウンロードしたZipファイルをCHiBi-CHiLOに登録すると，ビデオ教材としてLMSで配信できます．

![CHiLO-Speechのシステム構成](docs/assets/image02.png)


### (2) 本リポジトリの構成


```
/
+ README.md このファイル
+ documentation/spec/ 仕様書置き場
  pptとマイクロコンテンツ のデータ項目のすり合わせなど。
  + import.md
+ ppt-addin-vue/ アドイン本体
+ server/ アドインを配布するサーバ兼 AWS Polly proxy
+ ppt2video/ パワーポイントを動画に変換するnode.jsプログラム
+ test/ テスト用パワーポイントファイル
+ misc/ サンプルスクリプト、ファイルなど
+ manifest/ アドインをパワーポイントに登録するために必要なmanifestファイル
+ work/ パワーポイントをアップロードすると合成音声ビデオ（MP4）とWowza用CHiBi-CHiLO登録ファイル（JSON）が出力される．
  + _sample/ ナレーション原稿が記載されたパワーポイントファイルのサンプル
+ upload/ パワーポイントをアップロードするとVimeo用CHiBi-CHiLO登録ファイルが出力される．
+ .github/workflows ワークフローファイル
```

### (3) ワークフロー

レポジトリには、次の GitHub Actions ワークフローが定義されています。

|名称|ファイル名|内容|
|---|---|---|
|PPT2VIDEO|ppt2video.yml|test/vuca.pptxファイルを動画に変換する|
|ONPUSH|onpush.yml|mainブランチへのgit pushで動作し、変更されたパワーポイントファイルを動画に変換する|

PPT2VIDEOワークフローは、Actionsページの Run workflow ボタンから起動します。