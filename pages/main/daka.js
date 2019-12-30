const TimeUtil = require("../../utils/TimeUtil.js")
import Wxml2Canvas from 'wxml2canvas'
Page({

    /**
     * 页面的初始数据
     */
    data: {
        session: null,
        shop: null,
        ranks: null,
        useIndex: null,
        imgs: []
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        let that = this
        this.options = options
        this.doLoad()
        // this.initCustomNav()
    },
    doLoad: function() {
        let that = this
        let options = this.options
        // that.data.shopId = options.shopId
        // that.data.userdakaId = options.userdakaId
        // getApp().loadSession(function(session) {
        //     that.data.session = session
        //     that.loadData()
        // })

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
            if (options.dakaShopId || options.shopId) {
                that.data.shopId = options.dakaShopId || options.shopId
                that.data.userdakaId = options.userdakaId
                getApp().loadSession(function(session) {
                    that.data.session = session
                    that.loadData()
                })
            } else {
                wx.switchTab({ url: '/pages/main/index' })
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
            if (qrcode.dakaShopId || qrcode.shopId) {
                that.data.shopId = qrcode.dakaShopId || qrcode.shopId
                that.data.userdakaId = null
                getApp().loadSession(function(session) {
                    that.data.session = session
                    that.loadData()
                })
            } else {
                wx.switchTab({ url: '/pages/main/index' })
            }
        }
    },

    loadData: function(cb) {
        let that = this
        getApp().request({
            url: '/userapp/main/daka/load',
            data: { shopId: that.data.shopId, userdakaId: that.data.userdakaId },
            method: 'POST',
            success: function(res) {
                let targets
                let stage
                let shop = res.data.shop
                let user = res.data.user
                let userdaka = res.data.userdaka
                let ranks = res.data.ranks
                targets = shop.functions.daka.targets || []
                let playbillType = shop.functions.daka.playbillType || null
                let dx = shop.functions.daka.dx || 0
                let dy = shop.functions.daka.dy || 0
                let playbill = shop.functions.daka.playbill
                let cover = shop.functions.daka.cover
                if (userdaka) {
                    that.data.userdakaId = userdaka._id
                    let in24hour = new Date(new Date(userdaka.createTime).getTime() + 1000 * 60 * 60 * 24)
                    if (userdaka.bonus && new Date().getTime() < in24hour.getTime()) {
                        userdaka.refreshTimeStr = TimeUtil.orderTime(in24hour)
                    }
                }
                if (shop && shop.functions && shop.functions.daka && userdaka) {
                    userdaka.data.uv = userdaka.data.uv || 0
                }
                if (ranks.length >= 3) {
                    ranks = [ranks[1], ranks[0], ranks[2]]
                }
                that.setData({
                    session: that.data.session,
                    shop: shop || null,
                    user: user,
                    userdaka: userdaka,
                    targets: targets,
                    stage: stage || 0,
                    visits: res.data.visits,
                    showBack: getCurrentPages().length > 1,
                    saved: false,
                    ranks: ranks,
                    myrank: res.data.myrank,
                    playbillType,
                    dx,
                    dy,
                    playbill,
                    cover
                })
                if (cb) cb()
            },
        })
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function() {
        if (getApp().systemError) {
            getApp().systemError = null
            this.doLoad()
            return
        }
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
        if (getApp().systemError) {
            getApp().systemError = null
            this.doLoad()
            return
        }
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {
        let that = this
        let path = '/pages/main/index'
        let title = ''
        return {
            title: title,
            path: path,
        }
    },
    initCustomNav() {
        let that = this
        that.setData({
            statusBarHeight: wx.getSystemInfoSync().statusBarHeight,
            navHeight: 45,
        })
    },
    toJoin: function() {
        let that = this
        if (that.data.userdaka && that.data.userdaka.used) {
            return
        }
        if (that.data.userdaka) {
            that.showUserdakaModal()
        } else {
            if (that.data.loading) {
                return
            }
            that.data.loading = true
            wx.showLoading({
                title: ''
            })
            getApp().request({
                url: '/userapp/daka/join',
                data: { shopId: that.data.shopId },
                method: 'POST',
                success: function(res) {
                    wx.hideLoading()
                    that.data.loading = false
                    if (res.data.success) {
                        wx.vibrateShort()
                        that.loadData(function() {
                            that.showUserdakaModal()
                        }, )
                    }
                },
            })
        }
    },
    showUserdakaModal: function() {
        let that = this
        if (that.data.userdaka.sharecode) {
            that.setData({ userdakaModal: true, giftModal: false, qrcodeModal: false, useModal: false })
            return
        } 
        if(that.data.cover){
            console.log(132);
            
            that.setData({ userdakaModal: true, giftModal: false, useModal: false })
            getApp().request({
                url: '/userapp/daka/getSharecode',
                data: { userdakaId: that.data.userdaka._id },
                method: 'POST',
                success: function(res) {
                    that.setData({ 'userdaka.sharecode': res.data.qrcode })
                },
            })
        }else{
            console.log(168);
            that.handleShareCardImage()
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
    hideUserdakaModal: function() {
        let that = this
        that.setData({ userdakaModal: false })
    },
    back: function() {
        let that = this
        wx.navigateBack()
    },
    toBonus: function() {
        let bonus = this.data.userdaka.bonus
        let item = bonus
        let type = item.type
        if (type == 'usercoupon') {
            wx.navigateTo({
                url: '/pages/coupon/detail?couponId=' + item.usercoupon.coupon._id + '&usercouponId=' + item.usercoupon._id
            })
        }
        if (type == 'wheel') {
            wx.navigateTo({
                url: '/pages/wheel/detail?wheelId=' + item.wheel._id
            })
        }
        // let usercoupon = e.currentTarget.dataset.usercoupon
        // wx.navigateTo({
        //     url: '/pages/coupon/detail?couponId=' + usercoupon.coupon._id + '&usercouponId=' + usercoupon._id
        // })
        // let that = this
        // that.setData({ qrcodeModal: true, giftModal: false })
        // if (that.data.userdaka && !that.data.userdaka.qrcode) {
        //     that.getQrcode(function() {
        //     }, )
        // } else {
        // }
    },
    toUse: function() {
        let that = this
        if (!that.data.userdaka) { return }
        that.setData({ useModal: true })
    },
    hideUseModal: function() {
        let that = this
        that.setData({ useModal: false })
    },

    toVisits() {
        let that = this
        wx.navigateTo({
            url: '/pages/daka/visits?userdakaId=' + that.data.userdakaId
        })
    },
    showGiftModal(e) {
        let uv
        let item = e.currentTarget.dataset.item
        if (this.data.userdaka && this.data.userdaka.used) {
            return
        }
        if (this.data.userdaka) {
            uv = this.data.userdaka.data.uv
        }
        if (uv && (uv >= item.value)) {
            this.toUse(e)
        } else {
            this.setData({
                giftModal: true,
                giftData: item
            })
        }
    },
    hideGiftModal() {
        this.setData({
            giftModal: false
        })
    },
    doNothing: function() {
        let that = this

    },
    saveImage: function() {
        let that = this
        if (!that.data.userdaka.sharecode) return
        if (that.data.saving) return
        that.setData({ saving: true })
        wx.showLoading({ title: '保存中' })
        setTimeout(() => {
            if (that.data.saving) {
                that.setData({ saving: false })
                wx.hideLoading()
            }
        }, 10000);
        if (that.data.playbillType == 'system') {
            wx.saveImageToPhotosAlbum({
                filePath: that.data.userdaka.sharecode,
                success(data) {
                    wx.hideLoading()
                    that.setData({ saving: false, saved: true })
                },
                fail(err) {
                    saveFailed()
                }
            })
        } else {
            wx.downloadFile({
                url: that.data.userdaka.sharecode,
                success(res) {
                    if (res.statusCode === 200) {
                        wx.saveImageToPhotosAlbum({
                            filePath: res.tempFilePath,
                            success(res) {
                                wx.hideLoading()
                                that.setData({ saving: false, saved: true })
                            },
                            fail() {
                                saveFailed()
                            },
                        })
                    } else {
                        saveFailed()
                    }
                },
                fail() {
                    saveFailed()
                },
            })
        }

        function saveFailed() {
            wx.hideLoading()
            that.setData({ saving: false, saved: true })
            wx.previewImage({
                current: that.data.userdaka.sharecode,
                urls: [that.data.userdaka.sharecode]
            })
        }
    },
    hideTips() {
        this.setData({
            showTips: false
        })
    },
    openImage: function() {
        let that = this
        if (!that.data.userdaka.sharecode) return
        wx.previewImage({
            current: that.data.userdaka.sharecode,
            urls: [that.data.userdaka.sharecode]
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
                type: '打卡',
            },
            method: 'POST'
        })
    },
    handleCopyShareTitle(e) {
        let that = this
        let share = e.currentTarget.dataset.share
        wx.setClipboardData({
            data: share,
            success(res) {
                // wx.showToast({
                //     title: '分享语已复制',
                //     icon: 'none'
                // })
                that.setData({ copyed: true })
            },
            fail(res) {
                wx.showToast({
                    title: res,
                    icon: 'none'
                })
            }
        })
    },
    handlePreviewImage(e) {
        let img = e.currentTarget.dataset.img
        wx.previewImage({
            current: img, // 当前显示图片的http链接
            urls: [img] // 需要预览的图片http链接列表
        })
    },
    useIndexChanged(e) {
        let that = this
        let index = e.currentTarget.dataset.index
        if (that.data.userdaka.data.uv < that.data.targets[index].value) {
            return
        }
        that.setData({ useIndex: index })
    },
    continue: function() {
        let that = this
        that.showUserdakaModal()
    },
    use: function() {
        let that = this
        if (that.data.userdaka && that.data.userdaka.data.uv < that.data.targets[0].value) {
            wx.showToast({
                title: '暂无可兑换的奖励',
                icon: 'none'
            })
            return
        }
        if (that.data.useIndex != 0 && !that.data.useIndex) {
            wx.showToast({
                title: '请选择一个奖励',
                icon: 'none'
            })
            return
        }
        if (that.data.loading) { return }
        that.data.loading = true
        getApp().request({
            url: '/userapp/daka/bonus',
            data: { userdakaId: that.data.userdakaId || that.data.userdaka._id, index: that.data.useIndex },
            method: 'POST',
            success: function(res) {
                if (res.data.success) {
                    that.data.loading = false
                    wx.vibrateShort()
                    that.loadData()
                    that.setData({ useModal: false })
                    wx.showToast({
                        title: '兑换成功',
                        icon: 'none'
                    })
                }
            },
        })
    },
    handleShareCardImage() {
        let that = this
        if (that.data.loading) {
            return
        }
        wx.showLoading()
        getApp().request({
            url: '/userapp/daka/share/default',
            data: { userdakaId: that.data.userdakaId },
            method: 'POST',
            success: function(res) {
                if (res.data.success) {
                    that.data.shareQrcode = res.data.qrcode
                    if (res.data.bow) {
                        res.data.bow.originPrice = Number(res.data.bow.originPrice || 0).toFixed(2)
                    }
                    that.data.bow = res.data.bow
                    wx.hideLoading()
                    that.setData({
                        userdakaModal: true,
                    }, () => {
                        if(that.data.playbillType == 'system'){
                            that.drawShareImage()
                        }else{
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
    drawCustomShareImage(){
        let that = this
        let num = 1
        this.drawImage = new Wxml2Canvas({
            width: 750 , // 宽， 以iphone6为基准，传具体数值，其他机型自动适配
            height: 1334, // 高
            element: 'canvas',
            background: '#ffffff',
            progress(percent) {
                that.setData({
                    percent: (percent*1).toFixed(1)
                })
                if (percent == 100) {
                    that.setData({
                        showImage: true,
                    })
                }
            },
            finish(url) {
                that.data.tempFilePath = url
                that.setData({
                    'userdaka.sharecode': url
                })
            },
            error(res) {}
        });
        
        let data = {
            list: [{
                    type: 'image',
                    x: 0,
                    y: 0,
                    url: that.data.playbill,
                    style: {
                        width: 375 * num,
                        height: 667 * num,
                    }
                },
                {
                    type: 'image',
                    x: that.data.dx / 2,
                    y: that.data.dy / 2,
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
        if(bow.nice){
            tagicon = '/res/images/index_nice.png'
        }
        if(!bow.nice && bow.hot){
            tagicon = '/res/images/index_hot.png'
        }
        this.drawImage = new Wxml2Canvas({
            width: 750 * num, // 宽， 以iphone6为基准，传具体数值，其他机型自动适配
            height: 1334 * num, // 高
            element: 'canvas',
            background: '#FFDB09',
            progress(percent) {
                that.setData({
                    percent: (percent*1).toFixed(1)
                })
                if (percent == 100) {
                    that.setData({
                        showImage: true,
                    })
                }
            },
            finish(url) {
                that.data.tempFilePath = url
                that.setData({
                    'userdaka.sharecode': url
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
                    url: that.data.bow.thumb ? that.data.bow.thumb + '@avatar' : that.data.shop.avatar + '@avatar',
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
                        width: (this.drawImage.measureWidth(that.data.shop.tag1,'12px PingFang SC') + 8) * num,
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
                        width: (this.drawImage.measureWidth(that.data.shop.tag2,'12px PingFang SC') + 28) * num,
                        height: tag2len >= 1 ? 20 * num : 0,
                        fill: '#FFF1EB'
                    }
                }, {
                    type: 'text',
                    x: 155 * num,
                    y: getApp().phoneSystem == 'iOS' ? (300 + tagHeight) * num : (301 + tagHeight) * num,
                    text: tag2,
                    style: {
                        width: (this.drawImage.measureWidth(tag2,'12px PingFang SC') + 10) * num,
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
    handleDrawimg() {
        wx.showToast({
            title: '图片正在绘制...',
            icon: 'none'
        })
    }
})