<h2 align="center">
   <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://cdn.builder.io/api/v1/image/assets%2FYJIGb4i01jvw0SRdL5Bt%2Fb5b9997cec2c4fffb3e5c5e9bb4fed7d">
      <img width="300" alt="AI Shell logo" src="https://cdn.builder.io/api/v1/image/assets%2FYJIGb4i01jvw0SRdL5Bt%2Fb7f9d2d9911a4199a9d26f8ba210b3f8">
    </picture>
</h2>

<h4 align="center">
   A CLI that converts natural language to shell commands.
</h4>
<p align="center">
   <a href="https://www.npmjs.com/package/@builder.io/ai-shell"><img src="https://img.shields.io/npm/v/@builder.io/ai-shell" alt="Current version"></a>
</p>

<p align="center">
   <img alt="Gif Demo" src="https://user-images.githubusercontent.com/844291/230413167-773845e7-4c9f-44a5-909c-02802b5e49f6.gif" >
<p>

<p align="center">
   Inspired by the <a href="https://githubnext.com/projects/copilot-cli">GitHub Copilot X CLI</a>, but open source for everyone.
</p>

<br>

# AI Shell

## Setup

> The minimum supported version of Node.js is v14

1. Install _ai shell_:

   ```sh
   npm install -g @builder.io/ai-shell
   ```

2. Retrieve your API key from [OpenAI](https://platform.openai.com/account/api-keys)

   > Note: If you haven't already, you'll have to create an account and set up billing.

3. Set the key so ai-shell can use it:

   ```sh
   ai config set OPENAI_KEY=<your token>
   ```

   This will create a `.ai-shell` file in your home directory.

## Usage

```bash
ai <prompt>
```

For example:

```bash
ai list all log files
```

Then you will get an output like this, where you can choose to run the suggested command, revise the command via a prompt, or cancel:

```bash
◇  Your script:
│
│  find . -name "*.log"
│
◇  Explanation:
│
│  1. Searches for all files with the extension ".log" in the current directory and any subdirectories.
│
◆  Run this script?
│  ● ✅ Yes (Lets go!)
│  ○ 📝 Revise
│  ○ ❌ Cancel
└
```

### Special characters

Note that some shells handle certain characters like the `?` or `*` or things that look like file paths specially. If you are getting strange behaviors, you can wrap the prompt in quotes to avoid issues, like below:

```bash
ai 'what is my ip address'
```

### Chat mode

![Chat demo](https://user-images.githubusercontent.com/844291/232889699-e13fb3fe-1659-4583-80ee-6c58d1bcbd06.gif)

```bash
ai chat
```

With this mode, you can engage in a conversation with the AI and receive helpful responses in a natural, conversational manner directly through the CLI:

```sh
┌  Starting new conversation
│
◇  You:
│  how do I serve a redirect in express
│
◇  AI Shell:

In Express, you can use the `redirect()` method to serve a redirect. The `redirect()` method takes one argument, which is the URL that you want to redirect to.

Here's an example:

\`\`\`js
app.get('/oldurl', (req, res) => {
  res.redirect('/newurl');
});
\`\`\`
```

### Silent mode (skip explanations)

You can disable and skip the explanation section by using the flag `-s` or `--silent`

```bash
ai -s list all log files
```

or save the option as a preference using this command:

```bash
ai config set SILENT_MODE=true
```

### Custom API endpoint

You can custom OpenAI API endpoint to set OPENAI_API_ENDPOINT（default: `https://api.openai.com/v1`）

```sh
ai config set OPENAI_API_ENDPOINT=<your proxy endpoint>
```

### Set Language

![Language UI](https://user-images.githubusercontent.com/1784873/235330029-0a3b394c-d797-41d6-8717-9a6b487f1ae8.gif)

The AI Shell's default language is English, but you can easily switch to your preferred language by using the corresponding language keys, as shown below:

| Language            | Key     |
| ------------------- | ------- |
| English             | en      |
| Simplified Chinese  | zh-Hans |
| Traditional Chinese | zh-Hant |
| Spanish             | es      |
| Japanese            | jp      |
| Korean              | ko      |
| French              | fr      |
| German              | de      |
| Russian             | ru      |
| Ukrainian           | uk      |
| Vietnamese          | vi      |
| Arabic              | ar      |
| Portuguese          | pt      |
| Turkish             | tr      |

For instance, if you want to switch to Simplified Chinese, you can do so by setting the LANGUAGE value to zh-Hans:

```sh
ai config set LANGUAGE=zh-Hans
```

This will set your language to Simplified Chinese.

### Config UI

To use a more visual interface to view and set config options you can type:

```bash
ai config
```

To get an interactive UI like below:

```bash
◆  Set config:
│  ○ OpenAI Key
│  ○ OpenAI API Endpoint
│  ○ Silent Mode
│  ● Model (gpt-4o-mini)
│  ○ Language
│  ○ Cancel
└
```

### Upgrading

Check the installed version with:

```bash
ai --version
```

If it's not the [latest version](https://github.com/BuilderIO/ai-shell/tags), run:

```bash
npm update -g @builder.io/ai-shell
```

Or just use AI shell:

```bash
ai update
```

## Common Issues

### 429 error

Some users are reporting a 429 from OpenAI. This is due to incorrect billing setup or excessive quota usage. Please follow [this guide](https://help.openai.com/en/articles/6891831-error-code-429-you-exceeded-your-current-quota-please-check-your-plan-and-billing-details) to fix it.

You can activate billing at [this link](https://platform.openai.com/account/billing/overview). Make sure to add a payment method if not under an active grant from OpenAI.

## Motivation

I am not a bash wizard, and am dying for access to the copilot CLI, and got impatient.

## Contributing

If you want to help fix a bug or implement a feature in [Issues](https://github.com/BuilderIO/ai-shell/issues) (tip: look out for the `help wanted` label), checkout the [Contribution Guide](CONTRIBUTING.md) to learn how to setup the project.

## Credit

- Thanks to GitHub Copilot for their amazing tools and the idea for this.
- Thanks to Hassan and his work on [aicommits](https://github.com/Nutlope/aicommits), which inspired the workflow and some parts of the code and flows

<br><br>

<p align="center">
   <a href="https://www.builder.io/m/developers">
      <picture>
         <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/844291/230786554-eb225eeb-2f6b-4286-b8c2-535b1131744a.png">
         <img width="250" alt="Made with love by Builder.io" src="https://user-images.githubusercontent.com/844291/230786555-a58479e4-75f3-4222-a6eb-74c5af953eac.png">
       </picture>
   </a>
</p>


以下は、`aish`コマンドのシンボリックリンクを作成し、システム全体で実行可能にするための手順をMarkdown形式でまとめたものです。

# `aish` コマンドのシンボリックリンク作成手順

## 目的
このドキュメントでは、`aish` コマンドをグローバルに使用可能にするために、シンボリックリンクを作成する手順を示します。

## 前提条件
- Node.js と npm がインストールされていること。
- プロジェクトのディレクトリ構成が適切にセットアップされていること（例: `./dist/cli.mjs` が存在すること）。
- プロジェクトが `npm link` に対応しているか、手動でリンクを作成する。

## 手順

### 1. プロジェクトのビルド

まず、プロジェクトのビルドを行います。`npm run build` コマンドを実行して、`./dist/cli.mjs` が生成されることを確認します。

```bash
npm run build
```

### 2. `npm link` を使用してグローバルにリンク

`npm link` コマンドを使用してプロジェクトをローカルでグローバルにリンクします。

```bash
npm link
```

`npm link` によって、`aish` コマンドがシステム全体で使用可能になります。もし`aish`が認識されない場合、次の手順に進んでください。

### 3. 手動でシンボリックリンクを作成

`npm link` がうまく動作しない場合、手動でシンボリックリンクを作成することができます。次のコマンドを使って、`aish`コマンドを`/usr/local/bin`にリンクします。

```bash
sudo ln -s /path/to/your/project/dist/cli.mjs /usr/local/bin/aish
```

`/path/to/your/project/`は、プロジェクトのフルパスに置き換えてください。例えば、プロジェクトが`~/Downloads/ai-shell`にある場合、次のように実行します。

```bash
sudo ln -s ~/Downloads/ai-shell/dist/cli.mjs /usr/local/bin/aish
```

### 4. `aish` コマンドの実行

シンボリックリンクが正しく作成されたら、ターミナルから`aish`コマンドを実行できます。

```bash
aish
```

このコマンドで、`./dist/cli.mjs`が実行されます。

---

## トラブルシューティング

- **`aish`コマンドが認識されない場合**:
  `npm link` が正しく動作していない場合、手動でシンボリックリンクを作成してください（上記手順を参照）。

- **`PATH`に問題がある場合**:
  NPMのグローバルインストールディレクトリがシステムの`PATH`に含まれていない可能性があります。以下のコマンドで確認できます。

  ```bash
  npm root -g
  ```

  返されたパスが`PATH`に含まれているか確認し、含まれていない場合は、`PATH`に追加してください。

---

## まとめ

この手順に従って、`aish`コマンドをシステム全体で使用できるように設定します。ビルド後に`npm link`を使うか、手動でシンボリックリンクを作成して`aish`を実行してください。
