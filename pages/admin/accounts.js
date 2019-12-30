const TimeUtil = require("../../utils/TimeUtil.js")
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
            url: '/userapp/session/loadAccounts',
            data: {},
            method: 'POST',
            success: function(res) {
                let user = res.data.user
                let users = res.data.users
                for (let u of users) {
                    u.createTimeStr = TimeUtil.orderTime(u.createTime)
                    u.switchTimeStr = TimeUtil.orderTime(u.switchTime)
                }
                that.setData({
                    session: that.data.session,
                    user: user || null,
                    users: users
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

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {

    },
    showActions: function(e) {
        let that = this
        let item = e.currentTarget.dataset.item
        wx.showActionSheet({
            itemList: ['恢复并重启'],
            success: function(r) {
                if (r.tapIndex == 0) {
                    getApp().request({
                        url: '/userapp/session/switchAccount',
                        data: { userId: item._id },
                        method: 'POST',
                        success: function(res) {
                            getApp().session = null
                            wx.reLaunch({ url: '/pages/main/index' })
                        },
                    })
                }
            }
        })
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