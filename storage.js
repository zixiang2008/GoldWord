/**
 * StorageAdapter（统一存储适配层）
 * 目标：
 * - 浏览器：默认使用 localStorage（同步，低风险），后续可替换为 IndexedDB/jeep-sqlite。
 * - 原生（Android/iOS via Capacitor）：预留 Preferences/SQLite 接入点，当前回退到 localStorage。
 * - 桌面（Electron）：预留 electron-store/SQLite 接入点，当前回退到 localStorage。
 *
 * 所有方法使用字符串键值，提供 JSON 读写辅助。
 */
(function() {
    /**
     * 判断运行环境（尽量不抛错）
     */
    function detectEnv() {
        var isCap = false, isElectron = false;
        try { isCap = !!(window && window.Capacitor && window.Capacitor.isNativePlatform); } catch(_) {}
        try { isElectron = !!(window && window.GoldWordDesktop); } catch(_) {}
        return { isCapacitor: isCap, isElectron: isElectron };
    }

    var env = detectEnv();

    /**
     * 本地 localStorage 实现（同步，低风险）
     */
    var localImpl = {
        getItem: function(key) {
            try { return localStorage.getItem(key); } catch(_) { return null; }
        },
        setItem: function(key, value) {
            try { localStorage.setItem(key, String(value)); } catch(_) {}
        },
        removeItem: function(key) {
            try { localStorage.removeItem(key); } catch(_) {}
        },
        /**
         * 读取 JSON 值
         * @param {string} key
         * @returns {any|null}
         */
        getJSON: function(key) {
            var raw = this.getItem(key);
            if (!raw) return null;
            try { return JSON.parse(raw); } catch(_) { return null; }
        },
        /**
         * 保存 JSON 值
         * @param {string} key
         * @param {any} value
         */
        setJSON: function(key, value) {
            try { this.setItem(key, JSON.stringify(value)); } catch(_) {}
        }
    };

    /**
     * 预留：Capacitor Preferences/SQLite 或 Electron 持久化的实现。
     * 当前阶段全部回退到 localStorage，以保证行为一致与改造低风险。
     */
    var impl = localImpl;

    /**
     * 导出到全局
     */
    window.StorageAdapter = impl;
})();

