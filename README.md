Clone the repository:
git clone https://github.com/krazedegen/EverHostBot.git

Navigate to the project directory:
cd EverHostBot

Copy the .env.sample file and rename it to .env. Fill in the required environment variables:
cp .env.sample .env
TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_TOKEN=YOUR_TELEGRAM_CHAT_TOKEN

Install dependencies:
npm install

To start the bot:
node index.js

I use pm2 to run it in the background, you can do this or use screen.
