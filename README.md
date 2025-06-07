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

2. Choose and configure your AI engine:

### Option A: OpenAI (default)

1. Retrieve your API key from [OpenAI](https://platform.openai.com/account/api-keys)

   > Note: If you haven't already, you'll have to create an account and set up billing.

2. Set the key so ai-shell can use it:

   ```sh
   ai config set OPENAI_KEY=<your openai token>
   ```

   > The default model is `gpt-4.1-nano` (most cost-effective). You can change it using `ai config set OPENAI_MODEL=<model_name>`

### Option B: GigaChat

1. Get your GigaChat API credentials from [AI Platform](https://developers.sber.ru/docs/ru/gigachat/individuals-quickstart)

2. Configure GigaChat as your AI engine:

   ```sh
   ai config set AI_ENGINE=GigaChat
   ai config set GIGACHAT_KEY=<your gigachat api key>
   ```

---

   This will create a `.ai-shell` file in your home directory. You can change the path to the config file by setting the `AI_SHELL_CONFIG_PATH` environment variable.

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
│ find . -name "*.log"
│
◇  Explanation:
│
│ 1. Search current directory and subdirectories  
│ 2. Find files ending with ".log"
│
◆  Run this script?
│  ● ✅ Yes (Lets go!)
│  ○ 📝 Edit
│  ○ 🔁 Revise
│  ○ 📋 Copy
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

### Custom API endpoints

You can customize API endpoints for both engines:

**For OpenAI** (default: `https://api.openai.com/v1`):
```sh
ai config set OPENAI_API_ENDPOINT=<your proxy endpoint>
```

**For GigaChat**:
```sh
ai config set GIGACHAT_API_ENDPOINT=<your gigachat endpoint>
```

### Proxy Configuration

The application supports advanced proxy settings for both engines:

**ALL_PROXY settings** (separate for each engine):
```sh
# For OpenAI
ai config set OPENAI_ALLPROXY=<your_proxy_url>

# For GigaChat  
ai config set GIGACHAT_ALLPROXY=<your_proxy_url>
```

**Proxy PAC URL** (common setting):
```sh
ai config set PROXY_PAC_URL=<your_pac_url>
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
│  ● AI Engine (OpenAI)
│  ○ [OpenAI] Key
│  ○ [OpenAI] Model
│  ○ [OpenAI] API Endpoint
│  ○ [OpenAI] ALL_PROXY
│  ○ [GigaChat] Key
│  ○ [GigaChat] Model
│  ○ [GigaChat] API Endpoint
│  ○ [GigaChat] ALL_PROXY
│  ○ [Common] Proxy PAC URL
│  ○ Silent Mode
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

### OpenAI Issues

#### 429 error

Some users are reporting a 429 from OpenAI. This is due to incorrect billing setup or excessive quota usage. Please follow [this guide](https://help.openai.com/en/articles/6891831-error-code-429-you-exceeded-your-current-quota-please-check-your-plan-and-billing-details) to fix it.

You can activate billing at [this link](https://platform.openai.com/account/billing/overview). Make sure to add a payment method if not under an active grant from OpenAI.

### GigaChat Issues

#### Authentication errors

If you encounter authentication issues with GigaChat:
1. Verify your API key is correct
2. Ensure your GigaChat account has proper access rights
3. Check that your credentials haven't expired

#### Rate limiting

GigaChat has its own rate limiting. If you encounter 429 errors:
1. Wait a few moments before retrying
2. Check your usage quotas in the Developer Console

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
