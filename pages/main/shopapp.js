const TimeUtil = require("../../utils/TimeUtil.js")
Page({

    /**
     * 页面的初始数据
     */
    data: {
        session: null,
        user: null,
        form: {}
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        let that = this
        that.data.shopcodeId = options.shopcode
        getApp().loadSession(function(session) {
            that.data.session = session
            that.loadData()
        })
    },

    loadData: function(cb) {
        let that = this
        getApp().request({
            url: '/userapp/main/shopapp/load',
            data: { shopcodeId: that.data.shopcodeId },
            method: 'POST',
            success: function(res) {
                let user = res.data.user
                let shopcode = res.data.shopcode
                if (shopcode && shopcode.bindTime) {
                    shopcode.bindTimeStr = TimeUtil.fullTime(shopcode.bindTime)
                }
                that.setData({
                    session: that.data.session,
                    user: user || null,
                    shopcode: shopcode
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

    },
    toShopapp: function() {
        let that = this
        wx.showLoading({ title: '' })
        setTimeout(() => {
            wx.hideLoading()
        }, 1000);
        wx.navigateToMiniProgram({
            appId: 'wx8bcf2758c6249d28',
            path: 'pages/main/index?shopcode=' + that.data.shopcodeId,
            envVersion: getApp().env,
            success(res) {
                // 打开成功
            }
        })
    },
    toActive: function() {
        let that = this
        that.setData({ formModal: true, form: {} })
    },
    hideFormModal: function() {
        let that = this
        that.setData({ formModal: false })
    },
    save: function() {
        let that = this
        if (!that.data.form.name || !that.data.form.address || !that.data.form.location) {
            wx.showToast({
                title: '信息不完整',
                icon: 'none'
            })
            return
        }
        if (that.data.loading) return
        that.data.loading = true
        wx.showLoading({ title: '' })
        getApp().request({
            url: '/userapp/main/shopapp/active',
            data: { form: that.data.form, shopcodeId: that.data.shopcodeId },
            method: 'POST',
            success: function(res) {
                that.data.loading = false
                wx.hideLoading()
                if (res.data.success) {
                    that.hideFormModal()
                    that.loadData()
                }
            },
        })
    },
    hideInviteCodeModal: function() {
        let that = this
        that.setData({ inviteModal: false })
    },
    doNothing: function() {
        let that = this

    },
    openLocation: function() {
        let that = this
        wx.chooseLocation({
            success: function(res) {
                let location = [res.longitude, res.latitude]
                let address = res.address
                that.setData({
                    'form.address': address,
                    'form.location': location
                })
            },
            fail: function(res) {
                if (res.errMsg == "chooseLocation:fail auth deny") {
                    wx.openSetting({
                        success: function(res) {
                            console.log(res)
                        },
                    })
                }
            }
        })
    },

    valueChanged: function(e) {
        let that = this
        let value = e.detail.value
        let field = e.currentTarget.dataset.field
        that.data.form[field] = value
    },

    toUnbind: function() {
        let that = this
        wx.showActionSheet({
            itemList: ['确认解绑'],
            itemColor: '#ff0000',
            success: function(r) {
                if (r.tapIndex == 0) {
                    getApp().request({
                        url: '/userapp/main/shopapp/unbind',
                        data: { qrcodeId: that.data.shopcodeId },
                        method: 'POST',
                        success: function(res) {
                            if (res.data.success) {
                                wx.showToast({
                                    title: '解绑成功',
                                    icon: 'none'
                                })
                                that.loadData()
                            }
                        },
                    })
                }
            }
        })
    },

    toUsermode: function() {
        let that = this
        getApp().request({
            url: '/userapp/open/qrcode/load',
            data: { qrcodeId: that.data.shopcodeId },
            method: 'POST',
            success: function(res) {
                if (res.data.success) {
                    let qrcode = res.data.qrcode
                    if (qrcode.indexType == 'lastBow') {
                        wx.navigateTo({
                            url: '/pages/bow/detail?bowId=' + res.data.bow._id
                        })
                    } else if (qrcode.indexType == 'shop') {
                        wx.navigateTo({
                            url: '/pages/shop/detail?shopId=' + qrcode.shop._id
                        })
                    }
                }
            },
        })
    },
    toShopSetting: function() {
        let that = this
        wx.showLoading({ title: '' })
        setTimeout(() => {
            wx.hideLoading()
        }, 1000);
        wx.navigateToMiniProgram({
            appId: 'wx8bcf2758c6249d28',
            path: 'pages/main/index?shopId=' + that.data.shopcode.shop._id,
            envVersion: getApp().env,
            success(res) {
                // 打开成功
            }
        })
    },
    toBind: function() {
        let that = this
        that.setData({ bindModal: true })
        that.doSearch()
    },

    bind: function(e) {
        let that = this
        let item = e.currentTarget.dataset.item
        wx.showActionSheet({
            itemList: [item.name],
            success: function(r) {
                if (r.tapIndex == 0) {
                    if (that.data.loading) return
                    that.setData({ loading: true })
                    getApp().request({
                        url: '/userapp/main/shopapp/bind',
                        data: { shopId: item._id, qrcodeId: that.data.shopcodeId },
                        method: 'POST',
                        success: function(res) {
                            that.setData({ loading: false })
                            if (res.data.success) {
                                that.loadData()
                                wx.showToast({
                                    title: '绑定成功',
                                    icon: 'none'
                                })
                                that.hideBindModal()
                            }
                            if (cb) cb()
                        },
                    })
                }
            }
        })
    },
    hideBindModal: function() {
        let that = this
        that.setData({ bindModal: false })
    },
    doSearch() {
        let that = this
        if (that.data.loading) return
        that.setData({ loading: true })
        getApp().request({
            url: '/userapp/main/shopapp/search',
            data: { keywords: that.data.keywords },
            method: 'POST',
            success: function(res) {
                that.setData({ loading: false })
                if (res.data.success) {
                    that.setData({ shops: res.data.shops, count: res.data.count })
                }
            },
        })
    },
    keywordsChanged: function(e) {
        let that = this
        that.setData({ keywords: e.detail.value })
    },

})