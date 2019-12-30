const TimeUtil = require("../../utils/TimeUtil.js")
const NumberUtil = require("../../utils/NumberUtil.js")
import Wxml2Canvas from 'wxml2canvas'
Page({

    /**
     * 页面的初始数据
     */
    data: {
        session: null,
        user: null,
        imgs: [],
        authPhoto: true,
        coinSuccessModal: false,
        extraInfoType: 0,
        wxserviceError: false,
        wxserviceLoad: false,
        currentImgIndex: 0,
        scrollBoxWidth: 0
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        let that = this
        if (options.bowId) {
            that.data.bowId = options.bowId
        }
        if (options.userbowId) {
            that.data.userbowId = options.userbowId
        }
        if (options.shareby) {
            getApp().shareby = options.shareby
            that.data.shareby = options.shareby
        }
        getApp().loadSession(function(session) {
            that.data.session = session
            that.loadData(function() {
                if (options.userdakaId) {
                    getApp().request({
                        url: '/userapp/daka/visit',
                        data: { userdakaId: options.userdakaId },
                        method: 'POST',
                    })
                }
                if (getApp().location && that.data.bow && that.data.bow.shop.location) {
                    that.setData({ location: getApp().location, 'disStr': Number(NumberUtil.distance(getApp().location, that.data.bow.shop.location)).toFixed(1) + 'km' })
                }
            }, )
        })

    },

    loadData: function(cb) {
        let that = this
        getApp().request({
            url: '/userapp/bow/detail/load',
            data: { bowId: that.data.bowId, userbowId: that.data.userbowId, },
            method: 'POST',
            success: function(res) {
                let user = res.data.user
                let bow = res.data.bow
                that.data.bowId = bow._id
                let shop = res.data.shop
                let done = false
                let publicPics = shop.publicPics || [];
                let serverPics = []
                let caiPics = shop.caiPics || [];
                bow.originPriceStr = Number(bow.originPrice || 0).toFixed(2)
                let userbow = res.data.userbow
                bow.startTimeStr = TimeUtil.orderTime(bow.startTime)
                if (bow.coupon && bow.coupon.price) {
                    bow.coupon.price = Number(bow.coupon.price || 0).toFixed(0)
                }
                if (new Date(bow.startTime).getTime() > new Date().getTime()) {
                    bow.status = 0
                    that.data.startTime = new Date(bow.startTime).getTime()
                    that.runClock()
                } else {
                    bow.status = 1
                }
                if (shop.detailHTML) {
                    let content = shop.detailHTML.replace(/<img.*?>/g, ($) => {
                        return $.replace(/style=".*?"/g, "")
                    })
                    let fixContent = content.replace(/\<img/g, '<img style="width:100%;height:auto;display: block"')
                    let httpOfContent = fixContent.replace(/<img.*?>/g, ($) => {
                        return $.replace(/https:\/\/.*?.135editor.com/g, (res) => {
                            return res.replace(/https/, 'http')
                        })
                    })
                    let transContent = httpOfContent.replace(/translateZ[(].*[)]/g, 'none')
                    shop.detailHTML = transContent.replace(/width: [3-9]{1}\d{2,}px;/g, 'width:100%; ')
                }
                if(bow.shop){
                    bow.shop.tag1 = bow.tag1 || bow.shop.tag1
                    bow.shop.tag2 = bow.tag2 || bow.shop.tag2
                }
                if(shop.subshops && shop.subshops.length){
                    shop.subshops.map(item => {
                        item.distance = Number(NumberUtil.distance(getApp().location, item.location)).toFixed(1) + 'km' 
                    })
                }
                if (bow.cd && !userbow) {
                    let cdInterval = setInterval(() => {
                        bow.cd--
                        that.setData({
                            'bow.cd': bow.cd
                        })
                        if (!bow.cd) {
                            clearInterval(cdInterval)
                            cdInterval = null
                        }
                    }, 1000)
                }

                let comments = res.data.comments || []
                for (let comment of comments) {
                    comment.createTimeStr = TimeUtil.orderTime(comment.createTime)
                }

                let data = {
                    session: that.data.session,
                    user: user || null,
                    bow: bow || null,
                    userbow: userbow,
                    shop: shop || null,
                    done: done, //是否已经砍过
                    actions: res.data.actions,
                    showBack: getCurrentPages().length > 1,
                    winners: res.data.winners || null,
                    newBow: res.data.newBow || null,
                    comments: comments,
                    publicPics,
                    caiPics,
                    images: [{ url: shop.cover }, ...publicPics, ...serverPics, ...caiPics]
                }
                // 由扫码或识别二维码进入，不出现广告 // 已经出现过广告也不再出现
                if (!getApp().fromScan && userbow && !userbow.videoBonus) {
                    data.showAd = true
                }
                if (res.data.skipAd) {
                    data.showAd = false
                }

                if (bow.bonusCode && userbow && !userbow.confirmed) {
                    if (userbow.success) {
                        data.luckyModal = true
                    } else {
                        data.unluckyModal = true
                    }
                }


                wx.setNavigationBarTitle({
                    title: bow.shop.name
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

    onShow() {
        let that = this
        getApp().getAuth((res) => {
            let authPhoto = res.authSetting['scope.writePhotosAlbum']
            if (authPhoto) {
                that.setData({
                    authPhoto: true
                })
            }
        })

        if(getApp().unluckyModal){
            this.setData({
                bonusModal: false
            })
        }
    },

    onReady() {},

    handleGetShareCard() {
        let that = this
        if (that.data.imgs[0]) {
            that.setData({ shareModal: true })
            return
        }
        that.handleShareCardImage()
    },

    handleShareCardImage() {
        let that = this
        if (that.data.loading) {
            return
        }
        wx.showLoading()
        getApp().request({
            url: '/userapp/bow/detail/getQrcode',
            data: { bowId: that.data.bowId },
            method: 'POST',
            success: function(res) {
                if (res.data.success) {
                    that.data.shareQrcode = res.data.qrcode.url
                    wx.hideLoading()
                    that.setData({
                        shareModal: true,
                    }, () => {
                        if (that.data.bow.playbillType != 'custom') {
                            that.drawShareImage()
                        } else {
                            that.drawCustomShareImage()
                        }
                    })
                } else {
                    wx.hideLoading()
                    that.data.loading = false
                }
            },
        })
    },
    drawCustomShareImage() {
        let that = this
        let num = 1
        this.drawImage = new Wxml2Canvas({
            width: 750, // 宽， 以iphone6为基准，传具体数值，其他机型自动适配
            height: 1334, // 高
            element: 'canvas',
            background: '#ffffff',
            progress(percent) {
                that.setData({
                    percent: (percent * 1).toFixed(1)
                })
                if (percent == 100) {
                    that.setData({
                        showImage: true,
                    })
                }
            },
            finish(url) {
                let imgs = that.data.imgs;
                imgs.push(url);
                that.data.tempFilePath = url
                that.setData({
                    imgs
                })
            },
            error(res) {}
        });
        let data = {
            list: [{
                    type: 'image',
                    x: 0,
                    y: 0,
                    url: that.data.bow.playbill,
                    style: {
                        width: 375 * num,
                        height: 667 * num,
                    }
                },
                {
                    type: 'image',
                    x: that.data.bow.dx / 2,
                    y: that.data.bow.dy / 2,
                    url: that.data.shareQrcode,
                    style: {
                        width: 100 * num,
                        height: 100 * num,
                    }
                },
            ]
        }
        this.drawImage.draw(data);
    },
    drawShareImage() {
        let that = this;
        let bow = that.data.bow
        let num = 1
        let tagicon
        let tag1len = that.data.shop.tag1 ? that.data.shop.tag1.length : 0
        let tagHeight = tag1len ? 25 : 0
        let tag2 = that.data.shop.tag2 ? '"' + that.data.shop.tag2 + '"' : ''
        let tag2len = tag2 ? tag2.length : 0
        let name = that.data.bow.name.split('')
        name.length = 6
        name = name.join('')
        if (bow.nice) {
            tagicon = '/res/images/index_nice.png'
        }
        if (!bow.nice && bow.hot) {
            tagicon = '/res/images/index_hot.png'
        }
        this.drawImage = new Wxml2Canvas({
            width: 750 * num, // 宽， 以iphone6为基准，传具体数值，其他机型自动适配
            height: 1334 * num, // 高
            element: 'canvas',
            background: '#FFDB09',
            progress(percent) {
                that.setData({
                    percent: (percent * 1).toFixed(1)
                })
                if (percent == 100) {
                    that.setData({
                        showImage: true,
                    })
                }
            },
            finish(url) {
                let imgs = that.data.imgs;
                imgs.push(url);
                that.data.tempFilePath = url
                that.setData({
                    imgs
                })
            },
            error(res) {}
        });

        let data = {
            list: [{
                    type: 'image',
                    x: 0,
                    y: 0,
                    url: 'http://cdn.classx.cn/tandian/userapp/res/images/canvas_top_bow.png',
                    style: {
                        width: 375 * num,
                        height: 72 * num,
                    }
                }, {
                    type: 'rect',
                    x: 25 * num,
                    y: 72 * num,
                    style: {
                        fill: '#ffffff',
                        width: 325 * num,
                        height: 430 * num,
                        boxShadow: '0 0 10 rgba(7, 3, 2, 0.1)'
                    }
                },
                {
                    type: 'image',
                    x: 25 * num,
                    y: 72 * num,
                    url: that.data.shop.cover + '@sharecard',
                    style: {
                        width: 325 * num,
                        height: 162 * num,
                    }
                }, { // bowbox
                    type: 'rect',
                    x: 35 * num,
                    y: 250 * num,
                    style: {
                        width: 100 * num,
                        height: 132 * num,
                        fill: '#FFF9F0',
                        boxShadow: '0 0 10 rgba(173,173,173, 0.1)'
                    }
                }, {
                    type: 'image',
                    x: 45 * num,
                    y: 260 * num,
                    url: that.data.shop.avatar + '@avatar',
                    style: {
                        width: 80 * num,
                        height: 80 * num,
                    }
                }, {
                    type: 'text',
                    x: 50 * num,
                    y: 348 * num,
                    text: '价值 ￥' + (that.data.bow.originPrice || 0),
                    style: {
                        width: 70 * num,
                        color: '#FF4925',
                        fontSize: 12 * num,
                        textAlign: 'center'
                    }
                }, {
                    type: 'text',
                    x: 50 * num,
                    y: 364 * num,
                    text: name,
                    style: {
                        width: 70 * num,
                        color: '#666666',
                        fontSize: 10 * num,
                        textAlign: 'center',
                    }
                }, { //boxright
                    type: 'text',
                    x: 150 * num,
                    y: 251 * num,
                    text: that.data.shop.name,
                    style: {
                        width: 190 * num,
                        color: '#242627',
                        fontSize: 14 * num,
                        lineClamp: 1,
                        fontWeight: 'bold'
                    }
                }, {
                    type: 'text',
                    x: 150 * num,
                    y: 275 * num,
                    text: that.data.shop.address,
                    style: {
                        width: 190 * num,
                        color: '#999999',
                        fontSize: 12 * num,
                        lineClamp: 1,
                    }
                }, { //tag1
                    type: 'rect',
                    x: 150 * num,
                    y: 300 * num,
                    style: {
                        width: ((tag1len > 13 ? 13 : tag1len) * 12 + 10) * num,
                        height: tag1len >= 1 ? 20 * num : 0,
                        fill: '#FFF5E5'
                    }
                }, {
                    type: 'text',
                    x: 168 * num,
                    y: getApp().phoneSystem == 'iOS' ? 300 * num : 301 * num,
                    text: that.data.shop.tag1 || '',
                    style: {
                        width: (this.drawImage.measureWidth(that.data.shop.tag1, '12px PingFang SC') + 8) * num,
                        color: '#FE9E00',
                        fontSize: 12 * num,
                        lineClamp: tag1len > 13 ? 1 : 2,
                    }
                }, {
                    type: 'image',
                    x: 155 * num,
                    y: 304 * num,
                    url: '/res/images/index_tag.png',
                    style: {
                        width: that.data.shop.tag1 ? 10 * num : 0,
                        height: that.data.shop.tag1 ? 11 * num : 0
                    }
                }, { //tag2
                    type: 'rect',
                    x: 150 * num,
                    y: (300 + tagHeight) * num,
                    style: {
                        width: (this.drawImage.measureWidth(that.data.shop.tag2, '12px PingFang SC') + 28) * num,
                        height: tag2len >= 1 ? 20 * num : 0,
                        fill: '#FFF1EB'
                    }
                }, {
                    type: 'text',
                    x: 155 * num,
                    y: getApp().phoneSystem == 'iOS' ? (300 + tagHeight) * num : (301 + tagHeight) * num,
                    text: tag2,
                    style: {
                        width: (this.drawImage.measureWidth(tag2, '12px PingFang SC') + 10) * num,
                        color: '#FF6D26',
                        fontSize: 12 * num,
                        lineClamp: tag2len > 13 ? 1 : 2,
                    }
                }, {
                    type: 'text',
                    x: 150 * num,
                    y: 361 * num,
                    text: that.data.bow.startTimeStr + '开奖',
                    style: {
                        width: 190,
                        color: '#999999',
                        fontSize: 12 * num,
                        lineClamp: 1,
                    }
                }, {
                    type: 'text',
                    x: 40 * num,
                    y: 408 * num,
                    text: that.data.bow.name,
                    style: {
                        width: 200,
                        color: '#242627',
                        fontSize: 18 * num,
                        lineClamp: 1,
                        fontWeight: 'bold'
                    }
                }, {
                    type: 'text',
                    x: 40 * num,
                    y: 433 * num,
                    text: '0',
                    style: {
                        width: 200,
                        color: '#FF4925',
                        fontSize: 16 * num,
                        lineClamp: 1,
                    }
                }, {
                    type: 'text',
                    x: 52 * num,
                    y: 437 * num,
                    text: '元免费抽',
                    style: {
                        width: 200,
                        color: '#FF4925',
                        fontSize: 12 * num,
                        lineClamp: 1,
                    }
                }, {
                    type: 'text',
                    x: 40 * num,
                    y: 458 * num,
                    text: '长按图片，前往小程序参加',
                    style: {
                        width: 200 * num,
                        color: '#242627',
                        fontSize: 12 * num,
                    }
                }, {
                    type: 'image',
                    x: 255 * num,
                    y: 400 * num,
                    url: that.data.shareQrcode,
                    style: {
                        width: 80 * num,
                        height: 80 * num
                    }
                }, {
                    type: 'image',
                    x: 0 * num,
                    y: 501 * num,
                    url: 'http://cdn.classx.cn/tandian/userapp/res/images/canvas_bottom_bow.png',
                    style: {
                        width: 375 * num,
                        height: 166 * num
                    }
                }, {
                    type: 'text',
                    x: 0 * num,
                    y: 521 * num,
                    text: '还有更多霸王餐免费抽',
                    style: {
                        width: 375 * num,
                        color: '#242627',
                        fontSize: 16 * num,
                        textAlign: 'center',
                        fontWeight: 'bold'
                    }
                }, {
                    type: 'image',
                    x: 35 * num,
                    y: 247 * num,
                    url: tagicon,
                    style: {
                        width: 32 * num,
                        height: 20 * num
                    }
                }
            ]
        }
        this.drawImage.draw(data);
    },
    handleSaveImg() {
        let that = this
        this.setData({
            showImage: false
        }, () => {
            wx.showToast({
                title: '',
                icon: 'loading',
            })
            if (that.data.tempFilePath) {
                that.onSaveShareCard()
            }
        })
    },
    onSaveShareCard() {
        let that = this
        if (that.data.saving) return
        that.setData({ saving: true })
        wx.showLoading({ title: '保存中' })
        setTimeout(() => {
            if (that.data.saving) {
                that.setData({ saving: false })
                wx.hideLoading()
            }
        }, 10000);
        wx.saveImageToPhotosAlbum({
            filePath: that.data.tempFilePath,
            success(data) {
                wx.hideLoading()
                that.setData({ saving: false, saved: true })
                wx.previewImage({
                    current: that.data.tempFilePath,
                    urls: [that.data.tempFilePath],
                    success: function() {
                        that.hideShareModal()
                    }
                })
                that.setData({
                    showImage: true
                })
            },
            fail(err) {
                wx.hideLoading()
                that.setData({ saving: false, saved: true })
                wx.previewImage({
                    current: that.data.tempFilePath,
                    urls: [that.data.tempFilePath],
                    success: function() {
                        that.hideShareModal()
                    }
                })
                that.setData({
                    showImage: true,
                })
            }
        })
    },

    hideShareModal() {
        let that = this
        that.setData({
            shareModal: false
        })
    },

    getCoupon: function() {
        let that = this
        if (that.data.usercouponId || (that.data.userbow && that.data.userbow.couponGet)) {
            that.data.usercouponId = that.data.usercouponId || that.data.userbow.couponGet.usercoupon._id
            that.toCouponDetail()
            return
        }
        if (that.data.loading) return
        that.data.loading = true
        wx.showLoading({ title: '' })
        getApp().request({
            url: '/userapp/main/coupon/get',
            data: { couponId: that.data.bow.coupon._id, from: { bow: { _id: that.data.bowId, }, userbow: { _id: that.data.userbowId || that.data.userbow._id }, page: '/pages/bow/detail' } },
            method: 'POST',
            success: function(res) {
                if (res.data.success) {
                    wx.hideLoading()
                    that.data.loading = false
                    that.data.usercouponId = res.data.usercouponId
                    if (that.data.usercouponId) {
                        that.setData({
                            bonusModal: true,
                        })
                        that.hideUnluckyModal()
                    }
                } else {
                    wx.hideLoading()
                    that.data.loading = false
                }
            },
        })
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {
        let that = this
        let imageUrl = that.data.bow.cover + '@share'
        let append = ''
        // if (that.data.userbow) {
        //     append = '&userbowId=' + that.data.userbow._id
        // }
        append = '&shareby=' + that.data.user._id
        let path = '/pages/main/index?bowId=' + that.data.bow._id + append
        let title = that.data.bow.shareTitle || '免费抽' + that.data.bow.shop.name + that.data.bow.name
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
        let startTime = that.data.startTime
        if (startTime <= new Date().getTime()) {
            that.loadData()
            return
        }
        clock.hour = Math.floor((startTime - new Date().getTime()) / (1000 * 60 * 60))
        clock.min = Math.floor(((startTime - new Date().getTime()) % (1000 * 60 * 60)) / (1000 * 60))
        clock.sec = Math.floor((((startTime - new Date().getTime()) % (1000 * 60 * 60)) % (1000 * 60)) / 1000)
        clock.hour = that.clockStr(clock.hour)
        clock.min = that.clockStr(clock.min)
        clock.sec = that.clockStr(clock.sec)
        that.setData({ clock: clock })
        setTimeout(() => {
            that.runClock()
        }, 1000);
    },
    clockStr(time) {
        if (time < 10) {
            time = '0' + time
        }
        return time
    },

    authThenToBuy: function(e) {
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
                    that.toBuy()
                }
            })
        } else {
            that.data.loading = false
            wx.hideLoading()
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
                    that.join()
                }
            })
        } else {
            that.data.loading = false
            wx.hideLoading()
        }
    },

    // toHelp: function() {
    //     let that = this
    //     that.kan()
    // },
    join: function() {
        let that = this
        let joinToday = that.data.user.joinToday || 0
        if (that.data.bow.cd) {
            wx.showModal({
                title: '提示',
                content: '请' + that.data.bow.cd + '秒后抽奖',
                showCancel: false,
                success(res) {
                    if (res.confirm) {
                        console.log('用户点击确定')
                    } else if (res.cancel) {
                        console.log('用户点击取消')
                    }
                }
            })
            return
        }
        if ((that.data.user.more || 0) - joinToday + 5 <= 0) {
            that.setData({
                newChanceModal: true
            })
            return
        }
        if (that.data.shop.functions.sms && that.data.shop.functions.sms.online && !that.data.user.phone) {
            that.setData({ bindPhoneModal: true })
            return
        }
        if (that.data.loading) return
        wx.showLoading({ title: '' })
        that.data.loading = true
        getApp().request({
            url: '/userapp/bow/detail/join',
            data: { bowId: that.data.bowId, shareby: that.data.shareby },
            method: 'POST',
            success: function(res) {
                that.data.loading = false
                wx.hideLoading()
                if (res.data.success) {
                    wx.vibrateShort()
                    that.loadData()
                    let showAd = that.data.showAd || false
                    if (res.data.skipAd) showAd = false
                    that.setData({ successModal: true, code: res.data.code, showAd: showAd })
                    getApp().bowsChanged = true
                }
            },
        })
    },
    hideBindPhoneModal: function() {
        let that = this
        that.setData({ bindPhoneModal: false })
    },
    hideSuccessModal: function() {
        let that = this
        that.setData({ successModal: false })
    },
    toCouponDetail: function() {
        let that = this
        that.hideUnluckyModal()
        getApp().unluckyModal = true
        wx.navigateTo({
            url: '/pages/coupon/detail?couponId=' + that.data.bow.coupon._id + '&usercouponId=' + that.data.usercouponId
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
    onEditorReady: function() {
        const that = this
        that.data.editorReady = true
        if (that.data.bow) {
            that.showEditor()
        }
    },

    showEditor() {
        const that = this
        wx.createSelectorQuery().select('#editor').context(function(res) {
            that.editorCtx = res.context
            if (that.editorCtx && that.data.bow && that.data.bow.detailHTML) {
                that.editorCtx.setContents({ html: that.data.bow.detailHTML })
            }
            wx.pageScrollTo({ scrollTop: 0 })
            that.setData({ androidHTMLLoading: false })
        }).exec()
    },

    callShop: function(e) {
        let that = this
        let item = e.currentTarget.dataset.item
        if (!item) item = that.data.shop
        if (!item.contact) {
            wx.showToast({
                title: '无联系方式',
                icon: 'none'
            })
            return
        }
        wx.makePhoneCall({
            phoneNumber: item.contact
        })
    },

    toUse: function(e) {
        let that = this
        let usercoupon = e.currentTarget.dataset.usercoupon
        that.hideLuckyModal()
        wx.navigateTo({
            url: '/pages/coupon/detail?couponId=' + that.data.bow.bonus._id + '&usercouponId=' + usercoupon._id
        })
    },


    openLocation: function(e) {
        let that = this
        let item = e.currentTarget.dataset.item
        if (!item) item = that.data.shop
        wx.openLocation({
            longitude: item.location[0],
            latitude: item.location[1],
            name: item.name,
            address: item.address
        })
    },

    handleShowAddrList(){
        this.setData({
            showAddrListModal: true
        })
    },

    hideAddrListModal(){
        this.setData({
            showAddrListModal: false
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
                type: '霸王餐抽奖',
            },
            method: 'POST'
        })
    },

    hideLuckyModal: function() {
        let that = this
        that.setData({ luckyModal: false })
        if (!that.data.userbow && that.data.userbow.confirmed) {
            getApp().request({
                url: '/userapp/bow/detail/confirmed',
                data: { userbowId: that.data.userbowId || that.data.userbow._id },
                method: 'POST',
                success: function(res) {
                    if (res.data.success) { that.setData('userbow.confirmed', true) }
                }
            })
        }
    },
    hideUnluckyModal: function() {
        let that = this
        that.setData({ unluckyModal: false })
        if (!that.data.userbow && that.data.userbow.confirmed) {
            getApp().request({
                url: '/userapp/bow/detail/confirmed',
                data: { userbowId: that.data.userbowId || that.data.userbow._id },
                method: 'POST',
                success: function(res) {
                    if (res.data.success) { that.setData('userbow.confirmed', true) }
                }
            })
        }
    },


    back: function() {
        let that = this
        wx.navigateBack()
    },

    toUserbows: function() {
        let that = this
        if (!that.data.bow.data.join) {
            return
        }
        wx.navigateTo({
            url: '/pages/bow/userbows?bowId=' + that.data.bowId
        })
    },
    toBowRule: function() {
        let that = this
        wx.navigateTo({
            url: '/pages/bow/rule?bowId=' + that.data.bowId
        })
    },
    toSubshops: function() {
        let that = this
        wx.navigateTo({
            url: '/pages/main/subshops?shopId=' + that.data.shop._id
        })
    },
    toUseCoin: function() {
        let that = this
        if (that.data.loading) return
        that.data.loading = true
        getApp().request({
            url: '/userapp/bow/detail/useCoin',
            data: { userbowId: that.data.userbowId || that.data.userbow._id },
            method: 'POST',
            success: function(res) {
                that.data.loading = false
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
                    that.setData({ coinSuccessModal: true, extraInfoType: extraInfoType, code: res.data.code })
                }
            },
        })
    },
    hideCoinSuccessModal: function() {
        let that = this
        that.setData({ coinSuccessModal: false })
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
    showVideo: function() {
        let that = this
        if (that.data.userbow.videoBonus) { return }
        if (that.data.ading) { return }
        that.setData({ ading: true })
        if (wx.createRewardedVideoAd) {
            if (!that.data.videoAd) {
                that.data.videoAd = wx.createRewardedVideoAd({
                    adUnitId: 'adunit-c6b20b16dcdaea4e'
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
                        that.setData({ coinSuccessModal: true, successModal: false, code: res.data.code, extraInfoType: extraInfoType })
                    }
                },
            })
        }
    },
    toNewBow: function() {
        let that = this
        wx.navigateTo({
            url: '/pages/bow/detail?bowId=' + that.data.newBow._id
        })
    },
    setPhoneThenJoin: function(e) {
        let that = this
        if (that.data.loading) {
            return
        }
        that.data.loading = true
        wx.showLoading({
            title: ''
        })
        if (e.detail && e.detail.iv && e.detail.encryptedData) {
            getApp().request({
                url: '/userapp/session/bindPhone',
                method: 'POST',
                data: {
                    userData: e.detail
                },
                success: function(res) {
                    if (res.statusCode == 200) {
                        let phone = res.data
                        getApp().session.u.phone = phone
                        that.setData({ 'session.u.phone': phone, 'user.phone': phone })
                        that.data.loading = false
                        wx.hideLoading()
                        that.hideBindPhoneModal()
                        that.join(e)
                    } else {
                        that.data.loading = false
                        wx.hideLoading()
                    }
                },
            })
        } else {
            that.data.loading = false
            wx.hideLoading()
        }
    },
    toBuy: function() {
        let that = this
        getApp().request({
            url: '/userapp/bow/loadPrices',
            data: { bowId: that.data.bowId },
            method: 'POST',
            success: function(res) {
                let kanjia = res.data.kanjia || null
                if (kanjia) {
                    kanjia.targetPriceStr = Number(kanjia.targetPrice).toFixed(2)
                }
                let pintuan = res.data.pintuan || null
                if (pintuan) {
                    pintuan.targetPriceStr = Number(pintuan.targetPrice).toFixed(2)
                }
                that.setData({ kanjia, pintuan, })
            },
        })
        that.setData({ buyModal: true })
    },
    hideBuyModal: function() {
        let that = this
        that.setData({ buyModal: false })
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
                itemType: 'bow',
                itemId: that.data.bow._id
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
                    let couponExpiry
                    wx.vibrateShort()
                    that.loadData()
                    if (res.data.usercoupon) {
                        couponExpiry = TimeUtil.orderTime(usercoupon.expiryTime)
                    }
                    that.setData({
                        buyModal: false,
                        paidModal: true,
                        usercoupon: res.data.usercoupon,
                        couponExpiry
                    })
                }
            },
        })
    },
    hidePaidModal: function() {
        let that = this
        that.setData({ paidModal: false })
    },
    toLicense(e) {
        let license = e.currentTarget.dataset.license
        wx.navigateTo({
            url: '/pages/main/license?license=' + license
        })
    },

    toKanjia: function() {
        let that = this
        wx.navigateTo({
            url: '/pages/kanjia/detail?kanjiaId=' + that.data.kanjia._id + '&autoJoin=1'
        })
    },
    toShop() {
        wx.navigateTo({
            url: '/pages/shop/detail?shopId=' + this.data.shop._id
        })
    },
    handlePreviewImg(e) {
        let that = this
        let img = e.currentTarget.dataset.image
        wx.previewImage({
            current: img, // 当前显示图片的http链接
            urls: [img] // 需要预览的图片http链接列表
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
            url: '/userapp/bow/report',
            data: {
                bowId: that.data.bowId
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
                        title: '您已举报成功，我们会尽快审核',
                        icon: 'none',
                        duration: 2000
                    })
                }
            },
        })
    },
    toTasks: function() {
        let that = this
        wx.navigateTo({
            url: '/pages/main/tasks'
        })
    },
    hideNewChanceModal() {
        this.setData({
            newChanceModal: false
        })
    },
    wxserviceLoad: function(r) {
        let that = this
        that.setData({ wxserviceLoad: true })
    },
    wxserviceError: function(r) {
        let that = this
        that.setData({ wxserviceError: true })
    },
    handleToIndex() {
        wx.switchTab({
            url: '/pages/main/index'
        })
    },
    handleScrollImg(e) {
        let that = this;
        let index = e.detail.scrollLeft / 87;
        const query = wx.createSelectorQuery().in(this);

        if (!that.data.scrollBoxWidth) {
            query
                .select('.scrollbox')
                .boundingClientRect(function(res) {
                    that.data.scrollBoxWidth = res.width;
                })
                .exec();
        }

        if (e.detail.scrollLeft < 0) {
            index = 0;
        }

        if (e.detail.scrollLeft > e.detail.scrollWidth - that.data.scrollBoxWidth) {
            index = this.data.imgs.length - 3;
        }

        this.setData({
            currentImgIndex: Math.floor(index)
        });
    },
    handleShowImg(e) {
        let index = e.currentTarget.dataset.index;
        this.setData({
            currentImgIndex: index
        });
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
    handleSwiperCurrent(e) {
        this.setData({
            swiperIndex: e.detail.current + 1
        })
    },
    handleShowSwiperImg(e){
        let that = this
        let type = e.currentTarget.dataset.type
        if(type == 'pub'){
            this.setData({
                swiperCurrent: 1
            })
        }else{
            this.setData({
                swiperCurrent: that.data.publicPics.length + 1
            })
        }
    },
    handleDrawimg() {
        wx.showToast({
            title: '图片正在绘制...',
            icon: 'none'
        })
    },
    oncall(e){
        let phoneNumber = e.currentTarget.dataset.phonenumber
        wx.makePhoneCall({
            phoneNumber: phoneNumber
        })
    },
    onSelectPhone(){
        this.setData({
            callModal: true
        })
    },
    onHideCallModal(){
        this.setData({
            callModal: false
        })
    }
})