import { NextRequest } from 'next/server';
import {
    streamText,
    UIMessage,
    convertToModelMessages,
    createUIMessageStreamResponse,
    toUIMessageStream,
    ModelMessage
} from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { ZhipuAIEmbeddings } from "@langchain/community/embeddings/zhipuai";
import { createClient } from '@supabase/supabase-js';

// 1. 初始化 Supabase 客户端
const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 2. 配置智谱 AI (利用 OpenAI 兼容模式)
const zhipu = createOpenAICompatible({
    name: 'zhipu',
    baseURL: process.env.ZHIPUAI_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4/',
    apiKey: process.env.ZHIPUAI_API_KEY!
});

// 设置 API 允许的最大执行时间 (防止流式输出超时)
export const maxDuration = 30;

export async function POST(req: NextRequest) {
    try {
        // 解析前端传来的消息历史
        const { messages }: { messages: UIMessage[] } = await req.json();

        // 获取用户最后一条消息
        const lastMessage = messages[messages.length - 1];

        // 更安全的提取方式
        const userQuery = lastMessage.parts
            ?.filter(part => part.type === 'text')
            .map(part => part.text)
            .join('') || '';
        //const lastMessage = messages[messages.length - 1];
        //const userQuery = lastMessage.content;

        console.log("🔍 收到用户提问:", userQuery);

        // 3. RAG 核心：从向量数据库检索相关文档
        // 复用你在 Week 1 成功使用的 ZhipuAIEmbeddings
        const vectorStore = await SupabaseVectorStore.fromExistingIndex(
            new ZhipuAIEmbeddings({
                modelName: "embedding-3", // 或 "embedding-2" 根据你的实际可用模型
                apiKey: process.env.ZHIPUAI_API_KEY
            }),
            {
                client: supabaseClient,
                tableName: 'document_embeddings',
                queryName: 'match_documents',
            }
        );

        // 搜索最相关的 3 个文档片段
        const relevantDocs = await vectorStore.similaritySearch(userQuery, 3);

        // 将检索到的文档内容拼接成字符串
        const context = relevantDocs.map((doc, index) =>
            `[参考片段 ${index + 1}]:\n${doc.pageContent}`
        ).join('\n\n');

        // 4. 构建 System Prompt (给 AI 设定规则和背景知识)
        const systemPrompt = `你是一个专业的 AI 文档助手。
请严格根据以下提供的【参考文档】来回答用户的问题。
如果【参考文档】中没有包含回答问题所需的信息，请直接回答：“抱歉，我在当前文档中没有找到相关信息。”，不要编造答案。

【参考文档】:
${context}
`;
        // ✅ 转换为 ModelMessage（v5/v6 的标准格式）
        const modelMessages: ModelMessage[] = await convertToModelMessages(messages);
        // 5. 调用智谱大模型并开启流式输出 (Streaming)
        // 使用 glm-4-flash (速度极快，适合 RAG) 或 glm-4 (更聪明)
        const result = streamText({
            model: zhipu('glm-4-flash'),
            system: systemPrompt,
            messages: modelMessages, // 传入完整的历史消息，让 AI 拥有上下文记忆
        });

        // 6. 将结果转换为 Next.js 兼容的流式响应返回给前端
        return createUIMessageStreamResponse({
            stream: toUIMessageStream({ stream: result.stream }),
        });

    } catch (error) {
        1
        console.error("❌ API 错误:", error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}