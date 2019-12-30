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
        wx.hideTabBarRedDot({
            index: 1,
        })
        let skipVipTips = wx.getStorageSync('skipVipTips')
        if (skipVipTips) {
            that.setData({ skipVipTips: true })
        }
        // that.initCustomNav()
    },
    initCustomNav() {
        let that = this
        that.setData({
            statusBarHeight: wx.getSystemInfoSync().statusBarHeight,
            navHeight: 45,
        })
    },
    doLoad: function() {
        let that = this
        let options = this.options

        // let scene = decodeURIComponent(options.scene)
        getApp().loadSession(function(session) {
            that.data.session = session
            that.loadData(function() {
                // that.loadExpiringCoupon()
                that.autoloadLocation()
            }, )
        })
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
                that.loadData()
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
        let item = e.target.dataset.item
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
            return cb()
        }
        // let lastLoadTime = null
        // if (!that.data.query.from) {
        //     lastLoadTime = wx.getStorageSync('lastLoadTime')
        //     if (lastLoadTime) lastLoadTime = new Date(lastLoadTime)
        // }
        getApp().request({
            url: '/userapp/main/gous/load',
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
                            backgroundColor: '#FFDB09'
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
                        // that.loadData()
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
                        path: 'pages/gou/form?gouId=' + item._id,
                        envVersion: getApp().env,
                        success(res) {
                            // 打开成功
                        }
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
                        that.setData({ coinSuccessModal: true, successModal: false, code: res.data.code })
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
    toTasks: function() {
        let that = this
        wx.navigateTo({
            url: '/pages/main/tasks'
        })
    },

    loadExpiringCoupon() {
        let that = this
        getApp().request({
            url: '/userapp/main/index/loadExpiringCoupon',
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
    toVip: function() {
        let that = this
        wx.switchTab({
            url: '/pages/main/me'
        })
        wx.setStorageSync('skipVipTips', true)
        that.setData({ skipVipTips: true })
    },
    handleShowContact() {
        this.setData({
            showContactModal: true,
            coinSuccessModal: false
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
    },
})