Page({

    /**
     * 页面的初始数据
     */
    data: {
        session: null,
        report: null,
        form: {
            style: 1,
            skuId: 0
        }
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
            url: '/userapp/wifi/index/load',
            data: {},
            method: 'POST',
            success: function(res) {
                let report = res.data.report
                let data = {
                    session: that.data.session,
                    user: res.data.user,
                    report: report || null,
                }
                that.setData(data)
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

    },

    // toCreate: function() {
    //     let that = this
    //     if (that.data.creating) return
    //     that.setData({
    //         creating: true
    //     })
    //     wx.showLoading({
    //         title: ''
    //     })
    //     getApp().request({
    //         url: '/userapp/main/demo/create',
    //         data: {
    //             type: that.data.form.type
    //         },
    //         method: 'POST',
    //         success: function(res) {
    //             that.setData({
    //                 qrcodes: [res.data.qrcode]
    //             })
    //             that.showWifiCode()
    //         },
    //     })
    // },
    toCreate: function() {
        let that = this
        wx.navigateTo({
            url: '/pages/wifi/create'
        })
    },
    doNothing: function() {
        let that = this

    },
    toQrcodes: function() {
        let that = this
        wx.navigateTo({
            url: '/pages/wifi/qrcodes'
        })
    },
    toConnects: function() {
        let that = this
        wx.navigateTo({
            url: '/pages/wifi/connects'
        })
    },
    toSubsribers: function() {
        let that = this
        wx.navigateTo({
            url: '/pages/wifi/subscribers'
        })
    },

})