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
        noticeForm: { price: 10, priceStr: '10.00' },
        currentImgIndex: 0,
        scrollBoxWidth: 0,
        orderForm: { time: 1 },
        imgs: [],
        authPhoto: true,
        swiperIndex: 1
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        let that = this
        if (options.gouId) {
            that.data.gouId = options.gouId
        }
        if (options.usergouId) {
            that.data.usergouId = options.usergouId
        }
        if (options.autoJoin) {
            that.data.autoJoin = options.autoJoin
        }
        if (options.shareby) {
            getApp().shareby = options.shareby
            that.data.shareby = options.shareby
        }
        getApp().loadSession(function(session) {
            that.data.session = session
            that.loadData(function() {
                if (that.data.autoJoin && !that.data.usergou) {
                    that.toJoin()
                }
                if (getApp().location && that.data.gou && that.data.gou.shop.location) {
                    that.setData({ location: getApp().location, 'disStr': Number(NumberUtil.distance(getApp().location, that.data.gou.shop.location)).toFixed(1) + 'km' })
                }
            }, )
        })
    },



    loadData: function(cb) {
        let that = this
        getApp().request({
            url: '/userapp/gou/detail/load',
            data: { gouId: that.data.gouId, usergouId: that.data.usergouId, },
            method: 'POST',
            success: function(res) {
                let user = res.data.user
                let gou = res.data.gou
                let shop = res.data.shop
                let done = false
                let publicPics = shop.publicPics || [];
                let serverPics = shop.serverPics || [];
                let caiPics = shop.caiPics || [];
                let usergou = res.data.usergou
                let usercoupon = res.data.usercoupon
                let vipBonus = false

                gou.kanPriceStr = Number(gou.price || 0).toFixed(2)
                let todayStart = new Date(new Date().setHours(0, 0, 0, 0))
                if (user.vip && (!user.lastConsumeTime || new Date(user.lastConsumeTime) < todayStart)) {
                    vipBonus = true
                    gou.price = gou.price / 2
                }

                gou.originPriceStr = Number(gou.originPrice || 0).toFixed(2)
                gou.targetPriceStr = Number(gou.targetPrice || 0).toFixed(2)
                gou.priceStr = Number(gou.price || 0).toFixed(2)
                if (usergou) {
                    that.data.usergouId = usergou._id
                    usergou.valueStr = Number(usergou.value || 0).toFixed(2)
                    usergou.priceStr = Number(usergou.price).toFixed(2)
                }
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
                if(gou.shop){
                    gou.shop.feature = gou.feature || gou.shop.feature
                    gou.shop.cpi = gou.cpi || gou.shop.cpi
                    gou.shop.tag1 = gou.tag1 || gou.shop.tag1
                    gou.shop.tag2 = gou.tag2 || gou.shop.tag2
                }
                if(shop.subshops && shop.subshops.length){
                    shop.subshops.map(item => {
                        item.distance = Number(NumberUtil.distance(getApp().location, item.location)).toFixed(1) + 'km' 
                    })
                }
                if (usergou && usergou.order && !usergou.order.paid && new Date(usergou.order.expiryTime) > new Date()) {
                    usergou.paying = true
                }
                let comments = res.data.comments || []
                for (let comment of comments) {
                    comment.createTimeStr = TimeUtil.orderTime(comment.createTime)
                }
                let gounotice = res.data.gounotice
                if (gounotice) {
                    gounotice.priceStr = Number(gounotice.price).toFixed(2)
                }
                if (usercoupon) {
                    let startTime = new Date(usercoupon.createTime).setHours(0, 0, 0, 0)
                    let couponExpiry = TimeUtil.orderTime(usercoupon.expiryTime)
                    let currentTime = new Date().getTime()
                    let day = Math.floor((currentTime - startTime) / (24 * 60 * 60 * 1000))
                    that.setData({
                        remanentDay: (30 - day) > 0 ? (30 - day) : 0,
                        couponExpiry
                    })
                }
                if (user.vip) {
					user.vip.expiryTimeStr = TimeUtil.toYYMMDD(user.vip.expiryTime);
				}
                let data = {
                    session: that.data.session,
                    user: user || null,
                    gou: gou || null,
                    usergou: usergou,
                    usercoupon: res.data.usercoupon,
                    shop: shop || null,
                    done: done, //是否已经砍过
                    actions: res.data.actions,
                    showBack: getCurrentPages().length > 1,
                    gounotice: gounotice,
                    comments: comments,
                    publicPics,
                    caiPics,
                    images: [{ url: shop.cover }, ...publicPics, ...serverPics, ...caiPics],
                    vipBonus
                }
                if (gounotice) {
                    data.noticeForm = { price: gounotice.price, priceStr: gounotice.priceStr }
                }
                wx.setNavigationBarTitle({
                    title: shop.name
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
        let imageUrl = that.data.shop.cover + '@share'
        let append = ''
        if (that.data.user) {
            append = '&shareby=' + that.data.user._id
        }
        let path = '/pages/main/index?gouId=' + that.data.gou._id + append
        let title = that.data.gou.shareTitle || that.data.gou.shop.name + that.data.gou.name
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
    toJoin: function() {
        let that = this
        that.join()
    },
    join: function() {
        let that = this
        if (that.data.loading) return
        if (that.data.gou.status != 1) {
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
            url: '/userapp/gou/detail/join',
            data: { gouId: that.data.gouId, usergouId: that.data.usergouId },
            method: 'POST',
            success: function(res) {
                that.data.loading = false
                wx.hideLoading()
                if (res.data.success) {
                    wx.vibrateShort()
                    let usergou = res.data.usergou
                    usergou.valueStr = Number(usergou.value).toFixed(2)
                    usergou.priceStr = Number(usergou.price).toFixed(2)
                    that.data.usergouId = usergou._id
                    if (that.data.user.vip) {
                        that.data.gou.price = usergou.price / 2
                    }
                    that.data.gou.priceStr = Number(that.data.gou.price || 0).toFixed(2)
                    that.setData({ joinModal: true, usergou: usergou,gou: that.data.gou })
                    that.loadData()
                    getApp().gousChanged = true
                } else if (res.data.usergou) {
                    that.data.usergouId = res.data.usergou._id
                    that.loadData()
                }
            },
        })
    },
    toGou() {
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
    hideJoinModal: function() {
        let that = this
        that.setData({ joinModal: false })
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
            url: '/pages/gou/rule'
        })
    },
    onEditorReady: function() {
        const that = this
        that.data.editorReady = true
        if (that.data.gou) {
            that.showEditor()
        }
    },
    showEditor() {
        const that = this
        wx.createSelectorQuery().select('#editor').context(function(res) {
            that.editorCtx = res.context
            if (that.editorCtx && that.data.gou && that.data.gou.detailHTML) {
                that.editorCtx.setContents({ html: that.data.gou.detailHTML })
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
                type: '代金券详情页',
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
        let usercoupon = that.data.usercoupon
        wx.navigateTo({
            url: '/pages/coupon/detail?' + '&usercouponId=' + usercoupon._id
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
    setPhoneThenJoin(e) {
		let that = this;
		if (that.data.loading) {
			return;
		}
        that.data.loading = true;
        let buy = e.currentTarget.dataset.buy;
		wx.showLoading({
			title: ''
		});
		if (e.detail && e.detail.iv && e.detail.encryptedData) {
			getApp().request({
				url: '/userapp/session/bindPhone',
				method: 'POST',
				data: {
					userData: e.detail
				},
				success(res) {
					if (res.statusCode == 200) {
						let phone = res.data;
						getApp().session.u.phone = phone;
						that.setData({ 'session.u.phone': phone, 'user.phone': phone });
						that.data.loading = false;
						wx.hideLoading();
						if(buy){
                            that.buy()
                        }
					} else {
						that.data.loading = false;
						wx.hideLoading();
					}
				},
				fail(err) {}
			});
		} else {
			that.data.loading = false;
			wx.hideLoading();
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
        let data = {
            itemType: 'gou',
            itemId: that.data.gou._id,
        }
        if (getApp().from && getApp().from.gouId == that.data.gou._id) {
            data.postby = getApp().shareby || null
        }
        getApp().request({
            url: '/userapp/main/prepay',
            data: data,
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
                    getApp().gousChanged = true
                    wx.vibrateShort()
                    that.loadData()
                    that.setData({
                        buyModal: false,
                        joinModal: false,
                        paidModal: true
                    })
                } else if (res.data.full) {
                    wx.vibrateShort()
                    that.loadData()
                    that.setData({
                        buyModal: false,
                        joinModal: false,
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
            url: '/userapp/gou/report',
            data: {
                gouId: that.data.gouId
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
                        title: '感谢监督，我们会尽快审核',
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
    toSetNotice: function() {
        let that = this
        if (that.data.gounotice) {
            wx.showActionSheet({
                itemList: ['修改金额', '取消提醒'],
                success: function(r) {
                    if (r.tapIndex == 0) {
                        that.setData({ noticeModal: true })
                    } else if (r.tapIndex == 1) {
                        getApp().request({
                            url: '/userapp/gou/notice/cancel',
                            data: { gounoticeId: that.data.gounotice._id },
                            method: 'POST',
                            success: function(res) {
                                if (res.data.success) {
                                    that.loadData()
                                    wx.showToast({
                                        title: '提醒已取消',
                                        icon: 'none'
                                    })
                                }
                            },
                        })
                    }
                }
            })
        } else {
            that.setData({ noticeModal: true })
        }
    },
    hideNoticeModal: function() {
        let that = this
        that.setData({ noticeModal: false })
    },
    priceFocus: function() {
        let that = this
        if (that.data.noticeForm.price == 0) {
            that.setData({ 'noticeForm.priceStr': '' })
        }
    },
    priceChanged: function(e) {
        let that = this
        that.setData({ 'noticeForm.price': e.detail.value })
    },
    priceBlur: function(e) {
        let that = this
        if (that.data.noticeForm.price == '' || isNaN(Number(that.data.noticeForm.price))) {
            that.data.noticeForm.price = 0
        }
        that.setData({ 'noticeForm.priceStr': Number(that.data.noticeForm.price).toFixed(2) })
    },
    noticeConfirm: function() {
        let that = this
        if (that.data.noticeForm.price > 100) {
            wx.showToast({
                title: '不能超过100元',
                icon: 'none'
            })
            return
        }
        if (that.data.loading) return
        that.data.loading = true
        wx.showLoading({ title: '' })
        getApp().request({
            url: '/userapp/gou/notice',
            data: {
                gouId: that.data.gouId || that.data.gou._id,
                form: that.data.noticeForm
            },
            method: 'POST',
            success: function(res) {
                wx.hideLoading()
                that.data.loading = false
                if (res.data.success) {
                    that.setData({ noticeModal: false })
                    that.loadData()
                    wx.showToast({
                        title: '设置成功',
                        icon: 'none'
                    })
                }
            },
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
            index = this.data.images.length - 3;
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
    handlePreviewImg(e) {
        let that = this
        let img = e.currentTarget.dataset.image
        wx.previewImage({
            current: img, // 当前显示图片的http链接
            urls: [img] // 需要预览的图片http链接列表
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
    // toVip: function() {
    //     let that = this
    //     getApp().request({
    //         url: '/userapp/main/vip/invited',
    //         data: {},
    //         method: 'POST',
    //         success: function(res) {
    //             // wx.switchTab({
    //             //     url: '/pages/main/me'
    //             // })
    //             // getApp().vipActive = true
    //             that.setData({
    //                 vipModal: true
    //             })
    //         },
    //     })
    // },
    toVip() {
        let that = this
        getApp().request({
            url: '/userapp/main/vip/loadPromotion',
            data: {},
            method: 'POST',
            success: function(res) {
                let promotion = res.data.promotion
                if (promotion) {
                    promotion.priceStr = Number(promotion.price).toFixed(2)
                    promotion.expiryTimeStr = TimeUtil.orderTime(promotion.expiryTime)
                    that.runClock(promotion)
                }
                let price = res.data.price
                that.setData({
                    promotion: promotion,
                    price: price,
                    priceStr: Number(price).toFixed(2),
                    vipModal: true,
                    buyModal: false
                })
                that.loadPrice()
            },
        })
    },
    runClock: function(promotion) {
        let that = this
        let clock = {}
        let expiryTime = new Date(promotion.expiryTime).getTime()
        if (expiryTime <= new Date().getTime()) {
            that.loadData()
            return
        }
        clock.hour = Math.floor((expiryTime - new Date().getTime()) / (1000 * 60 * 60))
        clock.min = Math.floor(((expiryTime - new Date().getTime()) % (1000 * 60 * 60)) / (1000 * 60))
        clock.sec = Math.floor((((expiryTime - new Date().getTime()) % (1000 * 60 * 60)) % (1000 * 60)) / 1000)
        if (clock.sec < 10) {
            clock.sec = '0' + clock.sec
        }
        that.setData({ clock: clock })
        setTimeout(() => {
            that.runClock(promotion)
        }, 1000);
    },
    loadPrice: function() {
        let that = this
        let promotions = []
        let price = that.data.price
        that.data.orderForm.originPrice = that.data.orderForm.time * price
        if (that.data.promotion) {
            price = that.data.promotion.price
            that.data.orderForm.promotion = that.data.promotion
        }
        that.data.orderForm.price = that.data.orderForm.time * price
        that.data.orderForm.priceStr = Number(that.data.orderForm.price).toFixed(2)
        that.data.orderForm.originPriceStr = Number(that.data.orderForm.originPrice).toFixed(2)
        that.setData({ orderForm: that.data.orderForm })
    },
    hideVipModal() {
        this.setData({
            vipModal: false
        })
    },
    toBuyVip: function() {
        let that = this
        that.setData({
            payModal: true,
        })
    },
    timeChanged: function(e) {
        let that = this
        let time = e.currentTarget.dataset.time
        that.setData({ 'orderForm.time': time })
        that.loadPrice()
    },
    hidePayModal: function() {
        let that = this
        that.setData({
            payModal: false
        })
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
    payVip: function(e) {
        let that = this
        if (that.data.loading || that.data.disagree) return
        that.data.loading = true
        wx.showLoading({
            title: ''
        })
        getApp().request({
            url: '/userapp/main/prepay',
            data: {
                itemType: 'vip',
                form: that.data.orderForm
            },
            method: 'POST',
            success: function(res) {
                wx.hideLoading()
                if (res.data.success) {
                    that.data.order = res.data.order
                    if (that.data.order.paid) {
                        that.getResult()
                    } else {
                        let data = res.data.order.prepay
                        data.success = function(res) {
                            that.getResult()
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
    getResult: function() {
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
                    that.setData({
                        payModal: false,
                        vipModal: false,
                    })
                    wx.showTabBar()
                    wx.setNavigationBarColor({
                        frontColor: '#000000',
                        backgroundColor: '#FFDB09'
                    })
                    getApp().dataChanged = true
                    wx.showToast({
                        title: '支付成功',
                        icon: 'none'
                    })
                    that.loadData()
                }
            },
        })
    },

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
            url: '/userapp/gou/detail/getQrcode',
            data: { gouId: that.data.gouId },
            method: 'POST',
            success: function(res) {
                if (res.data.success) {
                    that.data.shareQrcode = res.data.qrcode.url
                    wx.hideLoading()

                    that.setData({
                        shareModal: true,
                    }, () => {
                        if (that.data.gou.playbillType != 'custom') {
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
                    url: that.data.gou.playbill,
                    style: {
                        width: 375 * num,
                        height: 667 * num,
                    }
                },
                {
                    type: 'image',
                    x: that.data.gou.dx / 2,
                    y: that.data.gou.dy / 2,
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
        let gou = that.data.gou
        let shop = that.data.shop
        let num = 1
        let tagicon
        let tag1len = shop.tag1 ? shop.tag1.length : 0
        let tagHeight = tag1len ? 25 : 0
        let tag2 = shop.tag2 ? '“' + shop.tag2 + '”' : ''
        let tag2len = tag2 ? tag2.length : 0
        let feature = shop.feature ? shop.feature : ''
        feature = feature.split('')
        feature.length = feature.length > 4 ? 4 : feature.length
        feature = feature.join('')
        let name = gou.name.split('')
        name.length = 6
        name = name.join('')
        let cpi = shop.cpi ? '人均￥' + shop.cpi : ''
        let amount
        if (!gou.repeat) {
            amount = gou.amount - (gou.data.paid || 0)
        }
        if (gou.repeat == 'day') {
            amount = gou.amount - (gou.data.paidToday || 0)
        }
        if (gou.nice) {
            tagicon = '/res/images/index_nice.png'
        }
        if (!gou.nice && gou.hot) {
            tagicon = '/res/images/index_hot.png'
        }
        this.drawImage = new Wxml2Canvas({
            width: 750, // 宽， 以iphone6为基准，传具体数值，其他机型自动适配
            height: 1334, // 高
            element: 'canvas',
            background: '#D24D39',
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


        let originPriceWidth = Math.ceil(this.drawImage.measureWidth('' + that.data.gou.originPrice, '16px PingFang SC')) + 2;


        let data = {
            list: [{
                    type: 'image',
                    x: 0,
                    y: 0,
                    url: 'http://cdn.classx.cn/tandian/userapp/res/images/canvas_top_gou2.png',
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
                }, { // goubox
                    type: 'image',
                    x: 35 * num,
                    y: 250 * num,
                    url: '/res/images/canvas_coupon.png',
                    style: {
                        width: 100 * num,
                        height: 132 * num,
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
                    y: 358 * num,
                    text: '￥',
                    style: {
                        width: this.drawImage.measureWidth('￥', '10px PingFang SC') * num,
                        color: '#FF4925',
                        fontSize: 10 * num,
                    }
                },
                {
                    type: 'text',
                    x: 60 * num,
                    y: 352 * num,
                    text: (that.data.gou.originPrice || 0),
                    style: {
                        width: originPriceWidth * num,
                        color: '#FF4925',
                        fontSize: 16 * num,
                    }
                }, {
                    type: 'text',
                    x: 95 * num,
                    y: 357 * num,
                    text: '代金券',
                    style: {
                        width: (this.drawImage.measureWidth('代金券', '10px PingFang SC') + 2) * num,
                        color: '#666666',
                        fontSize: 10 * num,
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
                }, {
                    type: 'text',
                    x: 150 * num,
                    y: 294 * num,
                    text: feature,
                    style: {
                        width: feature.length * 13 * num,
                        color: '#999999',
                        fontSize: 12 * num,
                    }
                }, {
                    type: 'text',
                    x: (160 + feature.length * 12) * num,
                    y: 294 * num,
                    text: cpi,
                    style: {
                        width: (this.drawImage.measureWidth(cpi, '12px PingFang SC') + 12) * num,
                        color: '#999999',
                        fontSize: 12 * num,
                    }
                }, { //tag1
                    type: 'rect',
                    x: 150 * num,
                    y: (317 - (cpi || feature ? 0 : 16)) * num,
                    style: {
                        width: (this.drawImage.measureWidth(that.data.shop.tag1, '12px PingFang SC') + 30) * num,
                        height: tag1len >= 1 ? 20 * num : 0,
                        fill: '#FFF5E5'
                    }
                }, {
                    type: 'text',
                    x: 168 * num,
                    y: getApp().phoneSystem == 'iOS' ? (317 - (cpi || feature ? 0 : 16)) * num : (318 - (cpi || feature ? 0 : 16)) * num,
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
                    y: (321 - (cpi || feature ? 0 : 16)) * num,
                    url: '/res/images/index_tag.png',
                    style: {
                        width: that.data.shop.tag1 ? 10 * num : 0,
                        height: that.data.shop.tag1 ? 11 * num : 0
                    }
                }, { //tag2
                    type: 'rect',
                    x: 150 * num,
                    y: (317 + tagHeight - (cpi || feature ? 0 : 16)) * num,
                    style: {
                        width: (this.drawImage.measureWidth(that.data.shop.tag2, '12px PingFang SC') + 28) * num,
                        height: tag2len >= 1 ? 20 * num : 0,
                        fill: '#FFF1EB'
                    }
                }, {
                    type: 'text',
                    x: 155 * num,
                    y: getApp().phoneSystem == 'iOS' ? (317 + tagHeight - (cpi || feature ? 0 : 16)) * num : (318 + tagHeight - (cpi || feature ? 0 : 16)) * num,
                    text: tag2,
                    style: {
                        width: (this.drawImage.measureWidth(tag2, '12px PingFang SC') + 10) * num,
                        color: '#FF6D26',
                        fontSize: 12 * num,
                    }
                }, {
                    type: 'rect',
                    x: 150 * num,
                    y: (342 + (tag2 && tag1len ? 28 : 12) - (cpi || feature ? 0 : 16)) * num,
                    style: {
                        width: 185 * num,
                        height: 6 * num,
                        fill: '#FFEAE5'
                    }
                }, {
                    type: 'rect',
                    x: 150 * num,
                    y: (342 + (tag2 && tag1len ? 28 : 12) - (cpi || feature ? 0 : 16)) * num,
                    style: {
                        width: (that.data.gou.price || that.data.gou.originPrice) / that.data.gou.originPrice * 185 * num,
                        height: 6 * num,
                        fill: '#FF4925'
                    }
                }, {
                    type: 'text',
                    x: 150 * num,
                    y: (342 + (tag2 && tag1len ? 36 : 22) - (cpi || feature ? 0 : 16)) * num,
                    text: '当前价格 ￥',
                    style: {
                        width: 200,
                        color: '#FF4925',
                        fontSize: 10 * num,
                    }
                }, {
                    type: 'text',
                    x: 208 * num,
                    y: (342 + (tag2 && tag1len ? 34 : 20) - (cpi || feature ? 0 : 16)) * num,
                    text: that.data.gou.kanPriceStr,
                    style: {
                        width: 200,
                        color: '#FF4925',
                        fontSize: 12 * num,
                        fontWeight: 'bold'
                    }
                }, {
                    type: 'text',
                    x: 235 * num,
                    y: (342 + (tag2 && tag1len ? 36 : 22) - (cpi || feature ? 0 : 16)) * num,
                    text: '仅剩' + amount + '份',
                    style: {
                        width: 100,
                        color: '#FF4925',
                        fontSize: 10 * num,
                        textAlign: 'right'
                    }
                }, {
                    type: 'text',
                    x: 40 * num,
                    y: 408 * num,
                    text: that.data.gou.name,
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
                    y: 436 * num,
                    text: '当前价格: ￥' + that.data.gou.kanPriceStr,
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
                    text: '长按图片，前往小程序抢购',
                    style: {
                        width: 200 * num,
                        color: '#242627',
                        fontSize: 12 * num,
                    }
                }, {
                    type: 'image',
                    x: 257 * num,
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
                    url: 'http://cdn.classx.cn/tandian/userapp/res/images/canvas_bottom_gou.png',
                    style: {
                        width: 375 * num,
                        height: 166 * num
                    }
                }, {
                    type: 'text',
                    x: 0 * num,
                    y: 521 * num,
                    text: '还有更多无门槛代金券',
                    style: {
                        width: 375 * num,
                        color: '#E8CB93',
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
    },
})