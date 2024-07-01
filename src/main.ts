import Client from './client';

const run = () => {
  const webhookUrl = process.env.WEBHOOK_URL;
  const repositoryName = process.env.GITHUB_REPOSITORY;
  const branchName = process.env.GITHUB_REF_NAME;
  const beforeRef = process.env.BEFORE_REF;

  const client = new Client({
    webhookUrl,
    beforeRef,
    repositoryName,
    branchName,
  });

  client.send();
};

run();
