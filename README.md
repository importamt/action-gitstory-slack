# action-gitstory-slack

## What is this?

GitHub action for notifying to slack when pushed or merged to the repository.

Gitstory means `Git + History` 😅

## How to use?

### 1. Create a slack app

Create a slack app and get the webhook url.

### 2. Add secrets to your repository

Add the webhook url to your repository secrets.

### 3. Create a workflow file

Create a workflow file in your repository.

```yaml
name: Slack Notification

on:
  push:
    branches:
      - master
  pull_request:
    types: [closed]

jobs:
  slack_notification:
    runs-on: ubuntu-latest
    steps:
      - name: Notify to slack
        uses: importamt/action-gitstory-slack@v1
        env:
          # generate secret in the repository settings
          WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }} 
          BEFORE_REF: ${{ github.event.before }}
```

### 4. Push to the repository

Push the workflow file to the repository.

### 5. Check the slack

Check the slack when pushed or merged to the repository.

### 6. Enjoy!

## License

MIT
