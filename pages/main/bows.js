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
        let skipVipTips = wx.getStorageSync('skipVipTips')
        if (skipVipTips) {
            that.setData({ skipVipTips: true })
        }
    },
    doLoad: function() {
        let that = this
        let options = this.options
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
                that.loadData(function() {
                    // that.loadExpiringCoupon()
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

        if (getApp().bowsChanged) {
            getApp().bowsChanged = false
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
        if (that.data.nomore || that.data.loadingmore || !that.data.session || that.data.bows.length == 0) {
            return
        }
        that.data.query.from = {
            createTime: that.data.bows[that.data.bows.length - 1].createTime,
            dis: that.data.bows[that.data.bows.length - 1].dis,
            nice: that.data.bows[that.data.bows.length - 1].nice,
            hot: that.data.bows[that.data.bows.length - 1].hot,
            _id: that.data.bows[that.data.bows.length - 1]._id,
        }
        that.setData({
            loadingmore: true
        })
        that.loadData()
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {
        let that = this
        if (that.data.currentItem) {
            let imageUrl = that.data.currentItem.cover + '@share'
            let append = ''
            append = '&shareby=' + that.data.user._id
            let path = '/pages/main/index?bowId=' + that.data.currentItem._id + append
            let title = that.data.currentItem.shareTitle || '免费抽' + that.data.currentItem.shop.name + that.data.currentItem.name
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
                for (let bow of that.data.bows) {
                    bow.disStr = Number(NumberUtil.distance(that.data.query.location, bow.shop.location)).toFixed(1) + 'km'
                }
                that.setData({ 'query.location': location, bows: that.data.bows })
            })
        }
    },

    loadData: function(cb) {
        let that = this
        if (that.data.query.sort == 'dis' && !that.data.query.location) {
            that.setData({ 'query.location': null, bows: null, locateFailed: true })
            if (cb) cb()
            return
        }
        let lastLoadTime = null
        if (!that.data.query.from) {
            lastLoadTime = wx.getStorageSync('lastLoadTime')
            if (lastLoadTime) lastLoadTime = new Date(lastLoadTime)
        }
        getApp().request({
            url: '/userapp/main/bows/load',
            data: { query: that.data.query, lastLoadTime: lastLoadTime },
            method: 'POST',
            success: function(res) {
                let data = {
                    loading: false,
                    loadingmore: false,
                }
                data.bows = res.data.bows || []
                if (that.data.query.from) {
                    that.data.query.from = null
                    data.bows = that.data.bows.concat(data.bows)
                } else {
                    data.session = that.data.session
                    let user = res.data.user
                    let tomorrow = new Date(new Date().setHours(0, 0, 0, 0) + 1000 * 60 * 60 * 24)
                    if (user.signNoticeTime && new Date(user.signNoticeTime) > tomorrow) {
                        user.signNoticed = true
                    }
                    data.user = user
                    that.data.userbows = res.data.userbows
                }
                for (let bow of data.bows) {
                    if (that.data.query.location) {
                        bow.disStr = Number(NumberUtil.distance(that.data.query.location, bow.shop.location)).toFixed(1) + 'km'
                    }
                    bow.originPriceStr = Number(bow.originPrice).toFixed(2)
                    bow.createTimeStr = TimeUtil.orderTime(bow.createTime)
                    bow.startTimeStr = TimeUtil.orderTime(bow.startTime)
                    if (bow.name) {
                        let bowNameArr = bow.name.split('')
                        if (bowNameArr.length > 7) {
                            bowNameArr.length = 7
                            bow.name = bowNameArr.join('')
                        }
                    }
                    if (new Date(bow.startTime).getTime() > new Date().getTime()) {
                        bow.status = 0
                    } else {
                        bow.status = 1
                    }
                    if (that.data.userbows) {
                        for (let userbow of that.data.userbows) {
                            if (userbow.bow._id == bow._id) {
                                bow.joined = true
                            }
                        }
                    }
                    if (bow.recommendExpiryTime && new Date(bow.recommendExpiryTime) > new Date()) {
                        bow.recommendToIndex = true
                    }
                }
                data.nomore = (res.data.bows && res.data.bows.length < that.data.query.size) ? true : false
                data['query.location'] = that.data.query.location || null
                if (lastLoadTime) {
                    data.newItemCount = res.data.newItemCount
                    if (res.data.newItemCount) {
                        data.newItemModal = true
                    } else {
                        data.newItemModal = false
                    }
                }
                wx.setStorageSync('lastLoadTime', res.data.lastLoadTime)
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
            bows: [],
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

    toBow: function(e) {
        let item = e.detail.item || this.data.currentItem
        wx.navigateTo({
            url: '/pages/bow/detail?bowId=' + item._id
        })
    },

    joinBow: function(e) {
        let that = this
        let item = e.currentTarget.dataset.item
        let index = e.currentTarget.dataset.index
        that.data.currentItem = item
        if (item.cd) {
            that.toBow({ detail: { item } })
            return
        }
        // if ((that.data.user.more || 0) - (that.data.user.joinToday || 0) + 5 <= 0) {
        //     that.setData({
        //         newChanceModal: true
        //     })
        //     return
        // }
        if (that.data.loading) return
        wx.showLoading({ title: '' })
        that.data.loading = true
        getApp().request({
            url: '/userapp/bow/detail/join',
            data: { bowId: item._id },
            method: 'POST',
            success: function(res) {
                that.data.loading = false
                wx.hideLoading()
                if (res.data.success) {
                    wx.vibrateShort()
                    wx.setNavigationBarColor({
                        frontColor: '#000000',
                        backgroundColor: '#4c4009'
                    })
                    that.data.bows[index].joined = true
                    if (res.data.code) {
                        let showAd = false
                        // 由扫码或识别二维码进入，不出现广告 // 已经出现过广告也不再出现
                        if (!getApp().fromScan) {
                            showAd = true
                        }
                        // 由某店铺带来的粉丝，在该店铺不出现广告
                        if (res.data.skipAd) {
                            showAd = false
                        }
                        wx.hideTabBar({
                            success() {
                                that.setData({ successModal: true, code: res.data.code, showAd: showAd, userbow: res.data.userbow, bows: that.data.bows })
                            }
                        })
                    } else {
                        wx.navigateTo({
                            url: '/pages/bow/detail?bowId=' + item._id
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
                    that.joinBow(e)
                }
            })
        } else {
            that.data.loading = false
            wx.hideLoading()
        }
    },
    hideSuccessModal: function() {
        let that = this
        that.setData({ successModal: false })
        that.data.currentItem = null
        wx.showTabBar()
        wx.setNavigationBarColor({
            frontColor: '#000000',
            backgroundColor: '#ffdb09'
        })
    },
    bowActions: function(e) {
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
        actions.push('屏蔽')
        wx.showActionSheet({
            itemList: actions,
            success: function(r) {
                if (actions[r.tapIndex] == '取消推荐') {
                    wx.showLoading({ title: '' })
                    getApp().request({
                        url: '/userapp/bow/recommendToIndex',
                        data: { bowId: item._id, value: false },
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
                        url: '/userapp/bow/recommendToIndex',
                        data: { bowId: item._id, value: true },
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
                        path: 'pages/bow/form?bowId=' + item._id+ '&gofrom=userapp',
                        envVersion: getApp().env,
                        success(res) {
                            // 打开成功
                        }
                    })
                } else if (actions[r.tapIndex] == '屏蔽') {
                    wx.showLoading({ title: '' })
                    getApp().request({
                        url: '/userapp/bow/skip',
                        data: { bowId: item._id, value: true },
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
            url: '/pages/shop/detail?shopId=' + item.shop._id + '&frombowId=' + item._id
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
                url: '/userapp/bow/detail/videoBonus',
                data: { userbowId: that.data.userbowId || that.data.userbow._id },
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
                        wx.setNavigationBarColor({
                            frontColor: '#000000',
                            backgroundColor: '#4c4009'
                        })
                        wx.hideTabBar({
                            success() {
                                that.setData({ coinSuccessModal: true, code: res.data.code, extraInfoType: extraInfoType })
                            }
                        })
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
        wx.showTabBar()
        wx.setNavigationBarColor({
            frontColor: '#000000',
            backgroundColor: '#FFDB09'
        })
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
            backgroundColor: '#FFDB09'
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