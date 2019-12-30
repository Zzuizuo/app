Page({

    /**
     * 页面的初始数据
     */
    data: {
        session: null,
        usersessions: null,
        query: {
            keywords: '',
            from: null,
            size: 20
        },
        loading: false,
        loadingmore: false,
        nomore: true,
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
            url: '/userapp/contact/usersessions/load',
            data: {
                query: that.data.query
            },
            method: 'POST',
            success: function(res) {
                let usersessions = res.data.usersessions
                if (that.data.query.from) {
                    that.data.query.from = null
                    usersessions = that.data.usersessions.concat(usersessions)
                }
                that.setData({
                    session: that.data.session,
                    usersessions: usersessions || null,
                    messageUndoCount: res.data.messageUndoCount || 0,
                    loadingmore: false,
                    nomore: (res.data.usersessions.length < that.data.query.size) ? true : false,
                })
                if (cb) cb()
            },
        })
    },
    toReply: function(e) {
        let that = this
        let item = e.currentTarget.dataset.item
        wx.navigateTo({
            url: '/pages/contact/messages?usersessionId=' + item._id
        })
    },
    toReadAll: function() {
        let that = this
        wx.showModal({
            title: '操作确认',
            content: '全部标记将会清楚所有用户看到的未处理消息数量，确定要全部标记为已处理吗？',
            success: function(tap) {
                if (tap.confirm) {
                    that.readAll()
                }
            }
        })
    },
    readAll: function() {
        let that = this
        getApp().request({
            url: '/userapp/contact/usersessions/readAll',
            data: {},
            method: 'POST',
            success: function(res) {
                if (res.data.success) {
                    wx.showToast({
                        title: '',
                    })
                    that.loadData()
                }
            },
        })
    },
    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function() {
        if (this.data.session) {
            this.loadData(function() {
                wx.stopPullDownRefresh()
            })
        }
    },
    onShow: function() {
        if (getApp().dataUpdated) {
            getApp().dataUpdated = false
            this.loadData()
        }
    },
    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {
        let that = this
        if (that.data.nomore || that.data.loadingmore || !that.data.session || that.data.usersessions.length == 0) {
            return
        }
        that.data.query.from = that.data.usersessions[that.data.usersessions.length - 1].lastContactTime
        that.setData({
            loadingmore: true
        })
        that.loadData()
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {

    },
    toDetail: function(e) {
        let that = this
        let item = e.currentTarget.dataset.item
        if (item.job) {
            wx.navigateTo({
                url: '/pages/main/job?jobId=' + item.job._id
            })
        }
    },
})