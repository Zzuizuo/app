Page({
    data: {
        session: null,
        form: {}
    },
    onLoad(options) {
        let that = this;
        that.data.shopId = options.shopId;
        that.data.usercouponId = options.usercouponId;
        getApp().loadSession(function(session) {
            that.data.session = session;
        });
    },
    onReady() {},
    onShow() {},
    onHide() {},
    onUnload() {},
    onPullDownRefresh() {},
    onReachBottom() {},
    onShareAppMessage() {},
    onPageScroll() {},
    onResize() {},
    onInput(e) {
        let that = this;
        let field = e.currentTarget.dataset.field;
        this.data.form[field] = e.detail.value;
        console.log(132);

        this.setData({
            form: that.data.form
        });
    },
    handleSwitch(e) {
        let that = this;
        let type = e.currentTarget.dataset.type;
        let value = e.currentTarget.dataset.value;
        this.data.form[type] = value;
        this.setData({
            form: that.data.form
        });
    },
    onSubmit() {
        let that = this;
        if (that.data.loading) {
            return;
        }
        that.data.loading = true;
        getApp().request({
            url: '/userapp/main/feedback/submit',
            data: { shopId: that.data.shopId, usercouponId: that.data.usercouponId, form: that.data.form },
            method: 'POST',
            success: function(res) {
                that.data.loading = false;
                if (res.data.success) {
                    that.setData({ session: null });
                    getApp().toast = '感谢反馈';
                    wx.redirectTo({
                        url: '/pages/main/comment?shopId=' + that.data.shopId + '&usercouponId=' + that.data.usercouponId
                    });
                }
            }
        });
    }
});