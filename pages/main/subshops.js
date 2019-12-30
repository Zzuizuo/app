Page({

    /**
     * 页面的初始数据
     */
    data: {
        session: null,
        shop: null,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        let that = this
        that.data.shopId = options.shopId
        getApp().loadSession(function(session) {
            that.data.session = session
            that.loadData()
        })
    },

    loadData: function(cb) {
        let that = this
        getApp().request({
            url: '/userapp/main/subshops/load',
            data: { shopId: that.data.shopId },
            method: 'POST',
            success: function(res) {
                let shop = res.data.shop
                that.setData({
                    session: that.data.session,
                    shop: shop || null
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
    callShop: function(e) {
        let phone = e.currentTarget.dataset.phone
        wx.makePhoneCall({
            phoneNumber: phone
        })
    },
    openLocation: function(e) {
        let that = this
        let shop = e.currentTarget.dataset.shop
        wx.openLocation({
            longitude: shop.location[0],
            latitude: shop.location[1],
            name: shop.name,
            address: shop.address
        })
    },
})