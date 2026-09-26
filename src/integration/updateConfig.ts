import path from "node:path";
import type { AstroIntegration } from "astro";

const updateConfigIntegration = (): AstroIntegration => ({
  name: "update-config",
  hooks: {
    "astro:config:setup": (options) => {
      const { addWatchFile } = options;
      addWatchFile(path.resolve("config/frosti.config.yaml"));
      // 页面级配置拆成独立文件，改任一个都要重启 dev
      // 首页：背景 / 一言 / 节假日
      addWatchFile(path.resolve("config/home.background.yaml"));
      addWatchFile(path.resolve("config/home.quotes.yaml"));
      addWatchFile(path.resolve("config/home.holidays.yaml"));
      // 项目页
      addWatchFile(path.resolve("config/project.yaml"));
      // 友链页：友链 / 友站 / 常用资源
      addWatchFile(path.resolve("config/friend.links.yaml"));
      addWatchFile(path.resolve("config/friend.sites.yaml"));
      addWatchFile(path.resolve("config/friend.resources.yaml"));
      addWatchFile(path.resolve("src/i18n/translations.yaml"));
    },
  },
});

export default updateConfigIntegration;
