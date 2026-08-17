MY TRAVEL PWA

已整合：
- 宮古島 2026/11/11–11/14
- 北海道 2027/02/18–03/05
- 行程 / 地圖 / 記帳 / 購物清單 / 行前清單 / 航班住宿 / 日本緊急電話
- 手機版底部導覽
- PWA，可加入手機主畫面
- Local Storage 本機保存
- Supabase 雲端同步（選用）

【直接使用】
1. 用瀏覽器開 index.html。
2. 不設定 Supabase 時，資料只存在目前裝置。
3. 地圖需要網路連線。

【跨手機 / 電腦同步】
1. 建立 Supabase 專案。
2. 在 Supabase SQL Editor 執行 supabase.sql。
3. 打開 My Travel → 更多 → 雲端同步。
4. 貼上 Project URL 與 anon public key。
5. 手機與電腦都填同一組資料，就會共用同一份旅行資料。

注意：
目前這版為個人使用的簡化同步模式，沒有登入驗證。
不要把 Supabase URL / anon key 分享給別人。
若要公開上線給多人使用，建議下一步加入 Supabase Auth 與 user_id 權限隔離。

【PWA】
若要完整支援「加入主畫面」與 Service Worker，建議放到 HTTPS 網站上，例如 GitHub Pages / Cloudflare Pages / Netlify。
