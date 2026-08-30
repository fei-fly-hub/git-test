export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        欢迎来到 Unitree AI 助手演示
      </h1>
      <p className="text-lg text-gray-600 max-w-2xl">
        这是一个基于 Next.js + 智谱 AI + Supabase 构建的 RAG 应用。
        <br />
        请点击右下角的蓝色图标，开始与我对话！
      </p>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-2"> 文档解析</h3>
          <p className="text-sm text-gray-500">自动读取 Markdown/PDF 并切片。</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-2">🧠 智能检索</h3>
          <p className="text-sm text-gray-500">基于向量数据库的语义搜索。</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-2"> 极速响应</h3>
          <p className="text-sm text-gray-500">智谱 AI 流式输出，毫秒级响应。</p>
        </div>
      </div>
    </div>
  );
}