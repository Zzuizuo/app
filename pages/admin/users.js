const TimeUtil = require("../../utils/TimeUtil.js")
Page({

    /**
     * 页面的初始数据
     */
    data: {
        session: null,
        user: null,
        query: {
            keywords: '',
            from: null,
            size: 20
        },
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        let that = this
        if (options.selection) {
            that.data.selection = true
        }
        getApp().loadSession(function(session) {
            that.data.session = session
            that.loadData()
        })
    },

    loadData: function(cb) {
        let that = this
        getApp().request({
            url: '/userapp/admin/users/load',
            data: { query: that.data.query },
            method: 'POST',
            success: function(res) {
                let data = {
                    loading: false,
                    loadingmore: false,
                }
                data.users = res.data.users || []
                if (that.data.query.from) {
                    that.data.query.from = null
                    data.users = that.data.users.concat(data.users)
                } else {
                    data.session = that.data.session
                    data.user = res.data.user
                }
                for (let user of data.users) {
                    user.createTimeStr = TimeUtil.orderTime(user.createTime)
                    user.lastLoginTimeStr = TimeUtil.orderTime(user.lastLoginTime)
                }
                data.nomore = (res.data.users && res.data.users.length < that.data.query.size) ? true : false
                data.selection = that.data.selection
                that.setData(data)
                if (cb) cb()
            },
        })
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function() {
        if (this.data.user) {
            this.loadData(function() {
                wx.stopPullDownRefresh()
            })
        } else {
            wx.stopPullDownRefresh()
        }
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {
        let that = this
        if (that.data.nomore || that.data.loadingmore || !that.data.session || that.data.users.length == 0) {
            return
        }
        that.data.query.from = that.data.users[that.data.users.length - 1].createTime
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
    showActions: function(e) {
        let that = this
        let item = e.currentTarget.dataset.item
        if (that.data.selection) {
            wx.showActionSheet({
                itemList: ['使用'],
                success: function(r) {
                    if (r.tapIndex == 0) {
                        getApp().session.token = item.token
                        getApp().mocking = item.nickname
                        wx.switchTab({ url: '/pages/main/index' })
                    }
                }
            })
        }
    },

    keywordsChanged: function(e) {
        let that = this
        // if (!that.data.searching) {
        //     that.startSearch()
        // }
        // that.setData({
        //     'query.keywords': e.detail.value
        // })
        that.data.query.keywords = e.detail.value
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
        // that.endSearch()
        that.setData({
            'query.keywords': that.data.query.keywords
        })
        that.loadData()
    },

    copy: function(e) {
        let that = this
        let content = e.currentTarget.dataset.content
        wx.setClipboardData({
            data: content,
            success(res) {
                wx.showToast({
                    title: '_id已复制',
                    icon: 'none'
                })
            },
            fail(res) {
                wx.showToast({
                    title: res,
                    icon: 'none'
                })
            }
        })
    },



})