import path from "node:path";
import type { AstroIntegration } from "astro";

const updateConfigIntegration = (): AstroIntegration => ({
  name: "update-config",
  hooks: {
    "astro:config:setup": (options) => {
      const { addWatchFile } = options;
      addWatchFile(path.resolve("config/frosti.config.yaml"));
      // 首页三块配置（背景/一言/节假日）拆成独立文件，改任一都要重启 dev
      addWatchFile(path.resolve("config/home.background.yaml"));
      addWatchFile(path.resolve("config/home.quotes.yaml"));
      addWatchFile(path.resolve("config/home.holidays.yaml"));
      addWatchFile(path.resolve("src/i18n/translations.yaml"));
    },
  },
});

export default updateConfigIntegration;
