import { describe, expect, test, vi } from "vitest";

import { performUpdateCheck } from "./update-check";

describe("performUpdateCheck", () => {
  test("shows an up-to-date message during manual checks", async () => {
    const notify = vi.fn().mockResolvedValue(undefined);

    await performUpdateCheck({
      manual: true,
      isDemoMode: false,
      isDev: false,
      currentVersion: "0.1.16",
      checkForUpdate: vi.fn().mockResolvedValue(null),
      confirmUpdate: vi.fn(),
      notify,
      relaunch: vi.fn(),
    });

    expect(notify).toHaveBeenCalledWith(
      "当前已是最新版本（v0.1.16）。",
      "已是最新版本",
    );
  });

  test("downloads and relaunches after the user accepts an update", async () => {
    const notify = vi.fn().mockResolvedValue(undefined);
    const downloadAndInstall = vi.fn().mockResolvedValue(undefined);
    const relaunch = vi.fn().mockResolvedValue(undefined);

    await performUpdateCheck({
      manual: true,
      isDemoMode: false,
      isDev: false,
      checkForUpdate: vi.fn().mockResolvedValue({
        version: "0.1.16",
        body: "修复若干问题",
        downloadAndInstall,
      }),
      confirmUpdate: vi.fn().mockResolvedValue(true),
      notify,
      relaunch,
    });

    expect(downloadAndInstall).toHaveBeenCalledOnce();
    expect(relaunch).toHaveBeenCalledOnce();
    expect(notify).toHaveBeenCalledWith(
      "正在后台下载并安装更新，这可能需要几分钟的时间。\n完成后应用将自动重启。",
      "正在更新",
    );
  });

  test("shows an error message when a manual check fails", async () => {
    const notify = vi.fn().mockResolvedValue(undefined);
    const onError = vi.fn();

    await performUpdateCheck({
      manual: true,
      isDemoMode: false,
      isDev: false,
      checkForUpdate: vi.fn().mockRejectedValue(new Error("network down")),
      confirmUpdate: vi.fn(),
      notify,
      relaunch: vi.fn(),
      onError,
    });

    expect(onError).toHaveBeenCalledOnce();
    expect(notify).toHaveBeenCalledWith(
      "检查更新失败，请稍后重试。",
      "更新检查失败",
      "error",
    );
  });
});
