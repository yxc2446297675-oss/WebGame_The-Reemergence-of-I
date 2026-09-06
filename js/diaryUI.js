/**
 * NPC 日记翻页弹窗控制器 (Diary Modal UI)
 * 独立弹窗（非文字框），支持翻页阅读，代码完全解耦、高扩展性。
 * 用法：diaryUI.open(npcName, themeColor, pages, onClose?)
 */

export class DiaryUI {
    constructor() {
        this.currentPage = 0;
        this.pages = [];
        this.npcName = "";
        this.themeColor = "#38bdf8";
        this.onCloseCallback = null;
        this._bound = false;
    }

    /**
     * 初始化 DOM 引用并绑定按钮事件（懒初始化，只执行一次）
     */
    _initDom() {
        if (this._bound) return;
        this.backdrop     = document.getElementById("modal-npc-diary");
        this.elNpcName    = document.getElementById("diary-npc-name");
        this.elIndicator  = document.getElementById("diary-page-indicator");
        this.elTitle      = document.getElementById("diary-page-title");
        this.elContent    = document.getElementById("diary-page-content");
        this.btnPrev      = document.getElementById("btn-diary-prev");
        this.btnNext      = document.getElementById("btn-diary-next");
        this.btnClose     = document.getElementById("btn-close-diary");

        if (!this.backdrop) return; // 测试环境兜底

        this.btnPrev?.addEventListener("click", () => this.goToPage(this.currentPage - 1));
        this.btnNext?.addEventListener("click", () => this.goToPage(this.currentPage + 1));
        this.btnClose?.addEventListener("click", () => this.close());

        // 点击遮罩层外侧关闭
        this.backdrop.addEventListener("click", (e) => {
            if (e.target === this.backdrop) this.close();
        });

        this._bound = true;
    }

    /**
     * 打开日记弹窗
     * @param {string} npcName - NPC 名称（显示于标题）
     * @param {string} themeColor - 主题色（边框 + 标题）
     * @param {Array<{title:string, content:string}>} pages - 日记页数组
     * @param {Function} [onClose] - 关闭回调（可选）
     */
    open(npcName, themeColor, pages, onClose = null) {
        this._initDom();
        if (!this.backdrop || !pages || pages.length === 0) return;

        this.npcName = npcName;
        this.themeColor = themeColor || "#38bdf8";
        this.pages = pages;
        this.currentPage = 0;
        this.onCloseCallback = onClose;

        // 应用主题色到弹窗边框
        const box = this.backdrop.querySelector(".diary-modal-box");
        if (box) box.style.borderColor = this.themeColor;

        if (this.elNpcName) {
            this.elNpcName.textContent = `${npcName} 的日记`;
            this.elNpcName.style.color = this.themeColor;
        }

        this.goToPage(0);
        this.backdrop.classList.remove("hidden");
    }

    /**
     * 跳转到指定页
     * @param {number} idx - 页码（0-indexed）
     */
    goToPage(idx) {
        if (!this.pages || this.pages.length === 0) return;
        idx = Math.max(0, Math.min(this.pages.length - 1, idx));
        this.currentPage = idx;

        const page = this.pages[idx];

        if (this.elIndicator) {
            this.elIndicator.textContent = `第 ${idx + 1} 页 / 共 ${this.pages.length} 页`;
        }
        if (this.elTitle) {
            this.elTitle.textContent = page.title || `第 ${idx + 1} 页`;
        }
        if (this.elContent) {
            // 将换行符转成 HTML 换行
            this.elContent.innerHTML = (page.content || "").replace(/\n/g, "<br>");
            // 每次翻页滚动回顶部
            this.elContent.scrollTop = 0;
        }

        // 按钮状态
        if (this.btnPrev) this.btnPrev.disabled = (idx === 0);
        if (this.btnNext) this.btnNext.disabled = (idx >= this.pages.length - 1);
    }

    /**
     * 关闭日记弹窗
     */
    close() {
        this._initDom();
        if (!this.backdrop) return;
        this.backdrop.classList.add("hidden");
        if (this.onCloseCallback) {
            const cb = this.onCloseCallback;
            this.onCloseCallback = null;
            cb();
        }
    }

    /**
     * 当前弹窗是否处于打开状态
     */
    isOpen() {
        this._initDom();
        return this.backdrop && !this.backdrop.classList.contains("hidden");
    }
}
