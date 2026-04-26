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
