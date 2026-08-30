import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
//import { OpenAIEmbeddings } from "@langchain/openai";
// 1. 修改导入语句：从 community 包中引入 ZhipuAIEmbeddings
import { ZhipuAIEmbeddings } from "@langchain/community/embeddings/zhipuai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

// 加载环境变量
dotenv.config({ path: ".env.local" });

// 初始化 Supabase 客户端
const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    console.log("🚀 开始处理文档...");

    // 1. 读取本地文件 (你可以随便找个 .md 文件放在项目根目录测试，比如 README.md)
    const filePath = path.resolve(process.cwd(), "README.md");
    if (!fs.existsSync(filePath)) {
        console.error("❌ 找不到文件:", filePath);
        return;
    }
    const rawText = fs.readFileSync(filePath, "utf-8");
    console.log(`📄 读取文件成功，长度: ${rawText.length} 字符`);

    // 2. 文本切片 (Chunking)
    // 每个块 500 字符，重叠 50 字符，保证上下文连贯
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 50,
    });
    const docs = await splitter.createDocuments([rawText]);
    console.log(`✂️ 切片完成，共 ${docs.length} 个块`);

    // 3. 生成向量并存入 Supabase
    console.log("🧠 正在生成向量并写入数据库 (这可能需要几秒钟)...");

    // 使用 LangChain 的 SupabaseVectorStore
    // 它会自动调用 OpenAI API 生成 embedding，并插入到 document_embeddings 表
    await SupabaseVectorStore.fromDocuments(
        docs,
        new ZhipuAIEmbeddings({ modelName: "embedding-3" }), // 使用最新的 small 模型，便宜且快
        {
            client: supabaseClient,
            tableName: "document_embeddings",
            queryName: "match_documents", // 对应刚才 SQL 里创建的函数
        }
    );

    console.log("✅ 成功！文档已存入向量数据库。");
}

main().catch(console.error);