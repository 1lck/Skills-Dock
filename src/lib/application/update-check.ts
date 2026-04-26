export interface AvailableUpdate {
  version: string;
  body?: string | null;
  downloadAndInstall: () => Promise<void>;
}

type NoticeKind = "info" | "error";

interface PerformUpdateCheckOptions {
  manual: boolean;
  isDemoMode: boolean;
  isDev: boolean;
  currentVersion?: string | null;
  checkForUpdate: () => Promise<AvailableUpdate | null>;
  confirmUpdate: (content: string, title: string) => Promise<boolean>;
  notify: (content: string, title: string, kind?: NoticeKind) => Promise<unknown>;
  relaunch: () => Promise<void>;
  onError?: (error: unknown) => void;
}

export async function performUpdateCheck({
  manual,
  isDemoMode,
  isDev,
  currentVersion,
  checkForUpdate,
  confirmUpdate,
  notify,
  relaunch,
  onError,
}: PerformUpdateCheckOptions): Promise<void> {
  if (isDemoMode) {
    if (manual) {
      await notify("演示模式下不支持检查更新。", "无法检查更新");
    }
    return;
  }

  if (isDev) {
    if (manual) {
      await notify("开发模式下不执行更新检查，请使用打包后的应用验证更新流程。", "无法检查更新");
    }
    return;
  }

  try {
    const update = await checkForUpdate();
    if (!update) {
      if (manual) {
        const versionSuffix = currentVersion ? `（v${currentVersion}）` : "";
        await notify(`当前已是最新版本${versionSuffix}。`, "已是最新版本");
      }
      return;
    }

    const shouldUpdate = await confirmUpdate(
      `发现新版本 v${update.version}。\n\n更新说明：\n${update.body || "无详细说明"}\n\n是否现在下载并安装？`,
      "Skills Dock 可选更新",
    );

    if (!shouldUpdate) {
      return;
    }

    await notify(
      "正在后台下载并安装更新，这可能需要几分钟的时间。\n完成后应用将自动重启。",
      "正在更新",
    );
    await update.downloadAndInstall();

    try {
      await relaunch();
    } catch (error) {
      console.log("Process plugin missing, expecting auto-restart", error);
    }
  } catch (error) {
    onError?.(error);

    if (manual) {
      await notify("检查更新失败，请稍后重试。", "更新检查失败", "error");
    }
  }
}
