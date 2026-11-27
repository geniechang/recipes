// UI strings in both languages (spec §9). Content text comes from LText fields in recipes.json.
const S = {
  en: {
    library: 'Library', browse: 'Browse', bookmarks: 'Bookmarks', settings: 'Settings',
    recentlyViewed: 'Recently viewed', allRecipes: 'All recipes', all: 'All',
    sortNewest: 'Newest', sortRecent: 'Recently opened', sortName: 'Name',
    sortMostUsed: 'Most used', sortAZ: 'A–Z', sortRecentlyAdded: 'Recently added', sortRecentlySaved: 'Recently saved',
    noRecipes: 'No recipes yet', noRecipesBody: 'Ask Claude in your Recipes project to add one. It’ll show up here after the next sync.',
    noBookmarks: 'No bookmarks yet', noBookmarksBody: 'Tap the bookmark on any recipe to keep it here.',
    notConnected: 'Not connected', notConnectedBody: 'Connect your GitHub storage to see your recipes on this device.',
    keyExpired: 'Access key expired', keyExpiredBody: 'Paste a new access key to keep syncing your recipes.',
    connectStorage: 'Connect storage', updateKey: 'Update key',
    keyExpiresIn: (n) => n <= 0 ? 'Access key expires today' : `Access key expires in ${n} day${n === 1 ? '' : 's'}`,
    categories: 'Categories', authors: 'Authors', ingredients: 'Ingredients', method: 'Method',
    nCategories: (n) => `${n} ${n === 1 ? 'category' : 'categories'}`,
    nAuthors: (n) => `${n} ${n === 1 ? 'author' : 'authors'}`,
    nIngredients: (n) => `${n} ${n === 1 ? 'ingredient' : 'ingredients'}`,
    nRecipes: (n) => `${n} ${n === 1 ? 'recipe' : 'recipes'}`,
    usedIn: 'Used in', about: 'About', storage: 'Storage', by: 'by', from: 'from',
    totalTime: 'Total time', metric: 'Metric', us: 'US', toTaste: 'to taste',
    step: (n) => `Step ${n}`, minutes: (n) => `${n} min`,
    cookMode: 'Cook mode', cookModeBody: 'Keeps the screen on', beforeYouStart: 'Before you start', notes: 'Notes',
    done: 'Done', timerDone: 'Time’s up',
    notFound: 'Recipe not found', notFoundBody: 'It may have been removed or renamed. Pull down on the Library to sync.', backToLibrary: 'Back to Library',
    back: 'Back', bookmark: 'Bookmark', removeBookmark: 'Remove bookmark', openSource: 'Open source', close: 'Close',
    loading: 'Loading…', saved: (t) => `Saved · ${t}`, saving: 'Saving…', notSaved: 'Not saved yet — tap to retry',
    syncNow: 'Sync now', accessKey: 'Access key', versionHistory: 'Version history', versionHistoryBody: 'Every change is saved as a commit on GitHub.',
    preferences: 'Preferences', language: 'Language', temperature: 'Temperature', temperatureBody: 'Oven and frying temperatures in recipes.',
    units: 'Units', unitsBody: 'Default for ingredient amounts.', expiresIn: (n) => `Expires in ${n} days`, expiryUnknown: 'Expiry date unknown',
    connectTitle: 'Connect storage', connectBody: 'Your recipes are saved in a private GitHub repository. Paste an access key to read them on this device.',
    connectStep1: 'Create a fine-grained personal access token on GitHub.', connectStep2: 'Repository access: only recipes-data. Permissions: Contents — Read and write.',
    connectStep3: 'Copy the key and paste it below.', openGitHub: 'Open GitHub settings', paste: 'Paste', connect: 'Connect', notNow: 'Not now',
    keyStays: 'The key stays on this device and is only sent to GitHub.', connecting: 'Connecting…',
    connectFailed: 'That key didn’t work. Check that it can read recipes-data.', justNow: 'just now', minAgo: (n) => `${n} min ago`, hAgo: (n) => `${n} h ago`,
    savedToday: 'Saved today', uncategorized: 'Uncategorized', pullToRefresh: 'Release to sync', offline: 'Offline',
    ingredientsTab: 'Ingredients', yieldLabel: 'Yield', start: 'Start', pause: 'Pause', resume: 'Resume', reset: 'Reset', open: 'Open'
  },
  zh: {
    library: '食譜庫', browse: '瀏覽', bookmarks: '收藏', settings: '設定',
    recentlyViewed: '最近看過', allRecipes: '所有食譜', all: '全部',
    sortNewest: '最新', sortRecent: '最近開啟', sortName: '名稱',
    sortMostUsed: '最常用', sortAZ: '依名稱', sortRecentlyAdded: '最近新增', sortRecentlySaved: '最近收藏',
    noRecipes: '還沒有食譜', noRecipesBody: '在 Recipes 專案裡請 Claude 幫你新增，下次同步後就會出現在這裡。',
    noBookmarks: '還沒有收藏', noBookmarksBody: '在任何食譜點書籤圖示，就會收在這裡。',
    notConnected: '尚未連線', notConnectedBody: '連接 GitHub 儲存空間，就能在這台裝置上看到你的食譜。',
    keyExpired: '存取金鑰已過期', keyExpiredBody: '貼上新的存取金鑰，就能繼續同步食譜。',
    connectStorage: '連接儲存空間', updateKey: '更新金鑰',
    keyExpiresIn: (n) => n <= 0 ? '存取金鑰今天到期' : `存取金鑰將在 ${n} 天後到期`,
    categories: '分類', authors: '作者', ingredients: '食材', method: '做法',
    nCategories: (n) => `${n} 個分類`, nAuthors: (n) => `${n} 位作者`, nIngredients: (n) => `${n} 種食材`, nRecipes: (n) => `${n} 道食譜`,
    usedIn: '用在', about: '簡介', storage: '保存方式', by: 'by', from: '出自',
    totalTime: '總時間', metric: '公制', us: '美制', toTaste: '適量',
    step: (n) => `步驟 ${n}`, minutes: (n) => `${n} 分鐘`,
    cookMode: '烹飪模式', cookModeBody: '螢幕保持常亮', beforeYouStart: '開始前準備', notes: '筆記',
    done: '完成', timerDone: '時間到',
    notFound: '找不到這道食譜', notFoundBody: '它可能已被刪除或改名。在食譜庫往下拉可以重新同步。', backToLibrary: '回到食譜庫',
    back: '返回', bookmark: '收藏', removeBookmark: '取消收藏', openSource: '開啟來源', close: '關閉',
    loading: '載入中…', saved: (t) => `已儲存 · ${t}`, saving: '儲存中…', notSaved: '尚未儲存 — 點一下重試',
    syncNow: '立即同步', accessKey: '存取金鑰', versionHistory: '版本紀錄', versionHistoryBody: '每次修改都會在 GitHub 留下一個 commit。',
    preferences: '偏好設定', language: '語言', temperature: '溫度', temperatureBody: '食譜裡的烤箱和油炸溫度。',
    units: '單位', unitsBody: '食材份量的預設單位。', expiresIn: (n) => `${n} 天後到期`, expiryUnknown: '到期日不明',
    connectTitle: '連接儲存空間', connectBody: '你的食譜存在 GitHub 的私人資料庫裡。貼上存取金鑰，就能在這台裝置上讀取。',
    connectStep1: '在 GitHub 建立一把 fine-grained personal access token。', connectStep2: 'Repository access 只選 recipes-data；權限 Contents 設為 Read and write。',
    connectStep3: '複製金鑰，貼到下面。', openGitHub: '開啟 GitHub 設定', paste: '貼上', connect: '連接', notNow: '稍後再說',
    keyStays: '金鑰只會存在這台裝置上，也只會傳送給 GitHub。', connecting: '連接中…',
    connectFailed: '這把金鑰無法使用，請確認它能讀取 recipes-data。', justNow: '剛剛', minAgo: (n) => `${n} 分鐘前`, hAgo: (n) => `${n} 小時前`,
    savedToday: '今天收藏', uncategorized: '未分類', pullToRefresh: '放開以同步', offline: '離線',
    ingredientsTab: '食材', yieldLabel: '份量', start: '開始', pause: '暫停', resume: '繼續', reset: '重設', open: '開啟'
  }
};

export function strings(lang) { return S[lang] || S.zh; }
/** Pick the right side of an LText, falling back to the other language. */
export function lt(v, lang) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return v[lang] || v[lang === 'zh' ? 'en' : 'zh'] || '';
}
