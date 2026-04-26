import type {
  MarketCategory,
  MarketPackage,
  MarketPackageDefinition,
} from "../models/market";
import type { SkillBundle } from "../models/skill";

const packageDefinitions: MarketPackageDefinition[] = [
  {
    id: "browser-tools",
    slug: "browser-tools",
    name: "Browser Tools",
    summary: "浏览器自动化、页面验证与交互抓取工具集合。",
    description:
      "这组 package 聚焦浏览器自动化和页面交互，适合前端调试、流程回归、截图抓取和 Agent 浏览器操作。",
    primaryCategory: "automation",
    publisher: { name: "SkillHub Curated", type: "community" },
    icon: {
      monogram: "B",
      accent: "#2563EB",
      surface: "#E8F1FF",
      foreground: "#1D4ED8",
    },
    prompts: [
      "Open this localhost flow and capture the broken state",
      "Automate this browser workflow and extract the result",
      "Inspect the page and verify the expected UI appears",
    ],
    links: {
      source: "https://skillhub.cn/skills/browser-use",
    },
    members: [
      {
        id: "playwright",
        name: "Playwright",
        summary: "真实浏览器自动化与页面调试。",
        matchTerms: ["playwright"],
        skillhubSlug: "playwright",
      },
      {
        id: "browser-use",
        name: "Browser Use",
        summary: "本地浏览器导航、点击和截图操作。",
        matchTerms: ["browser use", "browser-use"],
        skillhubSlug: "browser-use",
      },
      {
        id: "agent-browser",
        name: "Agent Browser",
        summary: "CLI 风格的页面导航与抓取。",
        matchTerms: ["agent browser"],
        skillhubSlug: "agent-browser",
      },
      {
        id: "desktop-control",
        name: "Desktop Control",
        summary: "桌面交互和 GUI 控制能力。",
        matchTerms: ["desktop control"],
        skillhubSlug: "desktop-control",
      },
    ],
  },
  {
    id: "documents",
    slug: "documents",
    name: "Documents",
    summary: "Word、Excel、PPT 和 PDF 的通用文档生产线。",
    description:
      "适合把常见办公文档处理能力一次性装齐，覆盖 docx、xlsx、pptx 和 PDF 工作流。",
    primaryCategory: "docs",
    publisher: { name: "SkillHub Curated", type: "community" },
    icon: {
      monogram: "D",
      accent: "#2563EB",
      surface: "#E9F2FF",
      foreground: "#2563EB",
    },
    prompts: [
      "Create a polished docx summary from these notes",
      "Turn this spreadsheet into a chart-driven report",
      "Build a slide deck from the latest product update",
    ],
    links: {
      source: "https://skillhub.cn/skills/word-docx",
    },
    members: [
      {
        id: "word-docx",
        name: "Word / DOCX",
        summary: "生成、编辑与导出 docx 文档。",
        matchTerms: ["word / docx", "documents", "word-docx"],
        skillhubSlug: "word-docx",
      },
      {
        id: "excel-xlsx",
        name: "Excel / XLSX",
        summary: "表格分析、公式、图表与导出。",
        matchTerms: ["excel / xlsx", "spreadsheets", "excel-xlsx"],
        skillhubSlug: "excel-xlsx",
      },
      {
        id: "powerpoint-pptx",
        name: "Powerpoint / PPTX",
        summary: "演示稿生成、改写与导出。",
        matchTerms: ["powerpoint / pptx", "presentations", "powerpoint-pptx"],
        skillhubSlug: "powerpoint-pptx",
      },
      {
        id: "nano-pdf",
        name: "Nano PDF",
        summary: "PDF 内容提取、整理与处理。",
        matchTerms: ["nano pdf", "pdf", "nano-pdf"],
        skillhubSlug: "nano-pdf",
      },
    ],
  },
  {
    id: "search-research",
    slug: "search-research",
    name: "Search & Research",
    summary: "搜索、摘要和研究信息整理的一组通用能力。",
    description:
      "这一包偏信息获取和二次整理，适合检索网页、做多搜索源整合、抓取新闻与摘要输出。",
    primaryCategory: "research",
    publisher: { name: "SkillHub Curated", type: "community" },
    icon: {
      monogram: "R",
      accent: "#7C3AED",
      surface: "#F3ECFF",
      foreground: "#7C3AED",
    },
    prompts: [
      "Search the web from multiple sources and compare results",
      "Summarize the linked articles into a concise briefing",
      "Pull the latest news and extract the key changes",
    ],
    links: {
      source: "https://skillhub.cn/skills/summarize",
    },
    members: [
      {
        id: "summarize",
        name: "Summarize",
        summary: "总结网页、PDF、图片和音视频内容。",
        matchTerms: ["summarize"],
        skillhubSlug: "summarize",
      },
      {
        id: "multi-search-engine",
        name: "Multi Search Engine",
        summary: "多搜索源检索与结果整合。",
        matchTerms: ["multi search engine", "multi-search-engine"],
        skillhubSlug: "multi-search-engine",
      },
      {
        id: "brave-search",
        name: "Brave Search",
        summary: "网页检索与引用整理。",
        matchTerms: ["brave search", "brave-search"],
        skillhubSlug: "brave-search",
      },
      {
        id: "baidu-search",
        name: "Baidu Search",
        summary: "中文搜索场景的检索能力。",
        matchTerms: ["baidu search", "baidu-search"],
        skillhubSlug: "baidu-search",
      },
      {
        id: "news-summary",
        name: "News Summary",
        summary: "新闻汇总和提炼。",
        matchTerms: ["news summary", "news-summary"],
        skillhubSlug: "news-summary",
      },
    ],
  },
  {
    id: "knowledge-memory",
    slug: "knowledge-memory",
    name: "Knowledge & Memory",
    summary: "知识库、笔记管理与长期记忆相关的一组工作流。",
    description:
      "适合需要沉淀资料、维护知识库和长期记忆的场景，兼顾个人笔记和 Agent 上下文管理。",
    primaryCategory: "productivity",
    publisher: { name: "SkillHub Curated", type: "community" },
    icon: {
      monogram: "K",
      accent: "#111111",
      surface: "#F4F4F5",
      foreground: "#111111",
    },
    prompts: [
      "Turn these notes into a structured knowledge entry",
      "Search the knowledge base for related decisions",
      "Store the important facts from this session for later reuse",
    ],
    links: {
      source: "https://skillhub.cn/skills/notion",
    },
    members: [
      {
        id: "notion",
        name: "Notion",
        summary: "页面、数据库和知识协作。",
        matchTerms: ["notion"],
        skillhubSlug: "notion",
      },
      {
        id: "obsidian",
        name: "Obsidian",
        summary: "本地笔记和知识图谱工作流。",
        matchTerms: ["obsidian"],
        skillhubSlug: "obsidian",
      },
      {
        id: "byterover",
        name: "ByteRover",
        summary: "知识管理和资料整合工具。",
        matchTerms: ["byterover"],
        skillhubSlug: "byterover",
      },
      {
        id: "agent-memory",
        name: "Agent Memory",
        summary: "持久记忆、事实存储和跨会话上下文。",
        matchTerms: ["agent memory", "agent-memory"],
        skillhubSlug: "agent-memory",
      },
    ],
  },
  {
    id: "data-analysis",
    slug: "data-analysis",
    name: "Data Analysis",
    summary: "表格分析、业务数据解读与股票分析工具集合。",
    description:
      "适合快速做 CSV / xlsx 分析和图表输出，也覆盖部分金融数据的分析模板。",
    primaryCategory: "data",
    publisher: { name: "SkillHub Curated", type: "community" },
    icon: {
      monogram: "DA",
      accent: "#0F766E",
      surface: "#E6FFFB",
      foreground: "#0F766E",
    },
    prompts: [
      "Analyze this CSV and surface the main outliers",
      "Build a quick chart pack for this spreadsheet",
      "Explain the likely drivers behind this trend break",
    ],
    links: {
      source: "https://skillhub.cn/skills/data-analysis",
    },
    members: [
      {
        id: "data-analysis",
        name: "Data Analysis",
        summary: "通用数据分析与解释。",
        matchTerms: ["data analysis", "data-analysis"],
        skillhubSlug: "data-analysis",
      },
      {
        id: "stock-analysis",
        name: "Stock Analysis",
        summary: "金融和行情类分析模板。",
        matchTerms: ["stock analysis", "stock-analysis"],
        skillhubSlug: "stock-analysis",
      },
      {
        id: "excel-xlsx",
        name: "Excel / XLSX",
        summary: "面向表格数据的分析和可视化。",
        matchTerms: ["excel / xlsx", "excel-xlsx"],
        skillhubSlug: "excel-xlsx",
      },
    ],
  },
  {
    id: "design-studio",
    slug: "design-studio",
    name: "Design Studio",
    summary: "Figma、截图批注、视觉生成与界面走查的轻量设计包。",
    description:
      "偏向产品和设计协作，适合做视觉参考、界面审查、简单出图和评审前整理。",
    primaryCategory: "design",
    publisher: { name: "Mirror Curated", type: "mirror" },
    icon: {
      monogram: "DS",
      accent: "#DB2777",
      surface: "#FDF2F8",
      foreground: "#BE185D",
    },
    prompts: [
      "Review this screen and point out the main visual issues",
      "Generate a quick visual reference for this feature idea",
      "Organize these screenshots into a clearer design handoff",
    ],
    links: {
      website: "https://skillsmp.com/zh",
      source:
        "https://skillsmp.com/zh/occupations/arts-design-entertainment-sports-and-media-occupations",
    },
    members: [
      {
        id: "figma",
        name: "Figma",
        summary: "设计稿、组件和评审协作。",
        matchTerms: ["figma"],
      },
      {
        id: "imagegen",
        name: "Image Generation",
        summary: "视觉参考图、封面图和素材生成。",
        matchTerms: ["image generation", "imagegen", "image gen"],
      },
      {
        id: "screenshot",
        name: "Screenshot Review",
        summary: "截图采集、标注和对比。",
        matchTerms: ["screenshot", "screen capture"],
      },
      {
        id: "ui-audit",
        name: "UI Audit",
        summary: "界面一致性和可用性走查。",
        matchTerms: ["ui audit", "ui review", "ui ux"],
      },
      {
        id: "canva",
        name: "Canva",
        summary: "海报、社媒图和轻量排版素材。",
        matchTerms: ["canva"],
      },
      {
        id: "framer",
        name: "Framer",
        summary: "页面原型、动画和营销页搭建。",
        matchTerms: ["framer"],
      },
      {
        id: "rive",
        name: "Rive",
        summary: "交互动效和状态动画素材。",
        matchTerms: ["rive"],
      },
      {
        id: "remotion",
        name: "Remotion",
        summary: "视频片段和动态内容生成。",
        matchTerms: ["remotion"],
      },
    ],
  },
  {
    id: "devops-cloud",
    slug: "devops-cloud",
    name: "DevOps & Cloud",
    summary: "部署、容器、云资源与线上排障相关的一组基础能力。",
    description:
      "适合处理日常发布、环境排查、容器编排和云服务巡检，定位上偏运维和平台工程。",
    primaryCategory: "operations",
    publisher: { name: "Mirror Curated", type: "mirror" },
    icon: {
      monogram: "DC",
      accent: "#0F766E",
      surface: "#ECFDF5",
      foreground: "#0F766E",
    },
    prompts: [
      "Check this deployment issue and narrow down the likely cause",
      "Review the container setup and spot risky configuration",
      "Summarize the current cloud resource layout for this service",
    ],
    links: {
      website: "https://skillsmp.com/zh",
      source: "https://skillsmp.com/zh/categories/devops",
    },
    members: [
      {
        id: "docker",
        name: "Docker",
        summary: "容器构建、镜像和运行问题处理。",
        matchTerms: ["docker"],
      },
      {
        id: "kubernetes",
        name: "Kubernetes",
        summary: "集群、服务和发布编排。",
        matchTerms: ["kubernetes", "k8s"],
      },
      {
        id: "cloudflare",
        name: "Cloudflare",
        summary: "边缘服务、Workers 和域名流量排查。",
        matchTerms: ["cloudflare"],
      },
      {
        id: "terraform",
        name: "Terraform",
        summary: "基础设施声明式管理与变更审查。",
        matchTerms: ["terraform"],
      },
      {
        id: "vercel",
        name: "Vercel",
        summary: "前端部署、域名和函数发布。",
        matchTerms: ["vercel"],
      },
      {
        id: "netlify",
        name: "Netlify",
        summary: "静态站点托管和构建流水线。",
        matchTerms: ["netlify"],
      },
      {
        id: "sentry",
        name: "Sentry",
        summary: "错误监控、告警和回溯分析。",
        matchTerms: ["sentry"],
      },
      {
        id: "grafana",
        name: "Grafana",
        summary: "指标看板和服务可观测性。",
        matchTerms: ["grafana"],
      },
    ],
  },
  {
    id: "database-toolkit",
    slug: "database-toolkit",
    name: "Database Toolkit",
    summary: "SQL、Schema、托管数据库与数据修复的通用工作包。",
    description:
      "主要覆盖库表设计、查询排查、迁移变更和常见托管数据库平台的日常处理。",
    primaryCategory: "data",
    publisher: { name: "Mirror Curated", type: "mirror" },
    icon: {
      monogram: "DB",
      accent: "#2563EB",
      surface: "#EFF6FF",
      foreground: "#1D4ED8",
    },
    prompts: [
      "Review this SQL and explain why it is slow",
      "Plan a safe schema change for this table",
      "Compare these database options for a small product backend",
    ],
    links: {
      website: "https://skillsmp.com/zh",
      source: "https://skillsmp.com/zh/categories/databases",
    },
    members: [
      {
        id: "postgres",
        name: "Postgres",
        summary: "查询、索引和 schema 设计。",
        matchTerms: ["postgres", "postgresql"],
      },
      {
        id: "mysql",
        name: "MySQL",
        summary: "事务、表结构和性能排查。",
        matchTerms: ["mysql"],
      },
      {
        id: "sqlite",
        name: "SQLite",
        summary: "本地数据库和嵌入式数据处理。",
        matchTerms: ["sqlite"],
      },
      {
        id: "supabase",
        name: "Supabase",
        summary: "托管 Postgres、Auth 和边车能力。",
        matchTerms: ["supabase"],
      },
      {
        id: "neon",
        name: "Neon",
        summary: "Serverless Postgres 和分支库流程。",
        matchTerms: ["neon", "neon postgres"],
      },
      {
        id: "redis",
        name: "Redis",
        summary: "缓存、队列和临时数据处理。",
        matchTerms: ["redis"],
      },
      {
        id: "planetscale",
        name: "PlanetScale",
        summary: "托管 MySQL 与 schema 变更审核。",
        matchTerms: ["planetscale", "planet scale"],
      },
    ],
  },
  {
    id: "product-ops",
    slug: "product-ops",
    name: "Product Ops",
    summary: "需求流转、任务协作、消息同步和项目推进相关的效率包。",
    description:
      "适合产品、项目和跨团队协作场景，用来整理需求、同步消息、追踪任务和落地排期。",
    primaryCategory: "productivity",
    publisher: { name: "Mirror Curated", type: "mirror" },
    icon: {
      monogram: "PO",
      accent: "#7C3AED",
      surface: "#F5F3FF",
      foreground: "#6D28D9",
    },
    prompts: [
      "Turn this discussion into a clear task list with owners",
      "Summarize the latest project updates into an exec brief",
      "Sync these product notes into the current planning board",
    ],
    links: {
      website: "https://skillsmp.com/zh",
      source: "https://skillsmp.com/zh/categories/business",
    },
    members: [
      {
        id: "linear",
        name: "Linear",
        summary: "缺陷、迭代和项目跟踪。",
        matchTerms: ["linear"],
      },
      {
        id: "jira",
        name: "Jira",
        summary: "需求流、工单和流程编排。",
        matchTerms: ["jira"],
      },
      {
        id: "slack",
        name: "Slack",
        summary: "频道消息整理和状态同步。",
        matchTerms: ["slack"],
      },
      {
        id: "email-ops",
        name: "Email Ops",
        summary: "邮件摘要、归档和跟进提醒。",
        matchTerms: ["email", "gmail", "mail"],
      },
      {
        id: "airtable",
        name: "Airtable",
        summary: "轻数据库、运营表和流程协同。",
        matchTerms: ["airtable"],
      },
      {
        id: "clickup",
        name: "ClickUp",
        summary: "任务、文档和团队协作管理。",
        matchTerms: ["clickup", "click up"],
      },
      {
        id: "coda",
        name: "Coda",
        summary: "文档表格混合工作流和项目协同。",
        matchTerms: ["coda"],
      },
      {
        id: "confluence",
        name: "Confluence",
        summary: "团队知识库和项目文档沉淀。",
        matchTerms: ["confluence"],
      },
      {
        id: "google-drive",
        name: "Google Drive",
        summary: "共享文件、协作文档和目录整理。",
        matchTerms: ["google drive", "drive"],
      },
      {
        id: "asana",
        name: "Asana",
        summary: "项目推进、里程碑和跨团队任务跟踪。",
        matchTerms: ["asana"],
      },
    ],
  },
  {
    id: "content-seo",
    slug: "content-seo",
    name: "Content & SEO",
    summary: "博客、SEO、社媒文案和增长素材的一组内容生产包。",
    description:
      "偏内容运营和增长场景，适合整理选题、生成初稿、做搜索优化和多平台改写。",
    primaryCategory: "docs",
    publisher: { name: "Mirror Curated", type: "mirror" },
    icon: {
      monogram: "CS",
      accent: "#EA580C",
      surface: "#FFF7ED",
      foreground: "#C2410C",
    },
    prompts: [
      "Draft an SEO-friendly article outline for this keyword",
      "Rewrite this launch copy for email, blog and social channels",
      "Turn these rough notes into a publishable content brief",
    ],
    links: {
      website: "https://skillsmp.com/zh",
      source: "https://skillsmp.com/zh/categories/content-media",
    },
    members: [
      {
        id: "seo",
        name: "SEO",
        summary: "关键词、标题和页面优化建议。",
        matchTerms: ["seo", "search engine optimization"],
      },
      {
        id: "blog-writing",
        name: "Blog Writing",
        summary: "博客初稿、结构和润色。",
        matchTerms: ["blog writing", "blog writer"],
      },
      {
        id: "newsletter",
        name: "Newsletter",
        summary: "邮件内容编排和周报整理。",
        matchTerms: ["newsletter"],
      },
      {
        id: "social-content",
        name: "Social Content",
        summary: "社媒短文案和分发改写。",
        matchTerms: ["social content", "social media", "xiaohongshu"],
      },
      {
        id: "youtube",
        name: "YouTube",
        summary: "视频脚本、标题和简介整理。",
        matchTerms: ["youtube"],
      },
      {
        id: "substack",
        name: "Substack",
        summary: "订阅内容排版和长期栏目运营。",
        matchTerms: ["substack"],
      },
    ],
  },
  {
    id: "saas-infrastructure",
    slug: "saas-infrastructure",
    name: "SaaS Infrastructure",
    summary: "认证、支付、预约、邮件和用户通知的常用服务包。",
    description:
      "更偏 SaaS 产品的基础设施拼装，适合处理注册登录、支付链路、预约安排和事务型通知。",
    primaryCategory: "coding",
    publisher: { name: "Mirror Curated", type: "mirror" },
    icon: {
      monogram: "SI",
      accent: "#2563EB",
      surface: "#EFF6FF",
      foreground: "#1D4ED8",
    },
    prompts: [
      "Design the basic service stack for this SaaS product",
      "Compare auth, billing and notification options for a small team",
      "Review this signup-to-payment flow and find the weak points",
    ],
    links: {
      website: "https://skillsmp.com/zh",
      source: "https://skillsmp.com/zh/categories/business",
    },
    members: [
      {
        id: "clerk",
        name: "Clerk",
        summary: "身份认证、组织和会话管理。",
        matchTerms: ["clerk"],
      },
      {
        id: "auth0",
        name: "Auth0",
        summary: "第三方登录和企业身份集成。",
        matchTerms: ["auth0", "auth 0"],
      },
      {
        id: "stripe",
        name: "Stripe",
        summary: "支付、订阅和账单流程。",
        matchTerms: ["stripe"],
      },
      {
        id: "cal-com",
        name: "Cal.com",
        summary: "预约排程和会议时间管理。",
        matchTerms: ["cal.com", "cal com", "cal"],
      },
      {
        id: "resend",
        name: "Resend",
        summary: "事务邮件和通知发送。",
        matchTerms: ["resend"],
      },
      {
        id: "intercom",
        name: "Intercom",
        summary: "用户消息、客服和触达流程。",
        matchTerms: ["intercom"],
      },
    ],
  },
  {
    id: "ai-dev-stack",
    slug: "ai-dev-stack",
    name: "AI Dev Stack",
    summary: "Cursor、Windsurf、CodeRabbit 和新一代 AI 编码流的组合包。",
    description:
      "偏向 AI 原生开发工作流，适合代码生成、评审、补全和以 Agent 为核心的工程协作。",
    primaryCategory: "coding",
    publisher: { name: "Mirror Curated", type: "mirror" },
    icon: {
      monogram: "AI",
      accent: "#4F46E5",
      surface: "#EEF2FF",
      foreground: "#4338CA",
    },
    prompts: [
      "Compare the current AI coding tools for this workflow",
      "Set up an AI-heavy review and implementation loop",
      "Decide which coding assistant fits this team best",
    ],
    links: {
      website: "https://skillsmp.com/zh",
      source: "https://skillsmp.com/zh/categories/development",
    },
    members: [
      { id: "cursor", name: "Cursor", summary: "AI 原生编辑器和编程协作。", matchTerms: ["cursor"] },
      { id: "windsurf", name: "Windsurf", summary: "Agent 驱动的代码工作流。", matchTerms: ["windsurf"] },
      { id: "cody", name: "Cody", summary: "代码检索、解释和补全。", matchTerms: ["cody"] },
      { id: "coderabbit", name: "CodeRabbit", summary: "PR 审查和变更风险提示。", matchTerms: ["coderabbit", "code rabbit"] },
      { id: "augment", name: "Augment", summary: "上下文增强型代码助手。", matchTerms: ["augment"] },
      { id: "aider", name: "Aider", summary: "终端里的 AI 配对编程。", matchTerms: ["aider"] },
    ],
  },
  {
    id: "frontend-stack",
    slug: "frontend-stack",
    name: "Frontend Stack",
    summary: "React、Next.js、Tailwind 和现代前端生产流的常用组合。",
    description:
      "聚焦 UI 实现和 Web 应用落地，适合做组件开发、页面搭建、SSR 和样式体系整理。",
    primaryCategory: "coding",
    publisher: { name: "Mirror Curated", type: "mirror" },
    icon: {
      monogram: "FE",
      accent: "#0284C7",
      surface: "#EFF6FF",
      foreground: "#0369A1",
    },
    prompts: [
      "Choose a frontend stack for this product",
      "Refactor this UI flow with a cleaner component structure",
      "Compare the tradeoffs between these frontend frameworks",
    ],
    links: {
      website: "https://skillsmp.com/zh",
      source: "https://skillsmp.com/zh/categories/development",
    },
    members: [
      { id: "react", name: "React", summary: "组件化 UI 与交互实现。", matchTerms: ["react"] },
      { id: "nextjs", name: "Next.js", summary: "SSR、路由和全栈页面应用。", matchTerms: ["next.js", "nextjs", "next js"] },
      { id: "tailwind", name: "Tailwind", summary: "原子化样式和设计系统搭建。", matchTerms: ["tailwind", "tailwindcss"] },
      { id: "vue", name: "Vue", summary: "响应式前端开发和组件封装。", matchTerms: ["vue"] },
      { id: "svelte", name: "Svelte", summary: "轻量前端和交互式页面。", matchTerms: ["svelte"] },
      { id: "astro", name: "Astro", summary: "内容站点与静态站生成。", matchTerms: ["astro"] },
    ],
  },
  {
    id: "commerce-growth",
    slug: "commerce-growth",
    name: "Commerce & Growth",
    summary: "Shopify、Klaviyo、Stripe 与增长链路搭建的一组商业化工具。",
    description:
      "面向独立站和商业化场景，适合处理电商搭建、支付、邮件触达和转化优化。",
    primaryCategory: "coding",
    publisher: { name: "Mirror Curated", type: "mirror" },
    icon: {
      monogram: "CG",
      accent: "#059669",
      surface: "#ECFDF5",
      foreground: "#047857",
    },
    prompts: [
      "Design a simple commerce stack for this product",
      "Compare payment and growth tooling for a small team",
      "Review the purchase funnel and find the biggest drop-offs",
    ],
    links: {
      website: "https://skillsmp.com/zh",
      source: "https://skillsmp.com/zh/categories/business",
    },
    members: [
      { id: "shopify", name: "Shopify", summary: "商品、订单和店铺运营流程。", matchTerms: ["shopify"] },
      { id: "klaviyo", name: "Klaviyo", summary: "营销邮件和用户触达自动化。", matchTerms: ["klaviyo"] },
      { id: "mailchimp", name: "Mailchimp", summary: "邮件活动和用户分群。", matchTerms: ["mailchimp", "mail chimp"] },
      { id: "stripe", name: "Stripe", summary: "支付、账单和订阅处理。", matchTerms: ["stripe"] },
      { id: "hubspot", name: "HubSpot", summary: "线索、CRM 和销售流程。", matchTerms: ["hubspot", "hub spot"] },
    ],
  },
  {
    id: "academic-research",
    slug: "academic-research",
    name: "Academic Research",
    summary: "论文检索、文献综述、学术问答与资料比对的一组研究包。",
    description:
      "这组更偏学术和深度研究场景，适合找论文、做综述、交叉验证结论和整理引用材料。",
    primaryCategory: "research",
    publisher: { name: "Mirror Curated", type: "mirror" },
    icon: {
      monogram: "AR",
      accent: "#CA8A04",
      surface: "#FEFCE8",
      foreground: "#A16207",
    },
    prompts: [
      "Find the key papers on this topic and summarize the consensus",
      "Compare these research claims and identify where they disagree",
      "Build a short literature review with citations and follow-up leads",
    ],
    links: {
      website: "https://skillsmp.com/zh",
      source: "https://skillsmp.com/zh/categories/research",
    },
    members: [
      {
        id: "arxiv",
        name: "arXiv",
        summary: "预印本论文检索和初步筛选。",
        matchTerms: ["arxiv", "ar xive"],
      },
      {
        id: "semantic-scholar",
        name: "Semantic Scholar",
        summary: "学术搜索、引用和关联论文发现。",
        matchTerms: ["semantic scholar"],
      },
      {
        id: "consensus",
        name: "Consensus",
        summary: "围绕研究问题的结论聚合和问答。",
        matchTerms: ["consensus"],
      },
      {
        id: "scinapse",
        name: "Scinapse",
        summary: "学术资料检索和作者关联发现。",
        matchTerms: ["scinapse"],
      },
      {
        id: "google-scholar",
        name: "Google Scholar",
        summary: "跨来源论文搜索和引用追踪。",
        matchTerms: ["google scholar", "scholar"],
      },
      {
        id: "pubmed",
        name: "PubMed",
        summary: "医学和生命科学文献检索。",
        matchTerms: ["pubmed"],
      },
    ],
  },
  {
    id: "market-intelligence",
    slug: "market-intelligence",
    name: "Market Intelligence",
    summary: "市场、竞品、融资和流量判断的一组商业研究工具。",
    description:
      "偏市场和商业研究，适合做竞品扫描、流量判断、公司背景确认和增长机会分析。",
    primaryCategory: "research",
    publisher: { name: "Mirror Curated", type: "mirror" },
    icon: {
      monogram: "MI",
      accent: "#B45309",
      surface: "#FFFBEB",
      foreground: "#92400E",
    },
    prompts: [
      "Map the main competitors in this market",
      "Compare traffic and category positioning across these companies",
      "Summarize the latest fundraising and company signals",
    ],
    links: {
      website: "https://skillsmp.com/zh",
      source: "https://skillsmp.com/zh/categories/research",
    },
    members: [
      { id: "crunchbase", name: "Crunchbase", summary: "公司、融资和团队背景检索。", matchTerms: ["crunchbase", "crunch base"] },
      { id: "similarweb", name: "Similarweb", summary: "流量结构和竞品网站对比。", matchTerms: ["similarweb", "similar web"] },
      { id: "semrush", name: "SEMrush", summary: "搜索词、流量和 SEO 竞争分析。", matchTerms: ["semrush", "sem rush"] },
      { id: "apollo", name: "Apollo", summary: "公司线索和联系人研究。", matchTerms: ["apollo"] },
      { id: "pitchbook", name: "PitchBook", summary: "私募、融资和市场情报。", matchTerms: ["pitchbook", "pitch book"] },
    ],
  },
  {
    id: "meeting-collab",
    slug: "meeting-collab",
    name: "Meeting & Collaboration",
    summary: "会议、录屏、协作沟通和异步同步的一组团队工具包。",
    description:
      "适合团队协作和沟通同步，覆盖会议安排、会议记录、录屏和异步更新流。",
    primaryCategory: "productivity",
    publisher: { name: "Mirror Curated", type: "mirror" },
    icon: {
      monogram: "MC",
      accent: "#0EA5E9",
      surface: "#F0F9FF",
      foreground: "#0284C7",
    },
    prompts: [
      "Set up a cleaner meeting workflow for this team",
      "Turn these scattered updates into a concise async brief",
      "Compare meeting tooling for review, recording and follow-up",
    ],
    links: {
      website: "https://skillsmp.com/zh",
      source: "https://skillsmp.com/zh/categories/business",
    },
    members: [
      { id: "zoom", name: "Zoom", summary: "会议组织、通话和协作沟通。", matchTerms: ["zoom"] },
      { id: "loom", name: "Loom", summary: "录屏、异步演示和反馈。", matchTerms: ["loom"] },
      { id: "read-ai", name: "Read AI", summary: "会议记录和重点摘要。", matchTerms: ["read ai", "read-ai"] },
      { id: "granola", name: "Granola", summary: "会议笔记和整理。", matchTerms: ["granola"] },
      { id: "teams", name: "Teams", summary: "企业消息、会议和组织协作。", matchTerms: ["teams", "microsoft teams"] },
    ],
  },
  {
    id: "workspace-suite",
    slug: "workspace-suite",
    name: "Workspace Suite",
    summary: "Google Workspace、微软办公流和团队文件协同的综合包。",
    description:
      "这包偏向团队常用办公套件，适合文件协作、日程安排、共享盘和基础行政流。",
    primaryCategory: "productivity",
    publisher: { name: "Mirror Curated", type: "mirror" },
    icon: {
      monogram: "WS",
      accent: "#2563EB",
      surface: "#EFF6FF",
      foreground: "#1D4ED8",
    },
    prompts: [
      "Organize a lightweight workspace stack for this team",
      "Streamline file sharing, docs and scheduling across tools",
      "Compare Google and Microsoft collaboration workflows",
    ],
    links: {
      website: "https://skillsmp.com/zh",
      source: "https://skillsmp.com/zh/categories/business",
    },
    members: [
      { id: "google-docs", name: "Google Docs", summary: "协作文档和评论修订流。", matchTerms: ["google docs", "gdoc", "docs"] },
      { id: "google-calendar", name: "Google Calendar", summary: "日程、会议和提醒安排。", matchTerms: ["google calendar", "calendar"] },
      { id: "google-drive", name: "Google Drive", summary: "共享文件和团队目录整理。", matchTerms: ["google drive", "drive"] },
      { id: "sharepoint", name: "SharePoint", summary: "企业文件站点和共享空间。", matchTerms: ["sharepoint", "share point"] },
      { id: "onenote", name: "OneNote", summary: "团队笔记和资料记录。", matchTerms: ["onenote", "one note"] },
    ],
  },
  {
    id: "creator-media",
    slug: "creator-media",
    name: "Creator Media",
    summary: "视频、语音、头像和创作者内容工作流的一组媒体工具。",
    description:
      "偏创作者和内容制作，适合脚本、配音、虚拟人、视频剪辑和多平台分发准备。",
    primaryCategory: "design",
    publisher: { name: "Mirror Curated", type: "mirror" },
    icon: {
      monogram: "CM",
      accent: "#9333EA",
      surface: "#FAF5FF",
      foreground: "#7E22CE",
    },
    prompts: [
      "Build a lightweight content production workflow for this channel",
      "Compare video, voice and avatar tools for this campaign",
      "Turn these notes into a creator-ready production brief",
    ],
    links: {
      website: "https://skillsmp.com/zh",
      source: "https://skillsmp.com/zh/categories/content-media",
    },
    members: [
      { id: "heygen", name: "HeyGen", summary: "数字人视频和口播生成。", matchTerms: ["heygen", "hey gen"] },
      { id: "runway", name: "Runway", summary: "视频生成、剪辑和素材处理。", matchTerms: ["runway"] },
      { id: "elevenlabs", name: "ElevenLabs", summary: "配音、语音克隆和音频生成。", matchTerms: ["elevenlabs", "eleven labs"] },
      { id: "descript", name: "Descript", summary: "音视频编辑和脚本化修订。", matchTerms: ["descript"] },
      { id: "capcut", name: "CapCut", summary: "短视频剪辑和内容包装。", matchTerms: ["capcut", "cap cut"] },
    ],
  },
  {
    id: "workflow-automation",
    slug: "workflow-automation",
    name: "Workflow Automation",
    summary: "n8n、Zapier、Make 和 AI 代理编排的一组自动化工具包。",
    description:
      "适合搭自动化流水线和跨工具编排，把消息、表单、数据库和 AI 步骤串起来。",
    primaryCategory: "automation",
    publisher: { name: "Mirror Curated", type: "mirror" },
    icon: {
      monogram: "WA",
      accent: "#EA580C",
      surface: "#FFF7ED",
      foreground: "#C2410C",
    },
    prompts: [
      "Automate this multi-step workflow across several tools",
      "Choose the right automation layer for this operations task",
      "Review this agent workflow and simplify the handoff points",
    ],
    links: {
      website: "https://skillsmp.com/zh",
      source: "https://skillsmp.com/zh/categories/tools",
    },
    members: [
      { id: "n8n", name: "n8n", summary: "自托管工作流和 AI 编排。", matchTerms: ["n8n"] },
      { id: "zapier", name: "Zapier", summary: "SaaS 自动化和跨应用触发。", matchTerms: ["zapier"] },
      { id: "make", name: "Make", summary: "可视化自动化场景编排。", matchTerms: ["make", "integromat"] },
      { id: "mcp-gateway", name: "MCP Gateway", summary: "工具接入和代理桥接流程。", matchTerms: ["mcp gateway", "mcp"] },
      { id: "shortcut-automation", name: "Shortcuts", summary: "桌面和移动端快捷自动化。", matchTerms: ["shortcuts", "shortcut"] },
    ],
  },
  {
    id: "observability-incident",
    slug: "observability-incident",
    name: "Observability & Incident",
    summary: "监控、告警、排障和事故协同的一组运维工具包。",
    description:
      "适合线上排障和事故处置，覆盖日志、指标、追踪、告警和值班响应等流程。",
    primaryCategory: "operations",
    publisher: { name: "Mirror Curated", type: "mirror" },
    icon: {
      monogram: "OI",
      accent: "#DC2626",
      surface: "#FEF2F2",
      foreground: "#B91C1C",
    },
    prompts: [
      "Triage this production incident and narrow the likely causes",
      "Compare observability tools for this stack",
      "Design a lighter incident response workflow for the team",
    ],
    links: {
      website: "https://skillsmp.com/zh",
      source: "https://skillsmp.com/zh/categories/devops",
    },
    members: [
      { id: "datadog", name: "Datadog", summary: "指标、日志和服务性能监控。", matchTerms: ["datadog", "data dog"] },
      { id: "newrelic", name: "New Relic", summary: "APM、错误追踪和可观测性。", matchTerms: ["new relic", "newrelic"] },
      { id: "sentry", name: "Sentry", summary: "错误捕获和回溯排查。", matchTerms: ["sentry"] },
      { id: "pagerduty", name: "PagerDuty", summary: "值班告警和事故响应。", matchTerms: ["pagerduty", "pager duty"] },
      { id: "grafana", name: "Grafana", summary: "仪表盘、指标和日志分析。", matchTerms: ["grafana"] },
    ],
  },
  {
    id: "health-routines",
    slug: "health-routines",
    name: "Health & Routines",
    summary: "习惯、专注、睡眠和健康记录的一组生活方式工具包。",
    description:
      "这组偏个人节奏和习惯管理，适合做计划、复盘、专注计时和基础健康跟踪。",
    primaryCategory: "lifestyle",
    publisher: { name: "Mirror Curated", type: "mirror" },
    icon: {
      monogram: "HR",
      accent: "#16A34A",
      surface: "#F0FDF4",
      foreground: "#15803D",
    },
    prompts: [
      "Build a simple routine system around these personal goals",
      "Compare focus and habit tracking tools for daily use",
      "Organize sleep, activity and wellness signals into a weekly review",
    ],
    links: {
      website: "https://skillsmp.com/zh",
      source: "https://skillsmp.com/zh/categories/lifestyle",
    },
    members: [
      { id: "headspace", name: "Headspace", summary: "冥想、专注和情绪节奏管理。", matchTerms: ["headspace", "head space"] },
      { id: "myfitnesspal", name: "MyFitnessPal", summary: "饮食、热量和基础健康记录。", matchTerms: ["myfitnesspal", "my fitness pal"] },
      { id: "fitbit", name: "Fitbit", summary: "运动、睡眠和日常活动追踪。", matchTerms: ["fitbit", "fit bit"] },
      { id: "habitica", name: "Habitica", summary: "习惯打卡和目标推进。", matchTerms: ["habitica"] },
      { id: "pomodoro", name: "Pomodoro", summary: "番茄钟和专注节奏控制。", matchTerms: ["pomodoro", "focus timer"] },
    ],
  },
  {
    id: "travel-planning",
    slug: "travel-planning",
    name: "Travel Planning",
    summary: "出行、住宿、地图和行程规划的一组生活方式工具包。",
    description:
      "适合个人出行和差旅安排，覆盖住宿、地图、攻略和行程整合等常见环节。",
    primaryCategory: "lifestyle",
    publisher: { name: "Mirror Curated", type: "mirror" },
    icon: {
      monogram: "TP",
      accent: "#0891B2",
      surface: "#ECFEFF",
      foreground: "#0E7490",
    },
    prompts: [
      "Turn these notes into a realistic travel plan",
      "Compare routes, hotels and local logistics for this trip",
      "Build a short trip brief with day-by-day structure",
    ],
    links: {
      website: "https://skillsmp.com/zh",
      source: "https://skillsmp.com/zh/categories/lifestyle",
    },
    members: [
      { id: "google-maps", name: "Google Maps", summary: "路线、地点和周边组织。", matchTerms: ["google maps", "maps"] },
      { id: "airbnb", name: "Airbnb", summary: "住宿筛选和行程准备。", matchTerms: ["airbnb", "air bnb"] },
      { id: "booking", name: "Booking", summary: "酒店比价和住宿安排。", matchTerms: ["booking", "booking.com"] },
      { id: "tripadvisor", name: "Tripadvisor", summary: "攻略、评价和景点筛选。", matchTerms: ["tripadvisor", "trip advisor"] },
      { id: "rome2rio", name: "Rome2Rio", summary: "跨城市交通方案比较。", matchTerms: ["rome2rio", "rome 2 rio"] },
    ],
  },
  {
    id: "github-workflows",
    slug: "github-workflows",
    name: "GitHub Workflows",
    summary: "围绕仓库协作、CLI 操作与安全预审的精简工程包。",
    description:
      "这不是把所有和 GitHub 有关的 skill 塞成一包，而是只保留最核心的仓库协作和安装前预审能力。",
    primaryCategory: "coding",
    publisher: { name: "SkillHub Curated", type: "community" },
    icon: {
      monogram: "GH",
      accent: "#0F172A",
      surface: "#EEF2FF",
      foreground: "#0F172A",
    },
    prompts: [
      "Triage the open PR queue and flag risky changes",
      "Use gh CLI to inspect repo state and workflow runs",
      "Vet a new skill before installation",
    ],
    links: {
      source: "https://skillhub.cn/skills/github",
      docs: "https://docs.github.com",
    },
    members: [
      {
        id: "github",
        name: "GitHub",
        summary: "Issue、PR、run 和 API 的命令行操作。",
        matchTerms: ["github"],
        skillhubSlug: "github",
      },
      {
        id: "skill-vetter",
        name: "Skill Vetter",
        summary: "安装前安全预审和风险提示。",
        matchTerms: ["skill vetter", "skill-vetter"],
        skillhubSlug: "skill-vetter",
      },
    ],
  },
];

export const marketCategoryLabels: Record<MarketCategory, string> = {
  coding: "开发",
  productivity: "效率",
  data: "数据",
  design: "设计",
  automation: "自动化",
  docs: "文档",
  research: "研究",
  operations: "运维",
  lifestyle: "生活",
};

export function buildMarketPackages(skills: SkillBundle[]): MarketPackage[] {
  const installedTerms = new Set(
    skills.flatMap((skill) => [
      normalize(skill.name),
      normalize(skill.canonicalId),
      ...skill.members.flatMap((member) => [
        normalize(member.name),
        normalize(member.canonicalId),
      ]),
    ]),
  );

  return packageDefinitions.map((entry) => {
    const members = entry.members.map((member) => ({
      ...member,
      installed: member.matchTerms.some((term) => installedTerms.has(normalize(term))),
    }));
    const installedMemberCount = members.filter((member) => member.installed).length;
    const installableMemberCount = members.filter((member) => member.skillhubSlug).length;
    const installState =
      installableMemberCount === 0
        ? "catalog"
        : installedMemberCount === 0
        ? "available"
        : installedMemberCount === members.length
          ? "installed"
          : "partial";

    return {
      ...entry,
      members,
      installedMemberCount,
      installableMemberCount,
      installState,
    };
  });
}

export function getMarketPackageDefinition(packageId: string): MarketPackageDefinition | null {
  return packageDefinitions.find((entry) => entry.id === packageId) ?? null;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}
