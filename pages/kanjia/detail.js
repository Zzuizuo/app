const TimeUtil = require("../../utils/TimeUtil.js")
const NumberUtil = require("../../utils/NumberUtil.js")
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
        if (options.kanjiaId) {
            that.data.kanjiaId = options.kanjiaId
        }
        if (options.userkanjiaId) {
            that.data.userkanjiaId = options.userkanjiaId
        }
        if (options.autoJoin) {
            that.data.autoJoin = options.autoJoin
        }
        getApp().loadSession(function(session) {
            that.data.session = session
            that.loadData(function() {
                if (that.data.autoJoin && !that.data.userkanjia) {
                    that.toCreate()
                }
            }, )
        })
    },



    loadData: function(cb) {
        let that = this
        getApp().request({
            url: '/userapp/kanjia/detail/load',
            data: { kanjiaId: that.data.kanjiaId, userkanjiaId: that.data.userkanjiaId, },
            method: 'POST',
            success: function(res) {
                let user = res.data.user
                let kanjia = res.data.kanjia
                let shop = res.data.shop
                let done = false
                kanjia.originPriceStr = Number(kanjia.originPrice || 0).toFixed(2)
                kanjia.targetPriceStr = Number(kanjia.targetPrice || 0).toFixed(2)
                let userkanjia = res.data.userkanjia
                if (userkanjia) {
                    that.data.userkanjiaId = userkanjia._id
                    userkanjia.priceStr = Number(userkanjia.price || 0).toFixed(2)
                    if (userkanjia.kanjia.type == 'dazhe') {
                        userkanjia.priceStr = NumberUtil.toDiscount(Math.ceil(userkanjia.price))
                        userkanjia.kanjia.originPrice = 100
                        userkanjia.kanjia.targetPrice = userkanjia.kanjia.discount
                    }
                    for (let record of userkanjia.records) {
                        record.valueStr = Number(record.value).toFixed(2)
                        record.createTimeStr = TimeUtil.prettyTime(record.createTime)
                        // record.user.nickname = record.user.nickname.replace(/(?<=.).*(?=.)/g, '**');
                        if (record.user._id == user._id) {
                            done = true
                        }
                    }
                    userkanjia.kanPrice = userkanjia.kanjia.originPrice - userkanjia.price
                    userkanjia.kanPriceStr = Number(userkanjia.kanPrice).toFixed(2)
                    userkanjia.leftPriceStr = Number(userkanjia.kanjia.originPrice - userkanjia.kanPrice).toFixed(2)
                }
                if (userkanjia) {
                    userkanjia.priceStr = Number(userkanjia.price).toFixed(2)
                    let expiryTime = new Date(userkanjia.createTime).getTime() + 1000 * 60 * 60 * (kanjia.timeLimit || 2)
                    if (expiryTime > new Date().getTime()) {
                        that.data.expiryTime = expiryTime
                        that.runClock()
                    } else {
                        userkanjia.expired = true
                    }
                }
                if (new Date(kanjia.startTime).getTime() > new Date().getTime()) {
                    kanjia.status = 0
                    kanjia.startTimeStr = TimeUtil.orderTime(kanjia.startTime)
                } else if (new Date(kanjia.endTime).getTime() < new Date().getTime()) {
                    kanjia.status = 2
                } else {
                    kanjia.status = 1
                    if (kanjia.endTime) {
                        kanjia.endTimeStr = TimeUtil.orderTime(kanjia.endTime)
                    }
                }
                if (kanjia.detailHTML) {
                    let content = kanjia.detailHTML.replace(/<img.*?>/g, ($) => {
                        return $.replace(/style=".*?"/g, "")
                    })
                    let fixContent = content.replace(/\<img/g, '<img style="width:100%;height:auto;display: block"')
                    let httpOfContent = fixContent.replace(/<img.*?>/g, ($) => {
                        return $.replace(/https:\/\/.*?.135editor.com/g, (res) => {
                            return res.replace(/https/, 'http')
                        })
                    })
                    let transContent = httpOfContent.replace(/translateZ[(].*[)]/g, 'none')
                    kanjia.detailHTML = transContent.replace(/width: [3-9]{1}\d{2,}px;/g, 'width:100%; ')
                }
                if (userkanjia && userkanjia.order && !userkanjia.order.paid && !userkanjia.order.refund && new Date(userkanjia.order.expiryTime) > new Date()) {
                    userkanjia.paying = true
                }
                let comments = res.data.comments || []
                for (let comment of comments) {
                    comment.createTimeStr = TimeUtil.orderTime(comment.createTime)
                }
                let data = {
                    session: that.data.session,
                    user: user || null,
                    kanjia: kanjia || null,
                    userkanjia: userkanjia,
                    shop: shop || null,
                    done: done, //是否已经砍过
                    actions: res.data.actions,
                    showBack: getCurrentPages().length > 1,
                    comments: comments
                }
                wx.setNavigationBarTitle({
                    title: kanjia.name
                })
                that.setData(data)
                if (that.data.editorReady) {
                    that.showEditor()
                }
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
        let that = this
        let imageUrl = that.data.kanjia.cover + '@share'
        let append = ''
        if (that.data.user) {
            append += '&shareby=' + that.data.user._id
        }
        if (that.data.userkanjia) {
            append += '&userkanjiaId=' + that.data.userkanjia._id
        }
        let path = '/pages/main/index?kanjiaId=' + that.data.kanjia._id + append
        let title = that.data.kanjia.shareTitle || '砍价了！看看你能帮我砍多少？'
        return {
            title: title,
            path: path,
            imageUrl: imageUrl
        }
    },

    authThenHelp: function(e) {
        let that = this
        if (that.data.loading) {
            return
        }
        console.log(e)
        that.data.loading = true
        wx.showLoading({
            title: ''
        })
        if (e.detail.userInfo) {
            getApp().request({
                url: '/userapp/session/auth',
                data: {
                    userData: e.detail,
                    systemInfo: getApp().systemInfo
                },
                method: 'POST',
                success: function(res) {
                    wx.hideLoading()
                    that.data.loading = false
                    getApp().session = res.data.session
                    that.setData({
                        session: res.data.session,
                        user: res.data.user
                    })
                    that.toHelp()
                }
            })
        } else {
            that.data.loading = false
            wx.hideLoading()
        }
    },
    runClock: function() {
        let that = this
        let clock = {}
        let expiryTime = that.data.expiryTime
        if (expiryTime <= new Date().getTime()) {
            that.loadData()
            return
        }
        clock.hour = Math.floor((expiryTime - new Date().getTime()) / (1000 * 60 * 60))
        clock.min = Math.floor(((expiryTime - new Date().getTime()) % (1000 * 60 * 60)) / (1000 * 60))
        clock.sec = Math.floor((((expiryTime - new Date().getTime()) % (1000 * 60 * 60)) % (1000 * 60)) / 1000)
        that.setData({ clock: clock })
        setTimeout(() => {
            that.runClock()
        }, 1000);
    },
    toCreate: function() {
        let that = this
        that.kan()
    },
    authThenJoin: function(e) {
        let that = this
        if (that.data.loading) {
            return
        }
        console.log(e)
        that.data.loading = true
        wx.showLoading({
            title: ''
        })
        if (e.detail.userInfo) {
            getApp().request({
                url: '/userapp/session/auth',
                data: {
                    userData: e.detail,
                    systemInfo: getApp().systemInfo
                },
                method: 'POST',
                success: function(res) {
                    wx.hideLoading()
                    that.data.loading = false
                    getApp().session = res.data.session
                    that.setData({
                        session: res.data.session,
                        user: res.data.user
                    })
                    that.toCreate()
                }
            })
        } else {
            that.data.loading = false
            wx.hideLoading()
        }
    },

    toHelp: function() {
        let that = this
        that.kan()
    },
    toCreateToo: function() {
        let that = this
        that.data.userkanjiaId = null
        that.kan()
    },
    kan: function() {
        let that = this
        if (that.data.loading) return
        if (that.data.kanjia.status != 1) {
            wx.showToast({
                title: '暂时不能砍价',
                icon: 'none',
                duration: 2000
            })
            return
        }
        wx.showLoading({ title: '' })
        that.data.loading = true
        getApp().request({
            url: '/userapp/kanjia/detail/kan',
            data: { kanjiaId: that.data.kanjiaId, userkanjiaId: that.data.userkanjiaId },
            method: 'POST',
            success: function(res) {
                that.data.loading = false
                wx.hideLoading()
                if (res.data.success) {
                    wx.vibrateShort()
                    let bonusCoupon = res.data.usercoupon || null
                    let record = res.data.record
                    let helpTo = that.data.kanjia.helpTo
                    record.valueStr = Number(record.value).toFixed(2)
                    if (bonusCoupon) {
                        bonusCoupon.coupon.valueStr = Number(bonusCoupon.coupon.value).toFixed(2)
                        if (bonusCoupon.expiryTime) { bonusCoupon.expiryTimeStr = TimeUtil.orderTime(bonusCoupon.expiryTime) }
                    }
                    if (helpTo) {
                        if (helpTo == 'coupon') {

                        }
                        if (helpTo == 'bow') {
                            getApp().request({
                                url: '/userapp/kanjia/detail/getLastBowId',
                                data: { kanjiaId: that.data.kanjiaId },
                                method: 'POST',
                                success: function(r) {
                                    that.setData({
                                        bowId: r.data.bowId
                                    })
                                }
                            })
                        }
                    }
                    that.setData({ bonusModal: true, bonusCoupon: bonusCoupon, record: record })
                    that.data.userkanjiaId = res.data.userkanjia._id
                    that.loadData()
                } else if (res.data.userkanjia) {
                    that.data.userkanjiaId = res.data.userkanjia._id
                    that.loadData()
                }
            },
        })
    },
    toBow() {
        let that = this
        wx.navigateTo({
            url: '/pages/bow/detail?bowId=' + that.data.bowId
        })
    },
    toCouponDetail: function() {
        let that = this
        wx.navigateTo({
            url: '/pages/coupon/detail?couponId=' + that.data.bonusCoupon.coupon._id + '&usercouponId=' + that.data.bonusCoupon._id
        })
    },
    hideBonusModal: function() {
        let that = this
        that.setData({ bonusModal: false })
    },
    toIndex: function() {
        let that = this
        wx.switchTab({
            url: '/pages/main/index'
        })
    },
    toMe: function() {
        let that = this
        wx.switchTab({
            url: '/pages/main/me'
        })
    },
    doNothing: function() {
        let that = this

    },
    toRule: function() {
        let that = this
        wx.navigateTo({
            url: '/pages/kanjia/rule'
        })
    },
    onEditorReady: function() {
        const that = this
        that.data.editorReady = true
        if (that.data.kanjia) {
            that.showEditor()
        }
    },
    showEditor() {
        const that = this
        wx.createSelectorQuery().select('#editor').context(function(res) {
            that.editorCtx = res.context
            if (that.editorCtx && that.data.kanjia && that.data.kanjia.detailHTML) {
                that.editorCtx.setContents({ html: that.data.kanjia.detailHTML })
            }
            wx.pageScrollTo({ scrollTop: 0 })
            that.setData({ androidHTMLLoading: false })
        }).exec()
    },
    callShop: function() {
        let that = this
        if (!that.data.shop.contact) {
            wx.showToast({
                title: '无联系方式',
                icon: 'none'
            })
            return
        }
        wx.makePhoneCall({
            phoneNumber: that.data.shop.contact
        })
    },
    openLocation: function() {
        let that = this
        wx.openLocation({
            longitude: that.data.shop.location[0],
            latitude: that.data.shop.location[1],
            name: that.data.shop.name,
            address: that.data.shop.address
        })
    },

    saveToken: function(e) {
        let that = this
        let formId = e.detail.formId
        let value = ''
        getApp().request({
            url: '/push/token/save',
            data: {
                formId: formId,
                type: '砍价后红包',
            },
            method: 'POST'
        })
    },
    back: function() {
        let that = this
        wx.navigateBack()
    },

    toUse: function(e) {
        let that = this
        let usercoupon = e.currentTarget.dataset.usercoupon
        wx.navigateTo({
            url: '/pages/coupon/detail?couponId=' + usercoupon.coupon._id + '&usercouponId=' + usercoupon._id
        })

    },
    toSubshops: function() {
        let that = this
        wx.navigateTo({
            url: '/pages/main/subshops?shopId=' + that.data.shop._id
        })
    },
    toBuy: function() {
        let that = this
        that.setData({ buyModal: true })
    },
    hideBuyModal: function() {
        let that = this
        that.setData({ buyModal: false })
    },
    authThenToBuy: function(e) {
        let that = this
        if (that.data.loading) {
            return
        }
        console.log(e)
        that.data.loading = true
        wx.showLoading({
            title: ''
        })
        if (e.detail.userInfo) {
            getApp().request({
                url: '/userapp/session/auth',
                data: {
                    userData: e.detail,
                    systemInfo: getApp().systemInfo
                },
                method: 'POST',
                success: function(res) {
                    wx.hideLoading()
                    that.data.loading = false
                    getApp().session = res.data.session
                    that.setData({
                        session: res.data.session,
                        user: res.data.user
                    })
                    that.toBuy()
                }
            })
        } else {
            that.data.loading = false
            wx.hideLoading()
        }
    },
    buy: function() {
        let that = this
        that.pay()
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
                itemType: 'userkanjia',
                itemId: that.data.userkanjia._id
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
                            that.loadData()
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
        wx.showLoading({
            title: ''
        })
        getApp().request({
            url: '/userapp/main/paid',
            data: {
                orderId: that.data.order._id
            },
            method: 'POST',
            success: function(res) {
                that.data.loading = false
                wx.hideLoading()
                if (res.data.success) {
                    wx.vibrateShort()
                    that.loadData()
                    that.setData({
                        buyModal: false,
                        paidModal: true
                    })
                } else if (res.data.full) {
                    wx.vibrateShort()
                    that.loadData()
                    that.setData({
                        buyModal: false,
                        fullModal: true
                    })
                }
            },
        })
    },
    hidePaidModal: function() {
        let that = this
        that.setData({ paidModal: false })
    },
    hideFullModal: function() {
        let that = this
        that.setData({ fullModal: false })
    },
    toLicense(e) {
        let license = e.currentTarget.dataset.license
        wx.navigateTo({
            url: '/pages/main/license?license=' + license
        })
    },
    copyWechatCodeName: function() {
        let that = this
        let content = that.data.shop.wechatCodeName
        wx.setClipboardData({
            data: content,
            success(res) {
                wx.showToast({
                    title: '名称已复制',
                    icon: 'none'
                })
                that.setData({ copied: true })
            },
            fail(res) {
                wx.showToast({
                    title: res,
                    icon: 'none'
                })
            }
        })
    },
    toShop() {
        wx.navigateTo({
            url: '/pages/shop/detail?shopId=' + this.data.shop._id
        })
    },
    handleShopPass() {
        this.setData({
            passModal: true
        })
    },
    hidePassModal() {
        this.setData({
            passModal: false
        })
    },
    handleReport() {
        let that = this
        if (that.data.loading) {
            return
        }
        wx.showLoading({
            title: ''
        })
        that.data.loading = true
        getApp().request({
            url: '/userapp/kanjia/report',
            data: {
                kanjiaId: that.data.kanjiaId
            },
            method: 'POST',
            success: function(res) {
                that.data.loading = false
                wx.hideLoading()
                if (res.data.success) {
                    that.setData({
                        passModal: false
                    })
                    wx.showToast({
                        title: '您已举报成功，我们这边会尽快审核',
                        icon: 'none',
                        duration: 2000
                    })
                }
            },
        })
    },
    handleShopPass() {
        this.setData({
            passModal: true
        })
    },
    hidePassModal() {
        this.setData({
            passModal: false
        })
    },
    handleShowContact(){
        this.setData({
            showContactModal: true,
        })
    },
    hideContactModal(){
        this.setData({
            showContactModal: false
        })
    },
    handlePreviewImg(){
        wx.previewImage({
            current: 'http://cdn.classx.cn/tandian/userapp/res/images/image_contact.jpg', // 当前显示图片的http链接
            urls: ['http://cdn.classx.cn/tandian/userapp/res/images/image_contact.jpg'] // 需要预览的图片http链接列表
        })
    },
    handleCopy(e) {
        let that = this
        let content = e.currentTarget.dataset.content
        wx.setClipboardData({
            data: content,
            success(res) {
                wx.showToast({
                    title: '已复制',
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
    }
})