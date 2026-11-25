# 我的食譜

個人食譜 App（PWA），可以安裝到手機和電腦的主畫面。

- 網址：https://geniechang.github.io/recipes/
- 食譜資料存在私人 repo `geniechang/recipes-data` 的 `recipes.json`，每次修改都會留下一個 commit。
- 每台裝置第一次使用時，按右上角「連接 GitHub 以同步」，貼上只能存取 `recipes-data` 的 GitHub 金鑰（Contents：Read and write）。

## 檔案

| 檔案 | 用途 |
|---|---|
| `index.html`, `style.css`, `app.js` | App 本身 |
| `config.js` | 資料 repo 的位置 |
| `sw.js`, `manifest.webmanifest`, `icons/` | 離線使用與安裝到主畫面 |

修改 `app.js` 或 `style.css` 後，請把 `sw.js` 裡的 `CACHE` 版本號加一，已安裝的裝置才會更新。
