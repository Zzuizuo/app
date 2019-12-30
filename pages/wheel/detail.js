const TimeUtil = require("../../utils/TimeUtil.js")
Page({

    /**
     * 页面的初始数据
     */
    data: {
        session: null,
        user: null,
        animationData: {},
        rotateRadian: 0,
        tempIndex: null
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        let that = this

        if (options.wheelId) {
            that.data.wheelId = options.wheelId
        }
        getApp().loadSession(function(session) {
            that.data.session = session
            that.loadData()
        })
    },

    loadData: function(cb) {
        let that = this
        getApp().request({
            url: '/userapp/wheel/detail/load',
            data: { wheelId: that.data.wheelId },
            method: 'POST',
            success: function(res) {
                let user = res.data.user
                let wheel = res.data.wheel
                let shop = res.data.shop
                let userwheelcounter = res.data.userwheelcounter
                let bigwheels = res.data.bigwheels
                for (let bigwheel of bigwheels) {
                    bigwheel.createTimeStr = TimeUtil.orderTime(bigwheel.createTime)
                }

                that.setData({
                    session: that.data.session,
                    user: user || null,
                    wheel: wheel || null,
                    userwheelcounter: userwheelcounter,
                    bigwheels: bigwheels,
                    shop: shop,
                    // wheeltext宽度
                    itemWidth: wheel.gifts ? 2 * (130 * Math.cos(Math.PI / 180 * (180 - (360 / wheel.gifts.length)) / 2)) : 0
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
        let that = this
        let imageUrl = '/res/images/logo1.png'
        let append = ''
        if (that.data.user) {
            append += '&shareby=' + that.data.user._id
        }
        let path = '/pages/main/index?wheelId=' + that.data.wheel._id + append
        let title = ''
        return {
            title: title,
            path: path,
            imageUrl: imageUrl
        }
    },

    onShow: function() {
        let that = this
        if (getApp().toast) {
            wx.showToast({
                title: getApp().toast,
                icon: 'none'
            })
            getApp().toast = null
        }

        let animation = wx.createAnimation({
            duration: 3000,
            timingFunction: 'ease-in',
        })

        this.animation = animation
        this.setData({
            animationData: animation.export()
        })
    },

    authThenHelp: function(e) {
        let that = this
        if (that.data.loading) {
            return
        }
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

    toJoin: function() {
        let that = this
        if (that.data.userwheelcounter.current >= that.data.userwheelcounter.total) {
            wx.showToast({
                title: '您的抽奖次数已用完',
                icon: 'none',
                duration: 2000
            })
            return
        }
        if (that.data.wheelEnd) return
        this.data.wheelEnd = true
        that.wheelStart()
        getApp().request({
            url: '/userapp/wheel/join',
            data: { wheelId: that.data.wheelId },
            method: 'POST',
            success: function(res) {
                if (res.statusCode == 400) {
                    that.data.wheelEnd = false
                    clearTimeout(that.data.tempRotate)
                    that.data.tempRotate = null
                    setTimeout(() => {
                        clearInterval(that.data.runlight)
                        that.data.runlight = null
                    }, 3000);
                }
                if (res.data.success) {
                    let coupon = res.data.usercoupon.coupon
                    let awardIndex = res.data.userwheel.bonus.index
                    if (coupon.expiryType == 'time') {
                        coupon.expiryTimeStr = TimeUtil.orderTime(coupon.expiryTime) + '前有效'
                    } else if (coupon.expiryType == 'day') {
                        coupon.expiryTimeStr = '领取后' + coupon.expiryDay + '天内有效'
                    } else {
                        coupon.expiryTimeStr = '长期有效'
                    }
                    res.data.usercoupon.coupon = coupon
                    that.setData({
                        userwheel: res.data.userwheel,
                        usercoupon: res.data.usercoupon,
                        'userwheelcounter.current': that.data.userwheelcounter.current + 1,
                    })
                    that.wheelStop(awardIndex, res.data)
                }
            },
            fail() {
                that.data.wheelEnd = false
                setTimeout(() => {
                    wx.showToast({
                        title: '请检查网络状态',
                        icon: 'none',
                        duration: 2000
                    })
                    clearInterval(that.data.runlight)
                    that.data.runlight = null
                }, 3000);
            }
        })
    },

    wheelStart() {
        let that = this
        this.data.wheelStartTime = new Date()
        that.data.delayTime = 0
        that.data.rotateRadian += 360 * 5
        that.animation.rotate(that.data.rotateRadian).step({ timingFunction: 'ease-in' })
        that.data.running = false
        that.data.runlight = setInterval(() => {
            that.setData({
                running: !that.data.running
            })
        }, 200)
        this.setData({
            animationData: this.animation.export()
        })

        that.data.tempRotate = setTimeout(() => {
            that.data.rotateRadian += 360 * 50
            that.animation.rotate(that.data.rotateRadian).step({ timingFunction: 'linear', duration: 20000 })
            that.setData({
                animationData: this.animation.export()
            })
        }, 3000)
    },

    wheelStop(index, resdata) {
        let that = this
        let delayTime = 100
        that.data.wheelEndTime = new Date()
        if (that.data.tempIndex != null) {
            that.data.tempRadian = 360 / that.data.wheel.gifts.length * (that.data.tempIndex + 1)
            that.data.rotateRadian += that.data.tempRadian
        }
        //清除过渡期
        clearTimeout(that.data.tempRotate)
        that.data.tempRotate = null
        if (that.data.wheelEndTime.getTime() - that.data.wheelStartTime.getTime() < 1000 * 3) {
            //正常
            delayTime = 1000 * 3 - (that.data.wheelEndTime.getTime() - that.data.wheelStartTime.getTime()) + 500
            that.data.rotateRadian -= 360 / that.data.wheel.gifts.length * (index + 1)
            that.animation.rotate(that.data.rotateRadian).step({ timingFunction: 'ease-out' })
            that.setData({
                animationData: this.animation.export(),
            })
            let rotateEnd = setTimeout(() => {
                if (that.data.userwheel.usercoupon) {
                    that.setData({
                        awardModal: true
                    })
                }
                if (!resdata.userwheel.usercoupon && resdata.userwheel.bonus.coupon) {
                    wx.showToast({
                        title: '奖品已领完',
                        icon: 'none',
                        duration: 2000
                    })
                }
                clearInterval(that.data.runlight)
                that.data.runlight = null
                clearTimeout(rotateEnd)
                rotateEnd = null
                that.data.wheelEnd = false
                that.data.tempIndex = index
            }, delayTime);
        } else {
            //等待中
            that.data.rotateRadian -= 360 / that.data.wheel.gifts.length * (index + 1)
            that.animation.rotate(that.data.rotateRadian).step({ timingFunction: 'ease-out', duration: 500 })
            that.setData({
                animationData: this.animation.export(),
            })
            let rotateEnd = setTimeout(() => {
                if (that.data.userwheel.usercoupon) {
                    that.setData({
                        awardModal: true
                    })
                }
                clearInterval(that.data.runlight)
                that.data.runlight = null
                clearTimeout(rotateEnd)
                rotateEnd = null
                that.data.wheelEnd = false
                that.data.tempIndex = index
            }, 1000);
        }
    },

    authThenJoin: function(e) {
        let that = this
        if (that.data.loading) {
            return
        }
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
                    that.toJoin()
                }
            })
        } else {
            that.data.loading = false
            wx.hideLoading()
        }
    },
    doNothing: function() {
        let that = this
    },
    // getwheel: function() {
    //     let that = this
    //     if (that.data.loading) return
    //     that.data.loading = true
    //     wx.showLoading({ title: '' })
    //     getApp().request({
    //         url: '/userapp/main/wheel/get',
    //         data: { wheelId: that.data.wheel._id, from: { page: '/pages/wheel/detail' } },
    //         method: 'POST',
    //         success: function(res) {
    //             if (res.data.success) {
    //                 that.loadData(function() {
    //                     wx.hideLoading()
    //                     that.data.loading = false
    //                     getApp().toast = '领取成功'
    //                     wx.redirectTo({
    //                         url: '/pages/wheel/detail?wheelId=' + that.data.wheel._id + '&userwheelId=' + res.data.userwheelId
    //                     })
    //                 })
    //             } else {
    //                 wx.hideLoading()
    //                 that.data.loading = false
    //             }
    //         },
    //     })
    // },
    toUse: function(e) {
        let that = this
        let couponId = e.currentTarget.dataset.couponId
        let userId = e.currentTarget.dataset.userId
        wx.navigateTo({
            url: '/pages/coupon/detail?couponId=' + couponId + '&usercouponId=' + userId
        })
    },
    hideAwardModal() {
        this.setData({ awardModal: false })
    },
    toCoupons() {
        wx.navigateTo({
            url: '/pages/main/coupons'
        })
    },
    showRuleModal() {
        this.setData({
            ruleModal: true
        })
    },
    hideRuleModal() {
        this.setData({
            ruleModal: false
        })
    }
})