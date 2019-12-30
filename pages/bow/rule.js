const TimeUtil = require("../../utils/TimeUtil.js")
const NumberUtil = require("../../utils/NumberUtil.js")
Page({

    /**
     * 页面的初始数据
     */
    data: {
        session: null,
        bow: null,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        let that = this
        that.data.bowId = options.bowId
        getApp().loadSession(function(session) {
            that.data.session = session
            that.loadData()
        })
    },

    loadData: function(cb) {
        let that = this
        getApp().request({
            url: '/userapp/bow/rule/load',
            data: { bowId: that.data.bowId },
            method: 'POST',
            success: function(res) {
                let bow = res.data.bow
                let bowData = res.data.bowData
                let userbows = res.data.userbows
                if (userbows) {
                    // for (let userbow of userbows) {
                    //     let createTime = new Date(userbow.createTime)
                    //     userbow.createTimeStr = '' + createTime.getHours() + createTime.getMinutes() + createTime.getSeconds() + createTime.getMilliseconds()
                    // }
                }
                that.setData({
                    session: that.data.session,
                    bow: bow || null,
                    bowData: bowData || null,
                    userbows: userbows || null
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

    }
})