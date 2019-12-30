const TimeUtil = require("../../utils/TimeUtil.js")
const NumberUtil = require("../../utils/NumberUtil.js")

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
        this.options = options
        this.doLoad()
        // wx.showTabBarRedDot({
        //     index: 1,
        // })
        let skipVipTips = wx.getStorageSync('skipVipTips')
        if (skipVipTips) {
            that.setData({ skipVipTips: true })
        }
        let showTips1 = wx.getStorageSync('showTips1')
        if (showTips1 === false) {
            that.setData({ showTips1: false })
        } else {
            that.setData({ showTips1: true })
        }
        let showTips2 = wx.getStorageSync('showTips2')
        if (showTips2 === false) {
            that.setData({ showTips2: false })
        } else {
            that.setData({ showTips2: true })
        }
    },
    doLoad: function() {
        let that = this
        let options = this.options
        let scene = decodeURIComponent(options.scene)
        if (getApp().testcodeparam) {
            let tester = getApp().testcodeparam.substring('tester='.length, getApp().testcodeparam.length)
            console.log('tester:' + tester)
            getApp().request({
                url: '/userapp/open/testcode/load',
                data: { tester: tester, },
                method: 'POST',
                success: function(res) {
                    if (res.data.success) {
                        getApp().testcodeparam = null
                        let qrcode = res.data.qrcode
                        parseQrcode(qrcode, res)
                    }
                },
            })
        } else if (scene && scene.substring(0, 'codeId:'.length) == 'codeId:') {
            let codeId = scene.substring('codeId:'.length, scene.length)
            getApp().request({
                url: '/userapp/open/qrcode/load',
                data: { qrcodeId: codeId },
                method: 'POST',
                success: function(res) {
                    if (res.data.success) {
                        let qrcode = res.data.qrcode
                        parseQrcode(qrcode, res)
                    }
                },
            })
        } else {
            if (options.shareby) {
                getApp().shareby = options.shareby
            }
            if (options.kanjiaId) {
                let kanjiaId = options.kanjiaId
                getApp().from = { kanjiaId: kanjiaId }
                let append = ''
                if (options.userkanjiaId) {
                    append = '&userkanjiaId=' + options.userkanjiaId
                    getApp().from.userkanjiaId = options.userkanjiaId
                }
                getApp().pageChanged = true
                wx.navigateTo({
                    url: '/pages/kanjia/detail?kanjiaId=' + kanjiaId + append
                })
            } else if (options.couponId) {
                let couponId = options.couponId
                getApp().from = { couponId: couponId }
                let append = ''
                if (options.usercouponId) {
                    append = '&usercouponId=' + options.usercouponId
                    getApp().from.usercouponId = options.usercouponId
                }
                getApp().pageChanged = true
                wx.navigateTo({
                    url: '/pages/coupon/detail?couponId=' + couponId + append
                })
            } else if (options.commentShopId) {
                getApp().from = { commentShopId: options.commentShopId }
                getApp().pageChanged = true
                wx.navigateTo({
                    url: '/pages/main/comment?shopId=' + options.commentShopId
                })
            } else if (options.dakaShopId) {
                let append = ''
                getApp().from = { dakaShopId: options.dakaShopId }
                if (options.userdakaId) {
                    append = '&userdakaId=' + options.userdakaId
                    getApp().from.userdakaId = options.userdakaId
                }
                getApp().pageChanged = true
                wx.navigateTo({
                    url: '/pages/main/daka?shopId=' + options.dakaShopId + append
                })
            } else if (options.bowId) {
                let append = ''
                getApp().from = { bowId: options.bowId }
                if (options.shareby) {
                    append = '&shareby=' + options.shareby
                }
                getApp().pageChanged = true
                wx.navigateTo({
                    url: '/pages/bow/detail?bowId=' + options.bowId + append
                })
            } else if (options.gouId) {
                let append = ''
                getApp().from = { gouId: options.gouId }
                if (options.shareby) {
                    append = '&shareby=' + options.shareby
                }
                getApp().pageChanged = true
                wx.navigateTo({
                    url: '/pages/gou/detail?gouId=' + options.gouId + append
                })
            } else if (options.wheelId) {
                getApp().from = { wheelId: options.wheelId }
                getApp().pageChanged = true
                wx.navigateTo({
                    url: '/pages/wheel/detail?wheelId=' + options.wheelId
                })
            } else if (options.serviceshare) {
                getApp().pageChanged = true
                getApp().loadSession(function(session) {
                    that.data.session = session
                    getApp().request({
                        url: '/userapp/main/serviceshare',
                        data: { shareby: options.serviceshare },
                        method: 'POST',
                        success: function(res) {
                            if (res.data.success) {
                                getApp().toast = '恭喜你成为服务商'
                                wx.navigateTo({
                                    url: '/pages/main/wallet'
                                })
                            }
                        },
                    })
                })
            } else if (options.teamshare) {
                getApp().pageChanged = true
                getApp().loadSession(function(session) {
                    that.data.session = session
                    getApp().request({
                        url: '/userapp/main/teamshare',
                        data: { shareby: options.teamshare },
                        method: 'POST',
                        success: function(res) {
                            if (res.data.success) {
                                getApp().toast = '恭喜你获得推广特权'
                                wx.navigateTo({
                                    url: '/pages/main/wallet'
                                })
                            }
                        },
                    })
                })
            } else {
                getApp().loadSession(function(session) {
                    that.data.session = session
                    that.loadData(function() {
                        that.loadExpiringCoupon()
                        that.autoloadLocation()
                    })
                })
            }
        }

        function parseQrcode(qrcode, res) {
            if (!qrcode) {
                return
            }
            if (qrcode.shareby) {
                getApp().shareby = qrcode.shareby
            }
            if (getApp().scene == 1047 && qrcode.shop) { //扫码参加活动的用户不可见抢购内容
                getApp().skipShopId = qrcode.shop._id
            }
            if (qrcode.couponId) {
                getApp().from = { couponId: qrcode.couponId }
                let append = ''
                if (qrcode.usercouponId) {
                    append = '&usercouponId=' + qrcode.usercouponId
                    getApp().from.usercouponId = qrcode.usercouponId
                }
                getApp().pageChanged = true
                wx.navigateTo({
                    url: '/pages/coupon/detail?couponId=' + qrcode.couponId + append
                })
            } else if (qrcode.kanjiaId) {
                let append = ''
                getApp().from = { kanjiaId: qrcode.kanjiaId }
                if (qrcode.userkanjiaId) {
                    append = '&userkanjiaId=' + qrcode.userkanjiaId
                    getApp().from.userkanjiaId = qrcode.userkanjiaId
                }
                getApp().pageChanged = true
                wx.navigateTo({
                    url: '/pages/kanjia/detail?kanjiaId=' + qrcode.kanjiaId + append
                })
            } else if (qrcode.commentShopId) {
                getApp().from = { commentShopId: qrcode.commentShopId }
                getApp().pageChanged = true
                wx.navigateTo({
                    url: '/pages/main/comment?shopId=' + qrcode.commentShopId
                })
            } else if (qrcode.dakaShopId) {
                getApp().from = { dakaShopId: qrcode.dakaShopId }
                getApp().pageChanged = true
                wx.navigateTo({
                    url: '/pages/main/daka?shopId=' + qrcode.dakaShopId
                })
                if (getApp().scene == 1047) { //扫码打卡用户不可见抢购内容
                    getApp().skipShopId = qrcode.dakaShopId
                }
            } else if (qrcode.gouId) {
                getApp().from = { gouId: qrcode.gouId }
                let append = ''
                if (qrcode.shareby) {
                    append = '&shareby=' + qrcode.shareby
                }
                getApp().pageChanged = true
                wx.navigateTo({
                    url: '/pages/gou/detail?gouId=' + qrcode.gouId + append
                })
            } else if (qrcode.bowId) {
                getApp().from = { bowId: qrcode.bowId }
                let append = ''
                if (qrcode.shareby) {
                    append = '&shareby=' + qrcode.shareby
                }
                getApp().pageChanged = true
                wx.navigateTo({
                    url: '/pages/bow/detail?bowId=' + qrcode.bowId + append
                })
            } else if (qrcode.type == 'userdaka') {
                if (res.data.userdaka && res.data.bow) {
                    getApp().from = { bowId: res.data.bow._id, userdakaId: qrcode.userdaka._id }
                    getApp().pageChanged = true
                    wx.navigateTo({
                        url: '/pages/bow/detail?bowId=' + res.data.bow._id + '&userdakaId=' + qrcode.userdaka._id
                    })
                } else {
                    getApp().from = { shopId: qrcode.userdaka.shop._id, userdakaId: qrcode.userdaka._id }
                    getApp().pageChanged = true
                    wx.navigateTo({
                        url: '/pages/shop/detail?shopId=' + qrcode.userdaka.shop._id + '&userdakaId=' + qrcode.userdaka._id
                    })
                }
            } else if (qrcode.type == 'sharebow') {
                getApp().from = { bowId: qrcode.bow._id, shareby: qrcode.shareby }
                getApp().pageChanged = true
                wx.navigateTo({
                    url: '/pages/bow/detail?bowId=' + qrcode.bow._id + '&shareby=' + qrcode.shareby
                })
            } else if (qrcode.type == 'sharecoupon') {
                getApp().from = { qrcodeId: qrcode._id, shareby: qrcode.shareby }
                getApp().pageChanged = true
                wx.navigateTo({
                    url: '/pages/coupon/detail?usercouponId=' + qrcode.usercoupon._id + '&shareby=' + qrcode.shareby
                })
            } else if (qrcode.type == 'sharegou') {
                getApp().from = { gouId: qrcode.gou._id, shareby: qrcode.shareby }
                getApp().pageChanged = true
                wx.navigateTo({
                    url: '/pages/gou/detail?gouId=' + qrcode.gou._id + '&shareby=' + qrcode.shareby
                })
            } else if (qrcode.wheelId) {
                getApp().from = { wheelId: qrcode.wheelId }
                getApp().pageChanged = true
                wx.navigateTo({
                    url: '/pages/wheel/detail?wheelId=' + qrcode.wheelId
                })
            } else if (qrcode.type == 'serviceshare') {
                getApp().pageChanged = true
                getApp().loadSession(function(session) {
                    that.data.session = session
                    getApp().request({
                        url: '/userapp/main/serviceshare',
                        data: { shareby: qrcode.shareby },
                        method: 'POST',
                        success: function(res) {
                            if (res.data.success) {
                                getApp().toast = '恭喜你成为服务商'
                                wx.navigateTo({
                                    url: '/pages/main/wallet'
                                })
                            }
                        },
                    })
                })
            } else if (qrcode.type == 'teamshare') {
                getApp().pageChanged = true
                getApp().loadSession(function(session) {
                    that.data.session = session
                    getApp().request({
                        url: '/userapp/main/teamshare',
                        data: { shareby: qrcode.shareby },
                        method: 'POST',
                        success: function(res) {
                            if (res.data.success) {
                                getApp().toast = '恭喜你获得推广特权'
                                wx.navigateTo({
                                    url: '/pages/main/wallet'
                                })
                            }
                        },
                    })
                })
            } else if (qrcode.type == 'shopcode') {
                getApp().from = { shopcodeId: qrcode._id }
                getApp().loadSession(function(session) {
                    if (!qrcode.actived || (session.u.unionid == qrcode.activedBy.unionid)) {
                        getApp().pageChanged = true
                        wx.navigateTo({
                            url: '/pages/main/shopapp?shopcode=' + qrcode._id
                        })
                    } else {
                        if (qrcode.indexType == 'lastBow') {
                            getApp().pageChanged = true
                            wx.navigateTo({
                                url: '/pages/bow/detail?bowId=' + res.data.bow._id
                            })
                        } else if (qrcode.indexType == 'shop') {
                            getApp().pageChanged = true
                            wx.navigateTo({
                                url: '/pages/shop/detail?shopId=' + qrcode.shop._id
                            })
                        }
                    }
                })
            } else {
                if (qrcode.type == 'shopshare') {
                    that.setData({ shopshare: true })
                    getApp().serviceby = qrcode.shareby
                }
                getApp().loadSession(function(session) {
                    that.data.session = session
                    that.loadData(function() {
                        that.loadExpiringCoupon()
                        that.autoloadLocation()
                    }, )
                })
            }
        }
    },

    onShow() {
        let that = this
        if (getApp().systemError) {
            getApp().systemError = null
            this.doLoad()
            return
        }
        if (getApp().dataChanged) {
            getApp().dataChanged = false
            that.loadData()
        }
        if (getApp().pageChanged) {
            getApp().pageChanged = false
            getApp().loadSession(function(session) {
                that.data.session = session
                that.loadData(function() {
                    that.loadExpiringCoupon()
                    that.autoloadLocation()
                })
            })
        }
        if (getApp().toast) {
            wx.showToast({
                title: getApp().toast,
                icon: 'none'
            })
            getApp().toast = null
        }
        that.data.isFuseLocation = false

        if (getApp().gousChanged) {
            getApp().gousChanged = false
            this.loadData()
        }
        if (getApp().adImage) {
            wx.hideTabBar()
            wx.setNavigationBarColor({
                frontColor: '#000000',
                backgroundColor: '#4c4009'
            })
            setTimeout(() => {
                that.setData({ adImage: getApp().adImage })
                getApp().adImage = null
            }, 100)
        }
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function() {
        let that = this
        if (getApp().systemError) {
            getApp().systemError = null
            this.doLoad()
            return
        }
        if (that.data.session) {
            if (that.data.query.sort == 'dis') {
                getApp().getNewLocation(function(location) {
                    that.data.query.location = location
                    that.loadData(function() {
                        wx.stopPullDownRefresh()
                    })
                })
            } else {
                that.loadData(function() {
                    wx.stopPullDownRefresh()
                })
            }

        } else {
            wx.stopPullDownRefresh()
        }
    },


    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {
        let that = this
        if (that.data.nomore || that.data.loadingmore || !that.data.session || that.data.gous.length == 0) {
            return
        }
        that.data.query.from = {
            createTime: that.data.gous[that.data.gous.length - 1].createTime,
            dis: that.data.gous[that.data.gous.length - 1].dis,
            nice: that.data.gous[that.data.gous.length - 1].nice,
            hot: that.data.gous[that.data.gous.length - 1].hot,
            full: that.data.gous[that.data.gous.length - 1].full,
            _id: that.data.gous[that.data.gous.length - 1]._id,
        }
        that.setData({
            loadingmore: true
        })
        that.loadData()
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function(e) {
        let that = this
        let item = null
        if (e && e.target && e.target.dataset && e.target.dataset.item) {
            item = e.target.dataset.item
        }
        if (item) {
            let imageUrl = item.cover + '@share'
            let append = ''
            if (that.data.user) {
                append = '&shareby=' + that.data.user._id
            }
            let path = '/pages/main/index?gouId=' + item._id + append
            let title = item.shareTitle || '￥' + item.priceStr + '抢原价' + item.originPriceStr + '的' + item.shop.name + item.name
            return {
                title: title,
                path: path,
                imageUrl: imageUrl
            }
        } else {
            let path = '/pages/main/index?shareby=' + that.data.user._id
            let imageUrl = 'http://cdn.classx.cn/tandian/appshare.jpg@share'
            let title = ''
            return {
                title: title,
                path: path,
                imageUrl: imageUrl
            }
        }
    },

    autoloadLocation: function() {
        let that = this
        let enableLocation = wx.getStorageSync('enableLocation')
        if (enableLocation && !that.data.query.location) {
            getApp().getLocation(function(location) {
                that.data.query.location = location
                for (let gou of that.data.gous) {
                    gou.disStr = Number(NumberUtil.distance(that.data.query.location, gou.shop.location)).toFixed(1) + 'km'
                }
                that.setData({ 'query.location': location, gous: that.data.gous })
            })
        }
    },

    loadData: function(cb) {
        let that = this
        if (that.data.query.sort == 'dis' && !that.data.query.location) {
            that.setData({ 'query.location': null, gous: null, locateFailed: true })
            if (cb) cb()
            return
        }
        // let lastLoadTime = null
        // if (!that.data.query.from) {
        //     lastLoadTime = wx.getStorageSync('lastLoadTime')
        //     if (lastLoadTime) lastLoadTime = new Date(lastLoadTime)
        // }
        getApp().request({
            url: '/userapp/main/index/load',
            data: { query: that.data.query, skipShopId: getApp().skipShopId || null },
            method: 'POST',
            success: function(res) {
                let data = {
                    loading: false,
                    loadingmore: false,
                }
                data.gous = res.data.gous || []
                if (that.data.query.from) {
                    that.data.query.from = null
                    data.gous = that.data.gous.concat(data.gous)
                } else {
                    data.session = that.data.session
                    data.user = res.data.user
                    that.data.usergous = res.data.usergous
                }
                for (let gou of data.gous) {
                    if (that.data.query.location) {
                        gou.disStr = Number(NumberUtil.distance(that.data.query.location, gou.shop.location)).toFixed(1) + 'km'
                    }
                    gou.originPriceStr = Number(gou.originPrice).toFixed(2)
                    gou.priceStr = Number(gou.price).toFixed(2)
                    gou.createTimeStr = TimeUtil.orderTime(gou.createTime)
                    if (gou.startTime) gou.startTimeStr = TimeUtil.orderTime(gou.startTime)
                    if (gou.startTime && new Date(gou.startTime) > new Date()) {
                        gou.status = 0
                    } else {
                        if ((gou.repeat == 'day' && gou.amount > (gou.data.paidToday || 0)) || (!gou.repeat && gou.amount > (gou.data.paid || 0))) {
                            gou.status = 1
                        } else {
                            gou.status = 2
                        }
                    }
                    if (that.data.usergous) {
                        for (let usergou of that.data.usergous) {
                            if (usergou.gou._id == gou._id) {
                                gou.joined = true
                            }
                        }
                    }
                    if (gou.recommendExpiryTime && new Date(gou.recommendExpiryTime) > new Date()) {
                        gou.recommendToIndex = true
                    }
                }
                data.nomore = (res.data.gous && res.data.gous.length < that.data.query.size) ? true : false
                data['query.location'] = that.data.query.location || null
                // if (lastLoadTime) {
                //     data.newItemCount = res.data.newItemCount
                //     if (res.data.newItemCount) {
                //         data.newItemModal = true
                //     }
                // }
                // wx.setStorageSync('lastLoadTime', res.data.lastLoadTime)
                that.setData(data)
                if (!that.data.user.lastLocation && !that.data.locateFailed && !that.data.locationCleared) {
                    that.updateLocation()
                }
                if (cb) cb()
            },
        })
    },

    hideNewItemModal: function() {
        let that = this
        that.setData({ newItemModal: false })
    },

    // handleSearchInputChange(e) {
    //     let keywords = e.detail.keywords
    //     this.data.query.keywords = keywords
    // },
    // handleSearch() {
    //     let that = this
    //     that.setData({
    //         userdakas: [],
    //         'query.keywords': that.data.query.keywords
    //     })
    //     that.loadData()
    // },
    toVip: function() {
        let that = this
        wx.switchTab({
            url: '/pages/main/me'
        })
        wx.setStorageSync('skipVipTips', true)
        that.setData({ skipVipTips: true })
    },
    handleDeleteKeywords() {
        let that = this
        that.setData({
            gous: [],
            keywords: ''
        })
        that.data.query.keywords = ''
        that.loadData()
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

    onPageScroll: function(e) {
        let that = this
        let topHeight = 168
        if ((e.scrollTop >= topHeight) && !that.data.navFixed) {
            that.setData({ navFixed: true })
        } else if ((e.scrollTop < topHeight) && that.data.navFixed) {
            that.setData({ navFixed: false })
        }
    },

    doNothing: function() {
        let that = this

    },

    toGou(e) {
        let that = this
        let item = e.detail.item || that.data.currentItem
        wx.showTabBar()
        wx.setNavigationBarColor({
            frontColor: '#ffffff',
            backgroundColor: '#333'
        })
        wx.navigateTo({
            url: '/pages/gou/detail?gouId=' + item._id,
            success: function() {
                setTimeout(() => {
                    that.setData({ joinModal: false })
                }, 500);
            },
        })
    },

    joinGou: function(e) {
        let that = this
        // that.toGou(e)
        let item = e.currentTarget.dataset.item
        let index = e.currentTarget.dataset.index
        console.log(index, e);

        that.setData({
            currentItem: item
        })
        if (item.cd) {
            that.toGou({ detail: { item } })
            return
        }
        if (that.data.loading) return
        wx.showLoading({ title: '' })
        that.data.loading = true
        getApp().request({
            url: '/userapp/gou/detail/join',
            data: { gouId: item._id },
            method: 'POST',
            success: function(res) {
                that.data.loading = false
                wx.hideLoading()
                if (res.data.success) {
                    if (res.data.usergou) {
                        wx.vibrateShort()
                        wx.setNavigationBarColor({
                            frontColor: '#000000',
                            backgroundColor: '#4c4009'
                        })
                        let usergou = res.data.usergou
                        usergou.valueStr = Number(usergou.value).toFixed(2)
                        usergou.priceStr = Number(usergou.price).toFixed(2)
                        that.data.gous[index].joined = true
                        that.data.gous[index].priceStr = usergou.priceStr
                        wx.hideTabBar({
                            success() {
                                that.setData({ joinModal: true, usergou: usergou, gous: that.data.gous })
                            }
                        })
                    } else {
                        wx.navigateTo({
                            url: '/pages/gou/detail?gouId=' + item._id
                        })
                    }
                }
            },
        })
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
        console.log(e)
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
                    that.joinGou(e)
                }
            })
        } else {
            that.data.loading = false
            wx.hideLoading()
        }
    },
    hideJoinModal: function() {
        let that = this
        that.setData({ joinModal: false })
        wx.showTabBar()
        wx.setNavigationBarColor({
            frontColor: '#ffffff',
            backgroundColor: '#333'
        })
    },
    gouActions: function(e) {
        let that = this
        if (!that.data.user.super && !that.data.user.tester) {
            return
        }
        let item = e.detail.item
        let actions = ['编辑']
        if (item.recommendToIndex) {
            actions.push('取消推荐')
        } else {
            actions.push('开启推荐')
        }
        actions.push('库存校对')
        actions.push('屏蔽')
        wx.showActionSheet({
            itemList: actions,
            success: function(r) {
                if (actions[r.tapIndex] == '取消推荐') {
                    wx.showLoading({ title: '' })
                    getApp().request({
                        url: '/userapp/gou/recommendToIndex',
                        data: { gouId: item._id, value: false },
                        method: 'POST',
                        success: function(res) {
                            if (res.data.success) {
                                wx.showToast({
                                    title: '',
                                })
                                that.loadData()
                            }
                        },
                    })
                } else if (actions[r.tapIndex] == '开启推荐') {
                    wx.showLoading({ title: '' })
                    getApp().request({
                        url: '/userapp/gou/recommendToIndex',
                        data: { gouId: item._id, value: true },
                        method: 'POST',
                        success: function(res) {
                            if (res.data.success) {
                                wx.showToast({
                                    title: '',
                                })
                                that.loadData()
                            }
                        },
                    })
                } else if (actions[r.tapIndex] == '库存校对') {
                    wx.showLoading({ title: '' })
                    getApp().request({
                        url: '/userapp/gou/verify',
                        data: { gouId: item._id },
                        method: 'POST',
                        success: function(res) {
                            if (res.data.success) {
                                wx.showToast({
                                    title: '',
                                })
                                that.loadData()
                            }
                        },
                    })
                } else if (actions[r.tapIndex] == '编辑') {
                    wx.showLoading({ title: '' })
                    setTimeout(() => {
                        wx.hideLoading()
                    }, 1000);
                    wx.navigateToMiniProgram({
                        appId: 'wx8bcf2758c6249d28',
                        path: 'pages/gou/form?gouId=' + item._id + '&gofrom=userapp',
                        envVersion: getApp().env,
                        success(res) {
                            // 打开成功
                        }
                    })
                } else if (actions[r.tapIndex] == '屏蔽') {
                    wx.showLoading({ title: '' })
                    getApp().request({
                        url: '/userapp/gou/skip',
                        data: { gouId: item._id, value: true },
                        method: 'POST',
                        success: function(res) {
                            if (res.data.success) {
                                wx.showToast({
                                    title: '',
                                })
                                that.loadData()
                            }
                        },
                    })
                }
            }
        })
    },
    toShop: function(e) {
        let that = this
        let item = e.currentTarget.dataset.item
        wx.navigateTo({
            url: '/pages/shop/detail?shopId=' + item.shop._id + '&fromgouId=' + item._id
        })
    },

    toUpdateLocation: function() {
        let that = this
        if (that.data.user && that.data.user.lastLocation) {
            wx.showActionSheet({
                itemList: ['重新定位', '清除定位'],
                success: function(r) {
                    if (r.tapIndex == 0) {
                        that.updateLocation()
                    } else if (r.tapIndex == 1) {
                        getApp().request({
                            url: '/userapp/main/location/clear',
                            data: {},
                            method: 'POST',
                            success: function(res) {
                                that.data.loading = false
                                wx.hideLoading()
                                if (res.data.success) {
                                    that.data.locationCleared = true
                                    that.loadData()
                                    wx.showToast({
                                        title: '定位已清除',
                                        icon: 'none'
                                    })
                                }
                            },
                        })
                    }
                }
            })
        } else {
            that.updateLocation()
        }
    },
    updateLocation: function() {
        let that = this
        if (that.data.locateFailed) {
            that.toSetLocation()
        }
        if (that.data.loading) return
        wx.showLoading({ title: '' })
        that.data.loading = true
        wx.getLocation({
            type: 'gcj02',
            success: function(res) {
                var latitude = res.latitude
                var longitude = res.longitude
                let location = [longitude, latitude]
                getApp().location = location
                that.data.location = location
                getApp().request({
                    url: '/userapp/session/location',
                    data: { location: location },
                    method: 'POST',
                    success: function(res) {
                        that.data.loading = false
                        wx.hideLoading()
                        if (res.data.success) {
                            let city = res.data.info.addressComponent.city || res.data.info.addressComponent.province
                            that.setData({ 'user.city': city })
                            that.loadData()
                            wx.showToast({
                                title: '定位已更新',
                                icon: 'none'
                            })
                        }
                    },
                })
            },
            fail: function() {
                that.data.loading = false
                wx.hideLoading()
                that.setData({ locateFailed: true })
            }
        })
    },
    showVideo: function() {
        let that = this
        if (that.data.ading) { return }
        that.setData({ ading: true })
        if (wx.createRewardedVideoAd) {
            if (!that.data.videoAd) {
                that.data.videoAd = wx.createRewardedVideoAd({
                    adUnitId: 'adunit-833b9226f7508ea9'
                })
                that.data.videoAd.onError(function(err) {
                    console.log(err.errMsg)
                    that.setData({ ading: false })
                    bonus()
                })
                that.data.videoAd.onClose(function(status) {
                    that.setData({ ading: false })
                    if (status && status.isEnded || status === undefined) {
                        bonus()
                    } else {
                        wx.showToast({
                            title: '未完成观看',
                            icon: 'none'
                        })
                    }
                }, )
            }
            that.data.videoAd.load()
                .then(() => {
                    that.data.videoAd.show()
                    that.setData({ ading: false })
                })
                .catch(err => {
                    console.log(err.errMsg)
                    that.setData({ ading: false })
                })
        } else {
            bonus()
        }

        function bonus() {
            wx.showLoading({ title: '' })
            getApp().request({
                url: '/userapp/gou/detail/videoBonus',
                data: { usergouId: that.data.usergouId || that.data.usergou._id },
                method: 'POST',
                success: function(res) {
                    that.setData({ ading: false })
                    wx.hideLoading()
                    if (res.data.success) {
                        wx.vibrateShort()
                        that.loadData()
                        let extraInfoType = 0
                        if (that.data.user.subscribe) {
                            extraInfoType = 3
                        } else {
                            if (getApp().advancedWxservice) {
                                extraInfoType = 1
                            } else {
                                extraInfoType = 2
                            }
                        }
                        that.setData({ coinSuccessModal: true, code: res.data.code, extraInfoType: extraInfoType })
                        that.hideSuccessModal()
                    }
                },
            })
        }
    },

    sortChanged: function(e) {
        let that = this
        let type = e.currentTarget.dataset.type
        that.setData({ 'query.sort': type })
        if (type == 'dis') {
            if (that.data.query.location) {
                that.loadData()
            } else {
                getApp().getLocation(function(location) {
                    that.data.query.location = location
                    that.loadData()
                })
            }
        } else {
            that.loadData()
        }
    },

    hideCoinSuccessModal: function() {
        let that = this
        that.setData({ coinSuccessModal: false })
    },

    toSetLocation: function() {
        let that = this
        wx.openSetting({
            success(res) {
                getApp().getLocation(function(location) {
                    that.data.query.location = location
                    that.loadData()
                })
            }
        })
    },

    loadExpiringCoupon() {
        let that = this
        getApp().request({
            url: '/userapp/main/index/loadExpiringCouponCount',
            data: {},
            method: 'POST',
            success: function(res) {
                that.setData({ expiringCouponCount: res.data.expiringCouponCount })
            },
        })
    },
    hideNewsbox() {
        this.setData({
            expiringCouponCount: null
        })
    },
    hideNewChanceModal() {
        this.setData({
            newChanceModal: false
        })
    },
    noticeMe: function() {
        let that = this
        if (that.data.loading) return
        that.data.loading = true
        let time = '09:00' //应通过时间选择器获取
        getApp().request({
            url: '/userapp/main/sign/notice',
            data: { time: time },
            method: 'POST',
            success: function(res) {
                that.data.loading = false
                if (res.data.success) {
                    that.setData({ 'user.signNoticed': true, 'user.signNotice': time })
                }
            },
        })
    },
    toCancelNoticeMe: function() {
        let that = this
        wx.showActionSheet({
            itemList: ['取消提醒'],
            success: function(r) {
                if (r.tapIndex == 0) {
                    if (that.data.loading) return
                    that.data.loading = true
                    getApp().request({
                        url: '/userapp/main/sign/notice/cancel',
                        data: {},
                        method: 'POST',
                        success: function(res) {
                            that.data.loading = false
                            if (res.data.success) {
                                that.setData({ 'user.signNoticed': false, 'user.signNotice': null })
                            }
                        },
                    })
                }
            }
        })
    },
    toCoupons: function() {
        let that = this
        wx.navigateTo({
            url: '/pages/main/coupons',
            success: function() {
                that.hideNewsbox()
            },
        })
    },
    hideAdImage: function() {
        let that = this
        wx.showTabBar()
        wx.setNavigationBarColor({
            frontColor: '#000000',
            backgroundColor: '#333333'
        })
        that.setData({ adImage: null })
    },
    previewAdImage: function() {
        let that = this
        wx.previewImage({
            current: that.data.adImage,
            urls: [that.data.adImage]
        })
    },
    hideTips() {
        wx.setStorage({
            key: "isShowTips",
            data: false
        })
        this.setData({
            isShowTips: false
        })
    },
    handleShowContact() {
        this.setData({
            showContactModal: true,
        })
    },
    hideContactModal() {
        this.setData({
            showContactModal: false
        })
    },
    handlePreviewImg() {
        wx.previewImage({
            current: 'http://cdn.classx.cn/tandian/userapp/res/images/image_contact.jpg', // 当前显示图片的http链接
            urls: ['http://cdn.classx.cn/tandian/userapp/res/images/image_contact.jpg'] // 需要预览的图片http链接列表
        })
    },
    handleCopy(e) {
        let that = this
        let content = e.currentTarget.dataset.content
        wx.showActionSheet({
            itemList: ['复制微信号'],
            success: function(r) {
                if (r.tapIndex == 0) {
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
            }
        })

    },
    hideTips1() {
        let that = this
        wx.showActionSheet({
            itemList: ['不再显示'],
            success: function(r) {
                if (r.tapIndex == 0) {
                    wx.setStorage({
                        key: "showTips1",
                        data: false
                    })
                    that.setData({
                        showTips1: false
                    })
                }
            }
        })
    },
    hideTips2(e) {
        let that = this
        let content = e.currentTarget.dataset.content
        wx.showActionSheet({
            itemList: ['不再显示', '复制微信号'],
            success: function(r) {
                if (r.tapIndex == 0) {
                    wx.setStorage({
                        key: "showTips2",
                        data: false
                    })
                    that.setData({
                        showTips2: false
                    })
                } else if (r.tapIndex == 1) {
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
            }
        })
    },
    toCreateShop: function() {
        let that = this
        wx.showLoading({ title: '' })
        setTimeout(() => {
            wx.hideLoading()
        }, 1000);
        wx.navigateToMiniProgram({
            appId: 'wx8bcf2758c6249d28',
            path: 'pages/shop/form?simpleMode=true&serviceby=' + getApp().serviceby,
            envVersion: getApp().env,
            success(res) {
                // 打开成功
            }
        })
    },
})