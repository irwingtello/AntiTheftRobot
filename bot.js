const express = require('express');
const axios = require('axios');
require('dotenv').config();
const {
  InteractionType,
  InteractionResponseType,
  verifyKeyMiddleware
} = require('discord-interactions/dist');

const app = express();

const BOT_TOKEN = process.env.BOT_TOKEN;
const QUICKNODE_RPC_URL = process.env.QUICKNODE_RPC_URL;
const CLIENT_PUBLIC_KEY = process.env.CLIENT_PUBLIC_KEY;

app.post('/interactions', verifyKeyMiddleware(CLIENT_PUBLIC_KEY), async (req, res) => {
  const message = req.body;

  if (message.type === InteractionType.APPLICATION_COMMAND) {
    try{
        const wallet = message.data.options[0].value;
        const chain = message.data.options[1].value;
        const body = {
          wallet:wallet,
          chain:chain,
          channel_id: message.channel_id
        };

        const config = {
          headers: {
            'Content-Type': 'application/json'
          }
        };

        switch (message.data.name.toLowerCase()) {
          case 'info':
            axios.post(`https://${req.headers.host}/info`, body, config);

            res.status(200).send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: 'We are working for you :)'
              }
            });
            break;
          default:
            await sendErrorMessage(message.channel_id);
            break;
        }
     }
    catch (error) {
      await sendErrorMessage(message.channel_id);
    }
  } else {
    await sendErrorMessage(message.channel_id);
  }
});

app.post('/info',express.json(), async (req, res) => {
  const { wallet,chain, channel_id } = req.body;

  try {
    const data = {
      id: 1,
      jsonrpc: '2.0',
      method: 'mt_addressRiskScore',
      params: [
        {
          address:wallet,
          chain: chain
        }
      ]
    };
 
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const response = await axios.post(QUICKNODE_RPC_URL, data, config);

    const embed = {
      title: 'Risk Assessment Result',
      fields: [
        {
          name: 'Score',
          value: response.data.result.score.toString(),
          inline: true
        },
        {
          name: 'Risk Level',
          value: response.data.result.risk_level,
          inline: true
        },
        {
          name: 'Hacking Event',
          value: response.data.result.hacking_event.toString() || 'N/A'
        },
        {
          name: 'Details',
          value: response.data.result.detail_list.join('\n') || 'N/A'
        }
      ]
    };

    const messageData = {
      content: 'Built by irwing@dfhcommunity.com',
      embeds: [embed]
    };
   
    await sendMessage(channel_id, messageData);

    res.status(200).send({
      data: {
        content: 'OK'
      }
    });
  } catch (error) {
    await sendErrorMessage(channel_id);
  }
});

async function sendErrorMessage(channelId) {
  const messageData = {
    content: 'Built by irwing@dfhcommunity.com',
    embeds: [
      {
        title: 'Houston we have a problem :(',
        description: 'No information available'
      }
    ]
  };
  await sendMessage(channelId, messageData);
}

async function sendMessage(channelId, data) {
  try {
    const config = {
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };
    await axios.post(`https://discord.com/api/v8/channels/${channelId}/messages`, data, config);
  } catch (error) {
    console.error('Failed to send message:', error);
  }
}

const port = 3000; // Choose a port number

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
