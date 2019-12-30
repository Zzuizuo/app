const TimeUtil = require("../../utils/TimeUtil.js")

Page({

    /**
     * 页面的初始数据
     */
    data: {
        session: null,
        subscribers: null,
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
        if (that.data.loading) return
        that.data.loading = true
        getApp().request({
            url: '/userapp/wifi/subscribers/load',
            data: {
                query: that.data.query
            },
            method: 'POST',
            success: function(res) {
                let subscribers = res.data.subscribers
                for (let user of subscribers) {
                    user.createTimeStr = TimeUtil.prettyTime(user.createTime)
                    user.lastLoginTimeStr = TimeUtil.prettyTime(user.lastLoginTime)
                }
                if (that.data.query.from) {
                    that.data.query.from = null
                    subscribers = that.data.subscribers.concat(subscribers)
                }
                that.setData({
                    session: that.data.session,
                    subscribers: subscribers,
                    loading: false,
                    loadingmore: false,
                    nomore: (res.data.subscribers.length < that.data.query.size) ? true : false
                })
                if (cb) cb()
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

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {
        let that = this
        if (that.data.nomore || that.data.loadingmore || !that.data.session || that.data.subscribers.length == 0) {
            return
        }
        that.data.query.from = that.data.subscribers[that.data.subscribers.length - 1].createTime
        that.setData({
            loadingmore: true
        })
        that.loadData()
    },

    keywordsChanged: function(e) {
        let that = this
        that.setData({
            'query.keywords': e.detail.value
        })
    },
    startSearch: function() {
        let that = this
        that.setData({
            searching: true
        })
    },
    endSearch: function() {
        let that = this
        that.setData({
            searching: false
        })
    },

    doSearch: function() {
        let that = this
        that.loadData()
    },

    showChannel: function(e) {
        let that = this
        let item = e.currentTarget.dataset.item
        let value = '探店大师'
        if (item.channel) { value = item.channel.nickname }
        wx.showToast({
            title: value,
            icon: 'none'
        })
    },
})