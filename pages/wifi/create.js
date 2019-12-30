Page({

    /**
     * 页面的初始数据
     */
    data: {
        session: null,
        user: null,
        form: { style: 1, skuId: 0 }
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        let that = this
        // that.data.allowCreate = options.allowCreate || false
        that.data.allowCreate = true
        getApp().loadSession(function(session) {
            that.data.session = session
            that.loadData()
        })
    },

    loadData: function(cb) {
        let that = this
        getApp().request({
            url: '/userapp/wifi/qrcode/create/load',
            data: {},
            method: 'POST',
            success: function(res) {
                let user = res.data.user
                let qrcodes = res.data.qrcodes || []
                let skus = res.data.skus || []
                that.setData({
                    session: that.data.session,
                    user: user || null,
                    qrcodes: qrcodes,
                    skus: skus,
                    // 'form.priceStr': Number(skus[0].price).toFixed(2),
                    // 'form.address': user.address || null,
                    allowCreate: that.data.allowCreate,
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
        // let that = this
        // let imageUrl = '/res/images/share3.png'
        // return {
        //     path: '/pages/main/demo?shareby=' + that.data.session.u._id + '&allowCreate=1',
        //     imageUrl: imageUrl
        // }
    },

    onShow: function() {},

    styleChanged: function(e) {
        let that = this
        let value = e.currentTarget.dataset.value
        that.setData({ 'form.style': value })
    },
    skuChanged: function(e) {
        let that = this
        let value = e.currentTarget.dataset.value
        that.setData({ 'form.skuId': value, 'form.priceStr': Number(that.data.skus[value].price).toFixed(2) })
    },
    choooseAddress: function() {
        let that = this
        wx.chooseAddress({
            success: function(res) {
                let address = res
                let addressStr = address.provinceName + address.cityName + address.countyName + address.detailInfo + ' ' + address.telNumber + ' ' + address.userName
                that.setData({ 'form.address': addressStr, 'user.address': addressStr })
            },
            fail: function(res) {
                that.setData({ getAddressFailed: true })
            },
        })
    },
    create: function() {
        let that = this
        if (that.data.creating) return
        that.setData({ creating: true })
        wx.showLoading({ title: '' })
        getApp().request({
            url: '/userapp/wifi/qrcode/create',
            data: {
                type: that.data.form.style
            },
            method: 'POST',
            success: function(res) {
                wx.previewImage({
                    current: res.data.qrcode.url,
                    urls: [res.data.qrcode.url],
                    success: function() {
                        that.setData({ creating: false })
                        that.loadData()
                        wx.hideLoading()
                    }
                })
            },
        })
    },
    batchCreate: function() {
        let that = this
        wx.showActionSheet({
            itemList: ['创建100张'],
            success: function(r) {
                if (r.tapIndex == 0) {
                    if (that.data.creating) return
                    that.setData({ creating: true })
                    wx.showLoading({ title: '' })
                    getApp().request({
                        url: '/userapp/wifi/qrcode/batchCreate',
                        data: {
                            type: that.data.form.style
                        },
                        method: 'POST',
                        success: function(res) {
                            that.setData({ creating: false })
                            wx.showToast({
                                title: '执行成功',
                                icon: 'none'
                            })

                        },
                    })
                }
            }
        })
    },
    createOrigin: function() {
        let that = this
        that.setData({ 'form.style': 0 })
        that.create()
    },
    toBuy: function() {
        let that = this
        that.setData({ payModal: true })
    },

    hidePayModal: function() {
        let that = this
        that.setData({
            payModal: false
        })
    },
    cancelPay: function() {
        let that = this
        that.hidePayModal()
    },

    showLicenseModal: function() {
        let that = this
        that.setData({
            licenseModal: true
        })
    },
    hideLicenseModal: function() {
        let that = this
        that.setData({
            licenseModal: false
        })
    },
    licenseChanged: function(e) {
        let that = this
        if (e.detail.value.indexOf('agree') == -1) {
            that.setData({
                disagree: true
            })
        } else {
            that.setData({
                disagree: false
            })
        }
    },
    doNothing: function() {
        let that = this

    },
    pay: function(e) {
        let that = this
        if (that.data.loading || that.data.disagree) return
        that.data.loading = true
        wx.showLoading({
            title: ''
        })
        getApp().request({
            url: '/userapp/main/prepay',
            data: {
                form: that.data.form
            },
            method: 'POST',
            success: function(res) {
                wx.hideLoading()
                if (res.data.success) {
                    that.data.order = res.data.order
                    if (that.data.order.paid) {
                        that.paid()
                    } else {
                        let data = res.data.order.prepay
                        data.success = function(res) {
                            that.paid()
                        }
                        data.fail = function(res) {
                            that.data.loading = false
                            wx.showToast({
                                title: '支付失败',
                                icon: 'none'
                            })
                        }
                        wx.requestPayment(data)
                    }
                } else {
                    that.data.loading = false
                }
            },
        })
    },

    paid: function() {
        let that = this
        getApp().request({
            url: '/userapp/main/paid',
            data: {
                orderId: that.data.order._id
            },
            method: 'POST',
            success: function(res) {
                that.hidePayModal()
                wx.showModal({
                    title: '下单成功',
                    content: '我们将尽快发货',
                    showCancel: false
                })
                that.loadData()
            },
        })
    },
    toAbout: function() {
        let that = this
        wx.navigateTo({
            url: '/pages/main/about'
        })
    },

    toInviteTest: function() {
        let that = this
        that.data.inviteTest = true
    },

})