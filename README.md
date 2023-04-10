<h2 align="center">
   <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://cdn.builder.io/api/v1/image/assets%2FYJIGb4i01jvw0SRdL5Bt%2Fb5b9997cec2c4fffb3e5c5e9bb4fed7d">
      <img width="300" alt="AI Shell logo" src="[https://user-images.githubusercontent.com/844291/230786555-a58479e4-75f3-4222-a6eb-74c5af953eac.png](https://cdn.builder.io/api/v1/image/assets%2FYJIGb4i01jvw0SRdL5Bt%2Fb7f9d2d9911a4199a9d26f8ba210b3f8)">
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
   Inspired by the <a href="https://githubnext.com/projects/copilot-cli">Github Copilot X CLI</a>, but open source for everyone.
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
   ai-shell config set OPENAI_KEY=<your token>
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

You can disable and skip the explanation section by using the flag `-s` or `--silent`

```
ai -s list all log files
```

or save the option as a preference using this command:

```bash
ai-shell config set SILENT_MODE=true
```

### Special characters

Note that some shells handle certain characters like the `?` or `*` or things that look like file paths specially. If you are getting strange behaviors, you can wrap the prompt in quotes to avoid issues, like below:

```bash
ai 'what is my ip address'
```

### Upgrading

Check the installed version with:

```bash
ai-shell --version
```

If it's not the [latest version](https://github.com/BuilderIO/ai-shell/tags), run:

```bash
npm update -g @builder.io/ai-shell
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

- Thanks to Github Copilot for their amazing tools and the idea for this
- Thanks to Hassan and his work on [aicommits](https://github.com/Nutlope/aicommits) which inspired the workflow and some parts of the code and flows

## Community

Come join the [Builder.io discord](https://discord.gg/EMx6e58xnw) and chat with us in the #ai-shell-general room

<br><br>

<p align="center">
   <a href="https://www.builder.io/m/developers">
      <picture>
         <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/844291/230786554-eb225eeb-2f6b-4286-b8c2-535b1131744a.png">
         <img width="250" alt="Made with love by Builder.io" src="https://user-images.githubusercontent.com/844291/230786555-a58479e4-75f3-4222-a6eb-74c5af953eac.png">
       </picture>
   </a>
</p>
