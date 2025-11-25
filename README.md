# Global News Curator 🌍

世界中のニュースから重要なトピックをAIが厳選し、あなたの好みに合わせて要約・配信するアプリケーションです。
Webブラウザ上で動作するだけでなく、GitHub Actionsを利用して毎朝Slackに自動通知する機能を備えています。

## ✨ 機能

- **AIによるニュース選定**: Google Gemini APIを使用し、過去24時間の重要ニュースを10件厳選。
- **パーソナライズ**: ユーザーの「興味のあるキーワード」「好きなカテゴリ」「嫌いなカテゴリ」を学習・反映。
- **Slack連携**: 毎朝決まった時間に、整形されたニュースダイジェストをSlackチャンネルへ送信。
- **自動化対応**: GitHub Actionsを利用したサーバーレスな定期実行。

---

## 🚀 自動化セットアップ手順 (GitHub Actions)

このリポジトリをフォーク(Fork)して、あなた自身の環境で毎朝ニュースを受け取るための手順です。

### 1. 事前準備 (APIキーとWebhookの取得)

自動化を行うには、以下の2つのキーが必要です。

#### A. Google Gemini APIキーの取得
1. [Google AI Studio](https://aistudio.google.com/app/apikey) にアクセスします。
2. Googleアカウントでログインし、「Create API key」をクリックします。
3. 作成されたキー（`AIza`から始まる文字列）をコピーして控えておきます。
   * ※ 注意: このキーは他人に教えないでください。

#### B. Slack Incoming Webhook URLの取得
1. 通知を送りたいSlackワークスペースで [Slack Apps (Incoming Webhooks)](https://api.slack.com/apps?new_app=1) を開きます。
2. 「Create New App」→「From scratch」を選択。
3. App Name（例: `NewsBot`）を入力し、ワークスペースを選択して「Create App」をクリック。
4. 左メニューの **"Incoming Webhooks"** をクリックし、スイッチを **"On"** に切り替えます。
5. 下部の **"Add New Webhook to Workspace"** をクリックし、通知したいチャンネルを選択して「許可する」を押します。
6. 発行された **"Webhook URL"**（`https://hooks.slack.com/services/...`）をコピーして控えておきます。

---

### 2. リポジトリの設定 (Secretsの登録)

取得したキーをGitHubリポジトリに安全に保存します。

1. あなたのGitHubリポジトリページを開きます。
2. 上部タブの **"Settings"** をクリックします。
3. 左サイドメニューの **"Secrets and variables"** を展開し、**"Actions"** をクリックします。
4. **"New repository secret"** ボタンをクリックし、以下の2つを登録します。

| Name | Secret (値) | 説明 |
| :--- | :--- | :--- |
| `API_KEY` | (取得したGemini APIキー) | AIによる生成に使用します |
| `SLACK_WEBHOOK_URL` | (取得したSlack Webhook URL) | Slackへの通知に使用します |

> **注意**: `Name` は大文字・小文字を含め正確に入力してください。

---

### 3. 自動化スクリプトの配置

Webアプリを使用して、設定済みのスクリプトファイルを生成・配置します。

1. このWebアプリをローカルで起動します（後述の「ローカルでの開発」参照）。
2. アプリ画面右上の **設定アイコン (⚙️)** をクリックします。
3. **Preferences** にSlack Webhook URLや興味のあるキーワードを入力します。
4. **Automation Setup** セクションにある3つのボタンを押し、ファイルをダウンロードします。
   - `daily-news-bot.js`
   - `package.json`
   - `daily-news.yml`
5. これらのファイルをリポジトリにアップロードします。
   - `daily-news-bot.js` と `package.json` は **ルートディレクトリ**（一番上の階層）に置きます。
   - `daily-news.yml` は `.github/workflows/` フォルダの中に置きます（フォルダがない場合は作成してください）。

配置が完了し、変更をCommit/Pushすると、自動的にスケジュールが有効になります。
（デフォルトでは日本時間の朝7:00に通知が届きます）

---

## 💻 ローカルでの開発・実行

Webアプリ自体をカスタマイズしたい場合の手順です。

### 必須要件
- Node.js (v20以上推奨)
- npm

### インストールと起動

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm start
```

ブラウザで `http://localhost:8080` (または表示されたURL) にアクセスしてください。

## 🛠 カスタマイズ

### 配信時間の変更
`.github/workflows/daily-news.yml` ファイル内の `cron` 設定を変更します。

```yaml
on:
  schedule:
    # 記述はUTC時間です (日本時間 -9時間)
    # 例: 日本時間 朝7:00 = UTC 22:00
    - cron: '0 22 * * *'
```

### 興味・関心設定の変更
`daily-news-bot.js` の上部にある `CONFIG` 変数を直接編集するか、Webアプリの設定画面から再生成してください。

```javascript
const CONFIG = {
  // ここを編集
  keywords: ["Technology", "AI", "Startup"],
  // ...
};
```

---

## 📜 ライセンス
MIT License
