Page({

    /**
     * 页面的初始数据
     */
    data: {
        session: null,
        user: null,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        let that = this
        getApp().loadSession(function(session) {
            that.data.session = session
            that.loadData()
        })
    },

    loadData: function(cb) {
        let that = this
        getApp().request({
            url: '/userapp/main/tasks/load',
            data: {},
            method: 'POST',
            success: function(res) {
                let user = res.data.user
                that.setData({
                    session: that.data.session,
                    user: user || null,
                    usertasks: res.data.usertasks,
                })
                if (cb) cb()
            },
        })
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function() {
        this.loadData(function() {
            wx.stopPullDownRefresh()
        })
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {

    }
})