//Page Object
Page({
    data: {
        url: '',
        height: 0
    },
    //options(Object)
    onLoad: function(options) {
        let that = this
        getApp().loadSession(function(session) {
            that.data.session = session
            that.setData({
                url: options.license
            })
        })
    },
    onReady: function() {

    },
    onShow: function() {

    },
    onHide: function() {

    },
    onUnload: function() {

    },
    onPullDownRefresh: function() {
        wx.stopPullDownRefresh()
    },
    onReachBottom: function() {

    },
    onShareAppMessage: function() {

    },
    onPageScroll: function() {

    },
    //item(index,pagePath,text)
    onTabItemTap: function(item) {

    },
    handleLoadImg(e) {
        this.setData({
            height: e.detail.height * 690 / e.detail.width,
            session: this.data.session
        })
    },
    handleLoadMark() {
        this.setData({
            showPic: true
        })
    }
});