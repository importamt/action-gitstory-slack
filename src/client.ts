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

    const isNewBranch =
      this.beforeRef === '0000000000000000000000000000000000000000';
    const gitLogResult = execSync(
      `git log ${this.beforeRef && !isNewBranch ? `${this.beforeRef}..HEAD` : ''} --pretty=format:"%h##%an##%s##%d##%ae" -30`
    ).toString();
    const commits = gitLogResult.split('\n').map((line) => {
      const [hash, author, message, refs, email] = line.split('##');
      const tags = refs.match(/tag: ([^,)]+)/g);
      return { hash, author, message, tags, email };
    });

    const now = new Date();

    // YYYY.MM.DD HH:mm
    const zeroPad = (num: number) => num.toString().padStart(2, '0');
    const today = `${now.getFullYear()}.${zeroPad(now.getMonth() + 1)}.${zeroPad(now.getDate())} ${zeroPad(now.getHours())}:${zeroPad(now.getMinutes())}`;

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
              text: `Repo: ${this.repositoryName}\nBranch: ${this.branchName}\nDate: ${today} \nBy: ${commits[0].author}`,
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
              text: isNewBranch
                ? 'A new branch has been created :star2:'
                : commits
                    .map((commit) => {
                      const githubCommitUrl = `https://github.com/${this.repositoryName}/commit/`;

                      return `${commit.message} (<${githubCommitUrl + commit.hash}|${commit.hash}> - ${commit.author})`;
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
