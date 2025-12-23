// VR 烹飪遊戲 - Service Worker
// 用於快取靜態資源和 3D 模型，提升回訪載入速度

const CACHE_NAME = 'vr-cooking-game-v1.0';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/assets/js/music-control.js',
    // 基本場景模型（優先快取）
    '/assets/model/kitchen/Meshy_AI_Neon_Kitchen_Lines_1218020425_texture.fbx',
    '/assets/model/砧板.glb',
    '/assets/model/盤子.glb',
    // 番茄炒蛋食材模型
    '/assets/model/番茄.glb',
    '/assets/model/雞蛋.glb',
    '/assets/model/調味罐.glb',
    '/assets/model/醬油罐.glb',
    '/assets/model/蔥花.glb',
    // 其他遊戲模型
    '/assets/model/半成品.glb',
    '/assets/model/成品.glb',
    '/assets/model/番茄塊.glb',
    '/assets/model/蛋液.glb',
    '/assets/model/白色陶瓷碗.glb',
    '/assets/model/平底鍋.glb',
    '/assets/model/鍋鏟.fbx'
];

// 安裝 Service Worker
self.addEventListener('install', (event) => {
    console.log('[Service Worker] 安裝中...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] 開始快取資源...');
                // 使用 addAll 會在任何一個失敗時全部失敗
                // 改用個別添加，允許部分失敗
                return Promise.allSettled(
                    ASSETS_TO_CACHE.map(url => {
                        return cache.add(url).catch(err => {
                            console.warn(`[Service Worker] 快取失敗: ${url}`, err);
                        });
                    })
                );
            })
            .then(() => {
                console.log('[Service Worker] 資源快取完成！');
                return self.skipWaiting(); // 立即啟用新的 Service Worker
            })
    );
});

// 啟用 Service Worker
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] 啟用中...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] 刪除舊快取:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[Service Worker] 已啟用！');
            return self.clients.claim(); // 立即控制所有頁面
        })
    );
});

// 攔截網路請求
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // 只快取同源請求和模型檔案
    if (url.origin !== location.origin && 
        !url.pathname.endsWith('.glb') && 
        !url.pathname.endsWith('.fbx')) {
        return; // 不快取外部 CDN 資源
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    console.log('[Service Worker] 從快取載入:', event.request.url);
                    return cachedResponse;
                }
                
                // 如果快取中沒有，則從網路獲取
                return fetch(event.request).then((response) => {
                    // 檢查是否為有效回應
                    if (!response || response.status !== 200 || response.type === 'error') {
                        return response;
                    }
                    
                    // 複製回應（因為回應只能使用一次）
                    const responseToCache = response.clone();
                    
                    // 將新資源添加到快取
                    caches.open(CACHE_NAME).then((cache) => {
                        // 只快取模型檔案和 HTML
                        if (event.request.url.endsWith('.glb') || 
                            event.request.url.endsWith('.fbx') ||
                            event.request.url.endsWith('.html') ||
                            event.request.url.endsWith('.js')) {
                            cache.put(event.request, responseToCache);
                            console.log('[Service Worker] 新增快取:', event.request.url);
                        }
                    });
                    
                    return response;
                }).catch((error) => {
                    console.error('[Service Worker] 網路請求失敗:', event.request.url, error);
                    throw error;
                });
            })
    );
});

// 監聽訊息（用於手動清除快取）
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        console.log('[Service Worker] 清除快取:', cacheName);
                        return caches.delete(cacheName);
                    })
                );
            }).then(() => {
                console.log('[Service Worker] 所有快取已清除！');
                event.ports[0].postMessage({ success: true });
            })
        );
    }
});
