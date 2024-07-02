import { execSync } from 'node:child_process';

interface ClientOptions {
  webhookUrl?: string;
  repositoryName?: string;
  branchName?: string;
  beforeRef?: string;
}

class Client {
  private readonly webhookUrl?: string;
  private readonly repositoryName?: string;
  private readonly branchName?: string;
  private readonly beforeRef?: string;

  constructor({
    webhookUrl,
    repositoryName,
    branchName,
    beforeRef,
  }: ClientOptions) {
    this.webhookUrl = webhookUrl;
    this.repositoryName = repositoryName;
    this.branchName = branchName;
    this.beforeRef = beforeRef;
  }

  private getSlackUserIdFromEmail(email: string) {
    return email.split('@')[0];
  }

  send() {
    if (!this.webhookUrl) {
      console.error('webhookUrl is required');
      return;
    }

    // git init
    execSync('git --version');
    execSync('git config user.name "github-actions[bot]"');
    execSync('git config user.email "<>"');
    execSync('git status');

    const gitLogResult = execSync(
      `git log ${this.beforeRef ? `${this.beforeRef}..HEAD` : ''} --pretty=format:"%h##%an##%s##%d##%ae" -30`
    ).toString();
    const commits = gitLogResult.split('\n').map((line) => {
      const [hash, author, message, refs, email] = line.split('##');
      const tags = refs.match(/tag: ([^,)]+)/g);
      return { hash, author, message, tags, email };
    });

    const deployer = this.getSlackUserIdFromEmail(commits[0].email);

    const now = new Date();
    // YYYY.MM.DD HH:mm
    const today = `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()} ${now.getHours()}:${now.getMinutes()}`;

    const body = {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*[${this.branchName}]* has been updated :rocket:`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'plain_text',
              text: `Date: ${today} :rocket:\nBy: <@${deployer}>`,
              emoji: true,
            },
          ],
        },
        {
          type: 'divider',
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: commits
                .map((commit) => {
                  const githubCommitUrl = `https://github.com/${this.repositoryName}/commit/`;

                  return `${commit.message} <${githubCommitUrl + commit.hash}|${commit.hash}> <@${this.getSlackUserIdFromEmail(
                    commit.email
                  )}>`;
                })
                .join('\n'),
            },
          ],
        },
      ],
    };

    fetch(this.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...body,
      }),
    })
      .then((fetchResponse) => {
        return fetchResponse.text();
      })
      .then((text) => {
        console.log('slack response', text);
      });
  }
}

export default Client;
