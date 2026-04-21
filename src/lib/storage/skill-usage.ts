/** 单个 Skill 的真实调用统计（来自各 IDE 的本地会话记录扫描） */
export interface SkillCallRecord {
  callCount: number;
  lastCalledAt: string | null;
}

export type SkillUsageMap = Record<string, SkillCallRecord>;
