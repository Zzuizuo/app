const TimeUtil = require("../../utils/TimeUtil.js")

Page({

    /**
     * 页面的初始数据
     */
    data: {
        session: null,
        connects: null,
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
            url: '/userapp/wifi/connects/load',
            data: {
                query: that.data.query
            },
            method: 'POST',
            success: function(res) {
                let connects = res.data.connects
                for (let connect of connects) {
                    connect.createTimeStr = TimeUtil.prettyTime(connect.createTime)
                }
                if (that.data.query.from) {
                    that.data.query.from = null
                    connects = that.data.connects.concat(connects)
                }
                that.setData({
                    session: that.data.session,
                    connects: connects,
                    loading: false,
                    loadingmore: false,
                    nomore: (res.data.connects.length < that.data.query.size) ? true : false
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
        if (that.data.nomore || that.data.loadingmore || !that.data.session || that.data.connects.length == 0) {
            return
        }
        that.data.query.from = that.data.connects[that.data.connects.length - 1].createTime
        that.setData({
            loadingmore: true
        })
        that.loadData()
    },

})