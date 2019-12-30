const TimeUtil = require('../../utils/TimeUtil.js');
const NumberUtil = require('../../utils/NumberUtil.js');
Page({
    data: {
        queryActive: 'nearby',
        showSearch: false,
        user: {},

        query: {
            keywords: '',
            from: null,
            sort: 'time',
            size: 20
        },
        pageType: 'boxs',
        category: '好吃的',
    },
    onLoad(options) {
        let that = this;
        this.options = options;
        this.doLoad();
        let skipVipTips = wx.getStorageSync('skipVipTips');
        if (skipVipTips) {
            that.setData({ skipVipTips: true });
        }

        let showTips1 = wx.getStorageSync('showTips1');
        if (showTips1 === false) {
            that.setData({ showTips1: false });
        } else {
            that.setData({ showTips1: true });
        }
        let showTips2 = wx.getStorageSync('showTips2');
        if (showTips2 === false) {
            that.setData({ showTips2: false });
        } else {
            that.setData({ showTips2: true });
        }
    },
    onReady() {},
    onShow() {
        let that = this;
        if (getApp().systemError) {
            getApp().systemError = null;
            this.doLoad();
            return;
        }
        if (getApp().dataChanged) {
            getApp().dataChanged = false;
            that.loadData();
        }
        if (getApp().bowsChanged) {
            getApp().bowsChanged = false;
            that.loadData();
        }
        if (getApp().pageChanged) {
            getApp().pageChanged = false;
            getApp().loadSession(function(session) {
                that.data.session = session;
                that.loadData(function() {
                    that.loadExpiringCoupon();
                    that.autoloadLocation();
                });
            });
        }
        if (getApp().toast) {
            wx.showToast({
                title: getApp().toast,
                icon: 'none'
            });
            getApp().toast = null;
        }
        that.data.isFuseLocation = false;

        if (getApp().gousChanged) {
            getApp().gousChanged = false;
            this.loadData();
        }
        if (getApp().adImage) {
            wx.hideTabBar();
            wx.setNavigationBarColor({
                frontColor: '#000000',
                backgroundColor: '#4c4009'
            });
            setTimeout(() => {
                that.setData({ adImage: getApp().adImage });
                getApp().adImage = null;
            }, 100);
        }
    },
    onHide() {},
    onUnload() {},
    onPullDownRefresh() {
        let that = this;
        if (getApp().systemError) {
            getApp().systemError = null;
            this.doLoad();
            return;
        }
        if (that.data.session) {
            if (that.data.query.sort == 'dis') {
                getApp().getNewLocation(function(location) {
                    that.data.query.location = location;
                    that.loadData(function() {
                        wx.stopPullDownRefresh();
                    });
                });
            } else {
                that.loadData(function() {
                    wx.stopPullDownRefresh();
                });
            }
        } else {
            wx.stopPullDownRefresh();
        }
    },
    onReachBottom() {
        let that = this;
        if (that.data.nomore[that.data.pageType] || that.data.loadingmore || !that.data.session || that.data.itemList.length == 0) {
            return;
        }
        // todo
        that.data.query.from = {
            createTime: that.data.itemList[that.data.itemList.length - 1].createTime,
            dis: that.data.itemList[that.data.itemList.length - 1].dis,
            nice: that.data.itemList[that.data.itemList.length - 1].nice,
            hot: that.data.itemList[that.data.itemList.length - 1].hot,
            full: that.data.itemList[that.data.itemList.length - 1].full || '',
            _id: that.data.itemList[that.data.itemList.length - 1]._id
        };
        that.setData({
            loadingmore: true
        });
        that.loadData();
    },
    handlelower() {
        let that = this;
        console.log(123,that.data.nomore[that.data.pageType]);
        
        if (that.data.nomore[that.data.pageType] || that.data.loadingmore || !that.data.session || that.data.itemList.length == 0) {
            return;
        }
        console.log(234);
        
        // todo
        that.data.query.from = {
            createTime: that.data.itemList[that.data.itemList.length - 1].createTime,
            dis: that.data.itemList[that.data.itemList.length - 1].dis,
            nice: that.data.itemList[that.data.itemList.length - 1].nice,
            hot: that.data.itemList[that.data.itemList.length - 1].hot,
            full: that.data.itemList[that.data.itemList.length - 1].full || '',
            _id: that.data.itemList[that.data.itemList.length - 1]._id
        };
        that.setData({
            loadingmore: true
        });
        that.loadData();
    },
    onShareAppMessage(e) {
        let that = this;
        let item = null;
        // todo
        if (e && e.target && e.target.dataset && e.target.dataset.item) {
            item = e.target.dataset.item;
        }
        if (item) {
            let imageUrl = item.cover + '@share';
            let append = '';
            if (that.data.user) {
                append = '&shareby=' + that.data.user._id;
            }
            let path = '/pages/main/index?gouId=' + item._id + append;
            let title =
                item.shareTitle || '￥' + item.priceStr + '抢原价' + item.originPriceStr + '的' + item.shop.name + item.name;
            return {
                title: title,
                path: path,
                imageUrl: imageUrl
            };
        } else {
            let path = '/pages/main/index?shareby=' + that.data.user._id;
            let imageUrl = 'http://cdn.classx.cn/tandian/appshare.jpg@share';
            let title = '';
            return {
                title: title,
                path: path,
                imageUrl: imageUrl
            };
        }
    },
    onPageScroll() {},
    onResize() {},
    // preload
    doLoad() {
        let that = this;
        let options = this.options;
        let scene = decodeURIComponent(options.scene);
        if (getApp().debugScene) {
            scene = decodeURIComponent(getApp().debugScene);
            getApp().debugScene = null;
        }
        if (getApp().testcodeparam) {
            let tester = getApp().testcodeparam.substring('tester='.length, getApp().testcodeparam.length);
            getApp().request({
                url: '/userapp/open/testcode/load',
                data: { tester: tester },
                method: 'POST',
                success(res) {
                    if (res.data.success) {
                        getApp().testcodeparam = null;
                        let qrcode = res.data.qrcode;
                        parseQrcode(qrcode, res);
                    }
                }
            });
        } else if (scene && scene.substring(0, 'codeId:'.length) == 'codeId:') {
            let codeId = scene.substring('codeId:'.length, scene.length);
            getApp().request({
                url: '/userapp/open/qrcode/load',
                data: { qrcodeId: codeId },
                method: 'POST',
                success(res) {
                    if (res.data.success) {
                        let qrcode = res.data.qrcode;
                        parseQrcode(qrcode, res);
                    }
                }
            });
        } else {
            if (options.shareby) {
                getApp().shareby = options.shareby;
            }
            if (options.kanjiaId) {
                let kanjiaId = options.kanjiaId;
                getApp().from = { kanjiaId: kanjiaId };
                let append = '';
                if (options.userkanjiaId) {
                    append = '&userkanjiaId=' + options.userkanjiaId;
                    getApp().from.userkanjiaId = options.userkanjiaId;
                }
                getApp().pageChanged = true;
                wx.navigateTo({
                    url: '/pages/kanjia/detail?kanjiaId=' + kanjiaId + append
                });
            } else if (options.couponId) {
                let couponId = options.couponId;
                getApp().from = { couponId: couponId };
                let append = '';
                if (options.usercouponId) {
                    append = '&usercouponId=' + options.usercouponId;
                    getApp().from.usercouponId = options.usercouponId;
                }
                getApp().pageChanged = true;
                wx.navigateTo({
                    url: '/pages/coupon/detail?couponId=' + couponId + append
                });
            } else if (options.commentShopId) {
                getApp().from = { commentShopId: options.commentShopId };
                getApp().pageChanged = true;
                wx.navigateTo({
                    url: '/pages/main/comment?shopId=' + options.commentShopId
                });
            } else if (options.dakaShopId) {
                let append = '';
                getApp().from = { dakaShopId: options.dakaShopId };
                if (options.userdakaId) {
                    append = '&userdakaId=' + options.userdakaId;
                    getApp().from.userdakaId = options.userdakaId;
                }
                getApp().pageChanged = true;
                wx.navigateTo({
                    url: '/pages/main/daka?shopId=' + options.dakaShopId + append
                });
            } else if (options.bowId) {
                let append = '';
                getApp().from = { bowId: options.bowId };
                if (options.shareby) {
                    append = '&shareby=' + options.shareby;
                }
                getApp().pageChanged = true;
                wx.navigateTo({
                    url: '/pages/bow/detail?bowId=' + options.bowId + append
                });
            } else if (options.gouId) {
                let append = '';
                getApp().from = { gouId: options.gouId };
                if (options.shareby) {
                    append = '&shareby=' + options.shareby;
                }
                getApp().pageChanged = true;
                wx.navigateTo({
                    url: '/pages/gou/detail?gouId=' + options.gouId + append
                });
            } else if (options.wheelId) {
                getApp().from = { wheelId: options.wheelId };
                getApp().pageChanged = true;
                wx.navigateTo({
                    url: '/pages/wheel/detail?wheelId=' + options.wheelId
                });
            } else if (options.serviceshare) {
                getApp().pageChanged = true;
                getApp().loadSession(function(session) {
                    that.data.session = session;
                    getApp().request({
                        url: '/userapp/main/serviceshare',
                        data: { shareby: options.serviceshare },
                        method: 'POST',
                        success(res) {
                            if (res.data.success) {
                                getApp().toast = '恭喜你成为服务商';
                                wx.navigateTo({
                                    url: '/pages/main/wallet'
                                });
                            }
                        }
                    });
                });
            } else if (options.teamshare) {
                getApp().pageChanged = true;
                getApp().loadSession(function(session) {
                    that.data.session = session;
                    getApp().request({
                        url: '/userapp/main/teamshare',
                        data: { shareby: options.teamshare },
                        method: 'POST',
                        success(res) {
                            if (res.data.success) {
                                getApp().toast = '恭喜你获得推广特权';
                                wx.navigateTo({
                                    url: '/pages/main/wallet'
                                });
                            }
                        }
                    });
                });
            } else {
                getApp().loadSession(function(session) {
                    that.data.session = session;
                    that.loadData(function() {
                        that.loadExpiringCoupon();
                        that.autoloadLocation();
                    });
                });
            }
        }

        function parseQrcode(qrcode, res) {
            if (!qrcode) {
                return;
            }
            if (qrcode.shareby) {
                getApp().shareby = qrcode.shareby;
            }
            if (getApp().scene == 1047 && qrcode.shop) {
                //扫码参加活动的用户不可见抢购内容
                getApp().skipShopId = qrcode.shop._id;
            }
            if (qrcode.couponId) {
                getApp().from = { couponId: qrcode.couponId };
                let append = '';
                if (qrcode.usercouponId) {
                    append = '&usercouponId=' + qrcode.usercouponId;
                    getApp().from.usercouponId = qrcode.usercouponId;
                }
                getApp().pageChanged = true;
                wx.navigateTo({
                    url: '/pages/coupon/detail?couponId=' + qrcode.couponId + append
                });
            } else if (qrcode.kanjiaId) {
                let append = '';
                getApp().from = { kanjiaId: qrcode.kanjiaId };
                if (qrcode.userkanjiaId) {
                    append = '&userkanjiaId=' + qrcode.userkanjiaId;
                    getApp().from.userkanjiaId = qrcode.userkanjiaId;
                }
                getApp().pageChanged = true;
                wx.navigateTo({
                    url: '/pages/kanjia/detail?kanjiaId=' + qrcode.kanjiaId + append
                });
            } else if (qrcode.commentShopId) {
                getApp().from = { commentShopId: qrcode.commentShopId };
                getApp().pageChanged = true;
                wx.navigateTo({
                    url: '/pages/main/comment?shopId=' + qrcode.commentShopId
                });
            } else if (qrcode.dakaShopId) {
                getApp().from = { dakaShopId: qrcode.dakaShopId };
                getApp().pageChanged = true;
                wx.navigateTo({
                    url: '/pages/main/daka?shopId=' + qrcode.dakaShopId
                });
                if (getApp().scene == 1047) {
                    //扫码打卡用户不可见抢购内容
                    getApp().skipShopId = qrcode.dakaShopId;
                }
            } else if (qrcode.gouId) {
                getApp().from = { gouId: qrcode.gouId };
                let append = '';
                if (qrcode.shareby) {
                    append = '&shareby=' + qrcode.shareby;
                }
                getApp().pageChanged = true;
                wx.navigateTo({
                    url: '/pages/gou/detail?gouId=' + qrcode.gouId + append
                });
            } else if (qrcode.bowId) {
                getApp().from = { bowId: qrcode.bowId };
                let append = '';
                if (qrcode.shareby) {
                    append = '&shareby=' + qrcode.shareby;
                }
                getApp().pageChanged = true;
                wx.navigateTo({
                    url: '/pages/bow/detail?bowId=' + qrcode.bowId + append
                });
            } else if (qrcode.type == 'userdaka') {
                if (res.data.userdaka && res.data.bow) {
                    getApp().from = { bowId: res.data.bow._id, userdakaId: qrcode.userdaka._id };
                    getApp().pageChanged = true;
                    wx.navigateTo({
                        url: '/pages/bow/detail?bowId=' + res.data.bow._id + '&userdakaId=' + qrcode.userdaka._id
                    });
                } else {
                    getApp().from = { shopId: qrcode.userdaka.shop._id, userdakaId: qrcode.userdaka._id };
                    getApp().pageChanged = true;
                    wx.navigateTo({
                        url: '/pages/shop/detail?shopId=' +
                            qrcode.userdaka.shop._id +
                            '&userdakaId=' +
                            qrcode.userdaka._id
                    });
                }
            } else if (qrcode.type == 'sharebow') {
                getApp().from = { bowId: qrcode.bow._id, shareby: qrcode.shareby };
                getApp().pageChanged = true;
                wx.navigateTo({
                    url: '/pages/bow/detail?bowId=' + qrcode.bow._id + '&shareby=' + qrcode.shareby
                });
            } else if (qrcode.type == 'sharecoupon') {
                getApp().from = { qrcodeId: qrcode._id, shareby: qrcode.shareby };
                getApp().pageChanged = true;
                wx.navigateTo({
                    url: '/pages/coupon/detail?usercouponId=' + qrcode.usercoupon._id + '&shareby=' + qrcode.shareby
                });
            } else if (qrcode.type == 'sharegou') {
                getApp().from = { gouId: qrcode.gou._id, shareby: qrcode.shareby };
                getApp().pageChanged = true;
                wx.navigateTo({
                    url: '/pages/gou/detail?gouId=' + qrcode.gou._id + '&shareby=' + qrcode.shareby
                });
            } else if (qrcode.wheelId) {
                getApp().from = { wheelId: qrcode.wheelId };
                getApp().pageChanged = true;
                wx.navigateTo({
                    url: '/pages/wheel/detail?wheelId=' + qrcode.wheelId
                });
            } else if (qrcode.type == 'serviceshare') {
                getApp().pageChanged = true;
                getApp().loadSession(function(session) {
                    that.data.session = session;
                    getApp().request({
                        url: '/userapp/main/serviceshare',
                        data: { shareby: qrcode.shareby },
                        method: 'POST',
                        success(res) {
                            if (res.data.success) {
                                getApp().toast = '恭喜你成为服务商';
                                wx.navigateTo({
                                    url: '/pages/main/wallet'
                                });
                            }
                        }
                    });
                });
            } else if (qrcode.type == 'teamshare') {
                getApp().pageChanged = true;
                getApp().loadSession(function(session) {
                    that.data.session = session;
                    getApp().request({
                        url: '/userapp/main/teamshare',
                        data: { shareby: qrcode.shareby },
                        method: 'POST',
                        success(res) {
                            if (res.data.success) {
                                getApp().toast = '恭喜你获得推广特权';
                                wx.navigateTo({
                                    url: '/pages/main/wallet'
                                });
                            }
                        }
                    });
                });
            } else if (qrcode.type == 'shopcode') {
                getApp().from = { shopcodeId: qrcode._id };
                getApp().loadSession(function(session) {
                    if (!qrcode.actived || session.u.unionid == qrcode.activedBy.unionid) {
                        getApp().pageChanged = true;
                        wx.navigateTo({
                            url: '/pages/main/shopapp?shopcode=' + qrcode._id
                        });
                    } else {
                        if (qrcode.indexType == 'lastBow') {
                            getApp().pageChanged = true;
                            wx.navigateTo({
                                url: '/pages/bow/detail?bowId=' + res.data.bow._id
                            });
                        } else if (qrcode.indexType == 'shop') {
                            getApp().pageChanged = true;
                            wx.navigateTo({
                                url: '/pages/shop/detail?shopId=' + qrcode.shop._id
                            });
                        }
                    }
                });
            } else {
                if (qrcode.type == 'shopshare') {
                    that.setData({ shopshare: true });
                    getApp().serviceby = qrcode.shareby;
                }
                getApp().loadSession(function(session) {
                    that.data.session = session;
                    that.loadData(function() {
                        that.loadExpiringCoupon();
                        that.autoloadLocation();
                    });
                });
            }
        }
    },
    autoloadLocation() {
        let that = this;
        let enableLocation = wx.getStorageSync('enableLocation');
        if (enableLocation && !that.data.query.location) {
            getApp().getLocation(function(location) {
                that.data.query.location = location;
                for (let item of that.data.itemList) {
                    item.disStr =
                        Number(NumberUtil.distance(that.data.query.location, item.shop.location)).toFixed(1) + 'km';
                }
                that.setData({ 'query.location': location, itemList: that.data.itemList });
            });
        }
    },
    loadExpiringCoupon() {
        let that = this;
        getApp().request({
            url: '/userapp/main/index/loadExpiringCouponCount',
            data: {},
            method: 'POST',
            success(res) {
                that.setData({ expiringCouponCount: res.data.expiringCouponCount });
            }
        });
    },
    // nav
    onChangeNav(e) {
        let that = this;
        let type = e.currentTarget.dataset.type
        let index = e.currentTarget.dataset.index
        that.data.itemList = that.data[type]
        this.setData({
                pageType: type,
                tabChange: !that.data[type] ? true :  false,
                swiperCurrent: index,
                click: true
            },
            () => {
                if (!that.data[type]) {
                    that.loadData();
                }else{
                    that.data.click = false
                }
            }
        );
    },
    onChangeQuery(e) {
        let that = this;
        let query = e.currentTarget.dataset.query;
        this.setData({
            queryActive: query,
            'query.sort': query
        });
        if (query == 'dis') {
            if (that.data.query.location) {
                that.loadData();
            } else {
                getApp().getLocation(function(location) {
                    that.data.query.location = location;
                    that.loadData();
                });
            }
        } else {
            that.loadData();
        }
    },
    onChangeCategory() {
        let that = this;
        this.setData({}, () => {});
        wx.showActionSheet({
            itemList: ['好吃的', '其他'],
            success(r) {
                if (r.tapIndex == 0) {
                    that.setData({
                            category: '好吃的'
                        },
                        () => {
                            that.loadData();
                        }
                    );
                } else if (r.tapIndex == 1) {
                    that.setData({
                            category: '其他'
                        },
                        () => {
                            that.loadData();
                        }
                    );
                }
            }
        });
    },
    handleShowSearch() {
        this.setData({
            showSearch: true
        });
    },
    keywordsChanged(e) {
        this.setData({
            'query.keywords': e.detail.value
        });
        if (!e.detail.value) {
            this.loadData();
        }
    },
    onDeleteKeywords() {
        this.setData({
            showSearch: false,
            'query.keywords': ''
        });
        this.loadData();
    },
    doSearch() {
        let that = this;
        this.loadData(() => {
            that.setData({
                showSearch: false
            });
        });
    },
    // data
    loadData(cb) {
        let that = this;
        if (that.data.query.sort == 'dis' && !that.data.query.location) {
            that.setData({ 'query.location': null, gous: null, locateFailed: true });
            if (cb) cb();
            return;
        }
        let lastLoadTime = null;
        if (!that.data.query.from) {
            lastLoadTime = wx.getStorageSync('lastLoadTime');
            if (lastLoadTime) lastLoadTime = new Date(lastLoadTime);
        }
        getApp().request({
            url: '/userapp/main/index/load',
            data: {
                query: that.data.query,
                skipShopId: getApp().skipShopId || null,
                page: that.data.pageType,
                category: that.data.category,
                lastLoadTime: lastLoadTime
            },
            method: 'POST',
            success(res) {
                let data = {
                    loading: false,
                    loadingmore: false,
                    nomore: that.data.nomore || {}
                };
                let cellName;
                let templist;
                let user = null

                if (that.data.pageType == 'gous') {
                    data.itemList = res.data.gous || [];
                    templist = res.data.gous || [];
                    cellName = 'gou';
                } else if(that.data.pageType == 'bows') {
                    data.itemList = res.data.bows || [];
                    templist = res.data.bows || [];
                    cellName = 'bow';
                }else{
                    data.itemList = res.data.boxs || [];
                    templist = res.data.boxs || [];
                }
                data.setting = res.data.setting;

                if (that.data.query.from) {
                    that.data.query.from = null;
                    data.itemList = that.data.itemList.concat(data.itemList);
                    user = that.data.user
                } else {
                    user = res.data.user;
                    data.session = that.data.session;
                    if (that.data.pageType == 'gous') {
                        that.data.userList = res.data.usergous;
                    } else {
                        let tomorrow = new Date(new Date().setHours(0, 0, 0, 0) + 1000 * 60 * 60 * 24);
                        if (user.signNoticeTime && new Date(user.signNoticeTime) > tomorrow) {
                            user.signNoticed = true;
                        }
                        that.data.userList = res.data.userbows;
                    }
                    data.user = user;
                }

                for (let item of data.itemList) {
                    let location = that.data.query.location
                    if (user.lastLocation && user.lastLocation.location) {
                        location = user.lastLocation.location
                    }
                    if (location) {
                        item.disStr = Number(NumberUtil.distance(location, item.shop.location)).toFixed(1) + 'km';
                    }
                    if(that.data.pageType != 'boxs'){
                        item.originPriceStr = Number(item.originPrice).toFixed(2);
                        item.priceStr = Number(item.price).toFixed(2);
                        item.createTimeStr = TimeUtil.orderTime(item.createTime);
                        if (item.startTime) item.startTimeStr = TimeUtil.orderTime(item.startTime);
                        if (item.startTime && new Date(item.startTime) > new Date()) {
                            item.status = 0;
                        } else {
                            if (
                                (item.repeat == 'day' && item.amount > (item.data.paidToday || 0)) ||
                                (!item.repeat && item.amount > (item.data.paid || 0))
                            ) {
                                item.status = 1;
                            } else {
                                item.status = 2;
                            }
                        }
                        if (that.data.userList) {
                            for (let useritem of that.data.userList) {
                                if (useritem[cellName]._id == item._id) {
                                    item.joined = true;
                                }
                            }
                        }
                        if (item.recommendExpiryTime && new Date(item.recommendExpiryTime) > new Date()) {
                            item.recommendToIndex = true;
                        }
    
                    }else{
                        if (item.bow) {
                            item.bow.startTimeStr = TimeUtil.orderTime(item.bow.startTime);
                        }
                        if (item.gou) {
                            item.gou.priceStr = Number(item.gou.price).toFixed(2);
                        }
                    }
                   
                    if (item.shop) {
                        item.shop.feature = item.feature || item.shop.feature;
                        item.shop.cpi = item.cpi || item.shop.cpi;
                        item.shop.tag1 = item.tag1 || item.shop.tag1;
                        item.shop.tag2 = item.tag2 || item.shop.tag2;
                    }
                }
                data.nomore[that.data.pageType] = templist && templist.length < that.data.query.size ? true : false;

                data['query.location'] = that.data.query.location || null;
                data.tabChange = false;
                data.click  = false
                if (that.data.pageType == 'gous') {
                    data.gous = JSON.parse(JSON.stringify(data.itemList));
                } else if(that.data.pageType == 'bows') {
                    data.bows = JSON.parse(JSON.stringify(data.itemList));
                }else{
                    data.boxs = JSON.parse(JSON.stringify(data.itemList));
                }
                that.setData(data);
                if (!that.data.user.lastLocation && !that.data.locateFailed && !that.data.locationCleared) {
                    that.updateLocation();
                }
                if (cb) cb();
            }
        });
    },
    // loaction
    toUpdateLocation() {
        let that = this;
        if (that.data.user && that.data.user.lastLocation) {
            wx.showActionSheet({
                itemList: ['重新定位', '清除定位'],
                success(r) {
                    if (r.tapIndex == 0) {
                        that.updateLocation();
                    } else if (r.tapIndex == 1) {
                        getApp().request({
                            url: '/userapp/main/location/clear',
                            data: {},
                            method: 'POST',
                            success(res) {
                                that.data.loading = false;
                                wx.hideLoading();
                                if (res.data.success) {
                                    that.data.locationCleared = true;
                                    that.loadData();
                                    wx.showToast({
                                        title: '定位已清除',
                                        icon: 'none'
                                    });
                                }
                            }
                        });
                    }
                }
            });
        } else {
            that.updateLocation();
        }
    },
    updateLocation() {
        let that = this;
        if (that.data.locateFailed) {
            that.toSetLocation();
        }
        if (that.data.loading) return;
        wx.showLoading({ title: '' });
        that.data.loading = true;
        wx.getLocation({
            type: 'gcj02',
            success(res) {
                var latitude = res.latitude;
                var longitude = res.longitude;
                let location = [longitude, latitude];
                getApp().location = location;
                that.data.location = location;
                getApp().request({
                    url: '/userapp/session/location',
                    data: { location: location },
                    method: 'POST',
                    success(res) {
                        that.data.loading = false;
                        wx.hideLoading();
                        if (res.data.success) {
                            let city = res.data.info.addressComponent.city || res.data.info.addressComponent.province;
                            that.setData({ 'user.city': city });
                            that.loadData();
                            wx.showToast({
                                title: '定位已更新',
                                icon: 'none'
                            });
                        }
                    }
                });
            },
            fail() {
                that.data.loading = false;
                wx.hideLoading();
                that.setData({ locateFailed: true });
            }
        });
    },
    toSetLocation() {
        let that = this;
        wx.openSetting({
            success(res) {
                getApp().getLocation(function(location) {
                    that.data.query.location = location;
                    that.loadData();
                });
            }
        });
    },
    // click
    joinIt(e) {
        let that = this;
        let item = e.currentTarget.dataset.item;
        let index = e.currentTarget.dataset.index;
        that.setData({
            currentItem: item
        });
        if (that.data.loading) return;
        wx.showLoading({ title: '' });
        that.data.loading = true;

        let url;
        let queryObj;
        if (that.data.pageType == 'gous') {
            url = '/userapp/gou/detail/join';
            queryObj = {
                gouId: item._id
            };
        } else {
            url = '/userapp/bow/detail/join';
            queryObj = {
                bowId: item._id
            };
        }

        getApp().request({
            url: url,
            data: queryObj,
            method: 'POST',
            success(res) {
                that.data.loading = false;
                wx.hideLoading();
                if (res.data.success) {
                    wx.vibrateShort();
                    wx.setNavigationBarColor({
                        frontColor: '#000000',
                        backgroundColor: '#4c4009'
                    });
                    that.data.itemList[index].joined = true;
                    if (that.data.pageType == 'gous') {
                        that.data.gous = JSON.parse(JSON.stringify(that.data.itemList));
                    } else {
                        that.data.bows = JSON.parse(JSON.stringify(that.data.itemList));
                    }
                    if (res.data.usergou || res.data.code) {
                        if (res.data.usergou) {
                            let usergou = res.data.usergou;
                            usergou.valueStr = Number(usergou.value).toFixed(2);
                            usergou.priceStr = Number(usergou.price).toFixed(2);
                            that.data.itemList[index].priceStr = usergou.priceStr;
                            wx.hideTabBar({
                                success() {
                                    that.setData({ joinModal: true, usergou: usergou, itemList: that.data.itemList });
                                }
                            });
                        }
                        if (res.data.code) {
                            let showAd = false;
                            // 由扫码或识别二维码进入，不出现广告 // 已经出现过广告也不再出现
                            if (!getApp().fromScan) {
                                showAd = true;
                            }
                            // 由某店铺带来的粉丝，在该店铺不出现广告
                            if (res.data.skipAd) {
                                showAd = false;
                            }
                            wx.hideTabBar({
                                success() {
                                    that.setData({
                                        successModal: true,
                                        code: res.data.code,
                                        showAd: showAd,
                                        userbow: res.data.userbow,
                                        itemList: that.data.itemList,
                                        gous: that.data.gous,
                                        bows: that.data.bows
                                    });
                                }
                            });
                        }
                    } else {
                        let pageUrl;
                        if (that.data.pageType == 'gous') {
                            pageUrl = '/pages/gou/detail?gouId=' + item._id;
                        } else {
                            pageUrl = '/pages/bow/detail?bowId=' + item._id;
                        }
                        wx.navigateTo({
                            url: pageUrl
                        });
                    }
                }
            }
        });
    },
    authThenJoin(e) {
        let that = this;
        if (that.data.loading) {
            return;
        }
        that.data.loading = true;
        wx.showLoading({
            title: ''
        });
        if (e.detail.userInfo) {
            getApp().request({
                url: '/userapp/session/auth',
                data: {
                    userData: e.detail,
                    systemInfo: getApp().systemInfo
                },
                method: 'POST',
                success(res) {
                    wx.hideLoading();
                    that.data.loading = false;
                    getApp().session = res.data.session;
                    that.setData({
                        session: res.data.session,
                        user: res.data.user
                    });
                    that.joinIt(e);
                }
            });
        } else {
            that.data.loading = false;
            wx.hideLoading();
        }
    },
    gouActions(e) {
        let that = this;
        if (!that.data.user.super && !that.data.user.tester) {
            return;
        }
        let item = e.detail.item;
        let actions = ['编辑'];
        if (item.recommendToIndex) {
            actions.push('取消推荐');
        } else {
            actions.push('开启推荐');
        }
        actions.push('库存校对');
        actions.push('屏蔽');
        wx.showActionSheet({
            itemList: actions,
            success(r) {
                if (actions[r.tapIndex] == '取消推荐') {
                    wx.showLoading({ title: '' });
                    getApp().request({
                        url: '/userapp/gou/recommendToIndex',
                        data: { gouId: item._id, value: false },
                        method: 'POST',
                        success(res) {
                            if (res.data.success) {
                                wx.showToast({
                                    title: ''
                                });
                                that.loadData();
                            }
                        }
                    });
                } else if (actions[r.tapIndex] == '开启推荐') {
                    wx.showLoading({ title: '' });
                    getApp().request({
                        url: '/userapp/gou/recommendToIndex',
                        data: { gouId: item._id, value: true },
                        method: 'POST',
                        success(res) {
                            if (res.data.success) {
                                wx.showToast({
                                    title: ''
                                });
                                that.loadData();
                            }
                        }
                    });
                } else if (actions[r.tapIndex] == '库存校对') {
                    wx.showLoading({ title: '' });
                    getApp().request({
                        url: '/userapp/gou/verify',
                        data: { gouId: item._id },
                        method: 'POST',
                        success(res) {
                            if (res.data.success) {
                                wx.showToast({
                                    title: ''
                                });
                                that.loadData();
                            }
                        }
                    });
                } else if (actions[r.tapIndex] == '编辑') {
                    wx.showLoading({ title: '' });
                    setTimeout(() => {
                        wx.hideLoading();
                    }, 1000);
                    wx.navigateToMiniProgram({
                        appId: 'wx8bcf2758c6249d28',
                        path: 'pages/gou/form?gouId=' + item._id + '&gofrom=userapp',
                        envVersion: getApp().env,
                        success(res) {
                            // 打开成功
                        }
                    });
                } else if (actions[r.tapIndex] == '屏蔽') {
                    wx.showLoading({ title: '' });
                    getApp().request({
                        url: '/userapp/gou/skip',
                        data: { gouId: item._id, value: true },
                        method: 'POST',
                        success(res) {
                            if (res.data.success) {
                                wx.showToast({
                                    title: ''
                                });
                                that.loadData();
                            }
                        }
                    });
                }
            }
        });
    },
    bowActions: function(e) {
        let that = this;
        if (!that.data.user.super && !that.data.user.tester) {
            return;
        }
        let item = e.detail.item;
        let actions = ['编辑'];
        if (item.recommendToIndex) {
            actions.push('取消推荐');
        } else {
            actions.push('开启推荐');
        }
        actions.push('屏蔽');
        wx.showActionSheet({
            itemList: actions,
            success: function(r) {
                if (actions[r.tapIndex] == '取消推荐') {
                    wx.showLoading({ title: '' });
                    getApp().request({
                        url: '/userapp/bow/recommendToIndex',
                        data: { bowId: item._id, value: false },
                        method: 'POST',
                        success: function(res) {
                            if (res.data.success) {
                                wx.showToast({
                                    title: ''
                                });
                                that.loadData();
                            }
                        }
                    });
                } else if (actions[r.tapIndex] == '开启推荐') {
                    wx.showLoading({ title: '' });
                    getApp().request({
                        url: '/userapp/bow/recommendToIndex',
                        data: { bowId: item._id, value: true },
                        method: 'POST',
                        success: function(res) {
                            if (res.data.success) {
                                wx.showToast({
                                    title: ''
                                });
                                that.loadData();
                            }
                        }
                    });
                } else if (actions[r.tapIndex] == '编辑') {
                    wx.showLoading({ title: '' });
                    setTimeout(() => {
                        wx.hideLoading();
                    }, 1000);
                    wx.navigateToMiniProgram({
                        appId: 'wx8bcf2758c6249d28',
                        path: 'pages/bow/form?bowId=' + item._id + '&gofrom=userapp',
                        envVersion: getApp().env,
                        success(res) {
                            // 打开成功
                        }
                    });
                } else if (actions[r.tapIndex] == '屏蔽') {
                    wx.showLoading({ title: '' });
                    getApp().request({
                        url: '/userapp/bow/skip',
                        data: { bowId: item._id, value: true },
                        method: 'POST',
                        success: function(res) {
                            if (res.data.success) {
                                wx.showToast({
                                    title: ''
                                });
                                that.loadData();
                            }
                        }
                    });
                }
            }
        });
    },
    toBannerPath(e) {
        let item = e.currentTarget.dataset.item;
        wx.navigateTo({
            url: item.path
        });
    },
    showVideo() {
        let that = this;
        if (that.data.ading) {
            return;
        }
        that.setData({ ading: true });
        if (wx.createRewardedVideoAd) {
            if (!that.data.videoAd) {
                that.data.videoAd = wx.createRewardedVideoAd({
                    adUnitId: 'adunit-833b9226f7508ea9'
                });
                that.data.videoAd.onError(function(err) {
                    console.log(err.errMsg);
                    that.setData({ ading: false });
                    bonus();
                });
                that.data.videoAd.onClose(function(status) {
                    that.setData({ ading: false });
                    if ((status && status.isEnded) || status === undefined) {
                        bonus();
                    } else {
                        wx.showToast({
                            title: '未完成观看',
                            icon: 'none'
                        });
                    }
                });
            }
            that.data.videoAd
                .load()
                .then(() => {
                    that.data.videoAd.show();
                    that.setData({ ading: false });
                })
                .catch((err) => {
                    console.log(err.errMsg);
                    that.setData({ ading: false });
                });
        } else {
            bonus();
        }

        function bonus() {
            wx.showLoading({ title: '' });
            getApp().request({
                url: '/userapp/gou/detail/videoBonus',
                data: { usergouId: that.data.usergouId || that.data.usergou._id },
                method: 'POST',
                success(res) {
                    that.setData({ ading: false });
                    wx.hideLoading();
                    if (res.data.success) {
                        wx.vibrateShort();
                        that.loadData();
                        let extraInfoType = 0;
                        if (that.data.user.subscribe) {
                            extraInfoType = 3;
                        } else {
                            if (getApp().advancedWxservice) {
                                extraInfoType = 1;
                            } else {
                                extraInfoType = 2;
                            }
                        }
                        that.setData({ coinSuccessModal: true, code: res.data.code, extraInfoType: extraInfoType });
                        that.hideSuccessModal();
                    }
                }
            });
        }
    },
    hideTips1() {
        let that = this;
        wx.showActionSheet({
            itemList: ['不再显示'],
            success: function(r) {
                if (r.tapIndex == 0) {
                    wx.setStorage({
                        key: 'showTips1',
                        data: false
                    });
                    that.setData({
                        showTips1: false
                    });
                }
            }
        });
    },
    hideTips2(e) {
        let that = this;
        let content = e.currentTarget.dataset.content;
        wx.showActionSheet({
            itemList: ['不再显示', '复制微信号'],
            success: function(r) {
                if (r.tapIndex == 0) {
                    wx.setStorage({
                        key: 'showTips2',
                        data: false
                    });
                    that.setData({
                        showTips2: false
                    });
                } else if (r.tapIndex == 1) {
                    wx.setClipboardData({
                        data: content,
                        success(res) {
                            wx.showToast({
                                title: '已复制',
                                icon: 'none'
                            });
                        },
                        fail(res) {
                            wx.showToast({
                                title: res,
                                icon: 'none'
                            });
                        }
                    });
                }
            }
        });
    },
    toCreateShop: function() {
        let that = this;
        wx.showLoading({ title: '' });
        setTimeout(() => {
            wx.hideLoading();
        }, 1000);
        wx.navigateToMiniProgram({
            appId: 'wx8bcf2758c6249d28',
            path: 'pages/shop/form?simpleMode=true&serviceby=' + getApp().serviceby,
            envVersion: getApp().env,
            success(res) {
                // 打开成功
            }
        });
    },
    // mask
    hideNewItemModal() {
        let that = this;
        that.setData({ newItemModal: false });
    },
    hideJoinModal() {
        let that = this;
        that.setData({ joinModal: false });
        wx.showTabBar();
        wx.setNavigationBarColor({
            frontColor: '#ffffff',
            backgroundColor: '#333'
        });
    },
    hideCoinSuccessModal() {
        let that = this;
        that.setData({ coinSuccessModal: false });
    },
    hideNewsbox() {
        this.setData({
            expiringCouponCount: null
        });
    },
    hideSuccessModal: function() {
        let that = this;
        that.setData({ successModal: false });
        that.data.currentItem = null;
        wx.showTabBar();
        wx.setNavigationBarColor({
            frontColor: '#000000',
            backgroundColor: '#ffdb09'
        });
    },
    hideCoinSuccessModal: function() {
        let that = this;
        that.setData({ coinSuccessModal: false });
        wx.showTabBar();
        wx.setNavigationBarColor({
            frontColor: '#000000',
            backgroundColor: '#FFDB09'
        });
    },
    hideAdImage: function() {
        let that = this;
        wx.showTabBar();
        wx.setNavigationBarColor({
            frontColor: '#000000',
            backgroundColor: '#FFDB09'
        });
        that.setData({ adImage: null });
    },
    previewAdImage: function() {
        let that = this;
        wx.previewImage({
            current: that.data.adImage,
            urls: [that.data.adImage]
        });
    },

    // contact
    handleShowContact(e) {
        let img = e.currentTarget.dataset.img;
        let content = e.currentTarget.dataset.content;
        let contactImage = img || 'http://cdn.classx.cn/tandian/userapp/res/images/image_contact.jpg';
        let contactNum = content || 'ss317903133';
        this.setData({
            showContactModal: true,
            contactImage,
            contactNum
        });
    },
    hideContactModal() {
        this.setData({
            showContactModal: false
        });
    },
    handlePreviewImg(e) {
        let image = e.currentTarget.dataset.image;
        wx.previewImage({
            current: image, // 当前显示图片的http链接
            urls: [image] // 需要预览的图片http链接列表
        });
    },
    handleCopy(e) {
        let that = this;
        let content = e.currentTarget.dataset.content;
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
                            });
                        },
                        fail(res) {
                            wx.showToast({
                                title: res,
                                icon: 'none'
                            });
                        }
                    });
                }
            }
        });
    },

    // topage
    toVip() {
        let that = this;
        wx.switchTab({
            url: '/pages/main/me'
        });
        wx.setStorageSync('skipVipTips', true);
        that.setData({ skipVipTips: true });
    },
    toGou(e) {
        let that = this;
        let item = e.detail.item || that.data.currentItem;
        wx.showTabBar();
        wx.navigateTo({
            url: '/pages/gou/detail?gouId=' + item._id,
            success() {
                setTimeout(() => {
                    that.setData({ joinModal: false });
                }, 500);
            }
        });
    },
    toCoupons() {
        let that = this;
        wx.navigateTo({
            url: '/pages/main/coupons',
            success() {
                that.hideNewsbox();
            }
        });
    },
    toBow(e) {
        let item = e.detail.item || this.data.currentItem;
        wx.navigateTo({
            url: '/pages/bow/detail?bowId=' + item._id
        });
    },
    handleSwiper(e) {
        if(this.data.click){
            return
        }
        let tempObj = {
            currentTarget: {
                dataset: {
                    index: e.detail.current
                }
            }
        }
        if (e.detail.current == 2) {
            this.data.swiperCurrent = 'bows';
        } else if(e.detail.current == 1) {
            this.data.swiperCurrent = 'gous';
        }else{
            this.data.swiperCurrent = 'boxs';
        }
        tempObj.currentTarget.dataset.type = this.data.swiperCurrent
        this.onChangeNav(tempObj);

    },
    toShop(e) {
		let item = e.currentTarget.dataset.item;
		wx.navigateTo({
			url: '/pages/shop/detail?shopId=' + item.shop._id
		});
	},
});