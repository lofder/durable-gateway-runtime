import { Client } from '@larksuiteoapi/node-sdk';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import OpenAI from 'openai';

// Initialize Lark (Feishu) Client
const client = new Client({
  appId: process.env.FEISHU_APP_ID || '',
  appSecret: process.env.FEISHU_APP_SECRET || '',
});

// Initialize OpenAI Client for Text
const aiSdkOpenai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

// Initialize OpenAI Client for Images
const pureOpenai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Handle URL Verification Challenge from Feishu
    // When configuring the webhook URL in Feishu developer console, it sends a challenge
    if (body.type === 'url_verification') {
      return Response.json({ challenge: body.challenge });
    }

    // 2. Security Check: Validate Verification Token
    // In production, you should verify this token matches process.env.FEISHU_VERIFICATION_TOKEN
    const expectedToken = process.env.FEISHU_VERIFICATION_TOKEN;
    const token = body.token || (body.header && body.header.token);
    if (expectedToken && token !== expectedToken) {
      return Response.json({ error: 'Invalid Token' }, { status: 403 });
    }

    // 3. Handle incoming message event
    // For V2 schema events
    if (body.schema === '2.0' && body.header.event_type === 'im.message.receive_v1') {
      const event = body.event;
      const message = event.message;

      // We only handle text messages for now
      if (message.message_type === 'text') {
        // The content is a JSON string containing the text
        let userText = '';
        try {
          const contentObj = JSON.parse(message.content);
          userText = contentObj.text;
        } catch (e) {
          userText = message.content;
        }

        // Clean up the text (e.g. remove @bot mentions if any)
        userText = userText.replace(/@_user_[a-zA-Z0-9_-]+/g, '').trim();

        // 4. Acknowledge to Feishu immediately to prevent timeout retries
        // Feishu requires a response within 3 seconds. Since AI might take longer,
        // we should conceptually process it asynchronously.
        
        // Start processing in background (fire and forget for this basic implementation)
        processAiMessageAndReply(userText, message.message_id);

        return Response.json({ code: 0, msg: 'success' });
      }
    }

    // Acknowledge any other events safely
    return Response.json({ code: 0, msg: 'event ignored' });

  } catch (error) {
    console.error('Feishu API Error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Background function to call AI and send the reply back to Feishu
async function processAiMessageAndReply(prompt: string, messageId: string) {
  try {
    const text = prompt.trim();
    
    // Detect image models
    let imageModel = null;
    if (/^(SD画|SD生成|stable diffusion|sd )/i.test(text)) {
      imageModel = "stable-diffusion";
    } else if (/^(MJ画|MJ生成|midjourney|mj )/i.test(text)) {
      imageModel = "midjourney";
    } else if (/^(画|帮我画|绘制|生成图片|draw|generate image)/i.test(text)) {
      imageModel = "dall-e-3";
    }

    if (imageModel) {
      // 1. Call OpenAI Image Generation API
      const response = await pureOpenai.images.generate({
        model: imageModel,
        prompt: text,
        n: 1,
        size: "1024x1024",
      });

      const imageUrl = response.data?.[0]?.url;

      if (!imageUrl) {
        throw new Error(`No image URL returned from model: ${imageModel}`);
      }

      // 2. Reply to the Feishu message with the image URL
      await client.im.message.reply({
        path: {
          message_id: messageId,
        },
        data: {
          content: JSON.stringify({ 
            text: `[${imageModel}] 图片已生成完毕，请点击链接查看或下载：\n${imageUrl}` 
          }),
          msg_type: 'text',
        },
      });

    } else {
      // 1. Call OpenAI / GPT-4o for Text
      const result = await generateText({
        model: aiSdkOpenai('gpt-4o'),
        messages: [{ role: 'user', content: prompt }],
      });

      const aiResponse = result.text;

      // 2. Reply to the specific Feishu message
      await client.im.message.reply({
        path: {
          message_id: messageId,
        },
        data: {
          content: JSON.stringify({ text: aiResponse }),
          msg_type: 'text',
        },
      });
    }
    
  } catch (error: any) {
    console.error('Failed to process AI or send Feishu reply:', error);
    try {
      // Send error message to user
      const errorMsg = error?.message || '抱歉，AI 处理过程中遇到了点问题，请稍后再试。';
      await client.im.message.reply({
        path: { message_id: messageId },
        data: {
          content: JSON.stringify({ text: `处理失败: ${errorMsg}` }),
          msg_type: 'text',
        },
      });
    } catch (e) {
      console.error('Failed to send error reply:', e);
    }
  }
}
