Page({
    data: {
        fansImg: '',
        authPhoto: false
    },
    onLoad(options) {
        let that = this;
        getApp().loadSession(function(session) {
            that.data.session = session;
            that.loadData();
        });
        getApp().getAuth((res) => {
            let authPhoto = res.authSetting['scope.writePhotosAlbum'];
            if (authPhoto) {
                that.setData({
                    authPhoto: true
                });
            }
        });
    },
    onReady() {},
    onShow() {},
    onHide() {},
    onUnload() {},
    onPullDownRefresh() {
        wx.stopPullDownRefresh()
    },
    onReachBottom() {},
    onShareAppMessage() {},
    onPageScroll() {},
    onResize() {},
    onTabItemTap(item) {},
    loadData() {},
    getShareQrcode(e, cb) {
        let that = this;
        let url = e.currentTarget.dataset.url;
        if (that.data.loading) return;
        that.data.loading = true;
        getApp().request({
            url: url,
            data: {},
            method: 'POST',
            success(res) {
                that.data.loading = false;
                if (res.data.success) {
                    if (cb) cb(res.data.qrcode.url);
                }
            }
        });
    },
    handleCopy(e) {
        let that = this;
        let content = e.currentTarget.dataset.content;
        wx.setClipboardData({
            data: content,
            success(res) {
                wx.showToast({
                    title: '已复制',
                    icon: 'none'
                });
            },
            fail(res) {
                wx.showToast({
                    title: res,
                    icon: 'none'
                });
            }
        });
    },
    previewImage(e) {
        let that = this
        wx.showLoading({ title: '' })
        that.getShareQrcode(e, (img) => {
            setTimeout(() => {
                wx.hideLoading()
            }, 200);
            wx.previewImage({
                current: img, // 当前显示图片的http链接
                urls: [img] // 需要预览的图片http链接列表,
            })
        });
    },
    handlePreviewImg(img) {
        wx.previewImage({
            current: img, // 当前显示图片的http链接
            urls: [img] // 需要预览的图片http链接列表
        });
    },
    handleSaveImg(e) {
        let that = this;
        that.getShareQrcode(e, (img) => {
            that.setData({ showImage: false }, () => {
                wx.showToast({
                    title: '',
                    icon: 'loading'
                });
                if (img) {
                    wx.getImageInfo({
                        src: img,
                        success(res) {
                            that.onSaveShareCard(res.path);
                        }
                    });
                }
            });
        });
    },
    onSaveShareCard(img) {
        let that = this;
        if (that.data.saving) return;
        that.setData({ saving: true });
        wx.showLoading({ title: '保存中' });
        setTimeout(() => {
            if (that.data.saving) {
                that.setData({ saving: false });
                wx.hideLoading();
            }
        }, 10000);
        wx.saveImageToPhotosAlbum({
            filePath: img,
            success(data) {
                wx.hideLoading();
                that.setData({ saving: false, saved: true });
                wx.previewImage({
                    current: img,
                    urls: [img]
                });
            },
            fail(err) {
                wx.hideLoading();
                that.setData({ saving: false, saved: true });
                wx.previewImage({
                    current: img,
                    urls: [img],
                    success: function() {
                        that.handlePreviewImg(img);
                    }
                });
            }
        });
    }
});