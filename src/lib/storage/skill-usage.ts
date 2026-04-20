/** 单个 Skill 的真实调用统计（来自 Claude / Codex 日志扫描） */
export interface SkillCallRecord {
  callCount: number;
  lastCalledAt: string | null;
}

export type SkillUsageMap = Record<string, SkillCallRecord>;
