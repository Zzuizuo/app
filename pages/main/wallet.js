const TimeUtil = require('../../utils/TimeUtil.js');
Page({
    /**
     * 页面的初始数据
     */
    data: {
        session: null,
        tab: 0,
        query: {
            keywords: '',
            from: null,
            size: 20
        },
        navs: [
            { name: '我的直推', type: 0 },
            { name: '团队', type: 6 },
            { name: '商家', type: 1 },
            { name: '订单', type: 2 },
            { name: '资金', type: 3 }
            // { name: '访问', type: 4 },
            // { name: '互动', type: 5 }
        ],
        activeIndex: 0,
        changeNavConfirm: true,
        isFocus: true
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        let that = this;
        if (options.shareby) {
            getApp().shareby = options.shareby;
        }
        getApp().loadSession(function(session) {
            that.data.session = session;
            that.loadData();
        });
    },
    onShow: function() {
        let that = this;
        if (getApp().dataChanged) {
            getApp().dataChanged = false;
            that.loadData();
        }
        if (getApp().toast) {
            wx.showToast({
                title: getApp().toast,
                icon: 'none'
            });
            getApp().toast = null;
        }
    },
    onReady() {
        let that = this;
    },

    onPageScroll: function(e) {},

    onShareby() {
        let that = this
        getApp().request({
            url: '/userapp/main/wallet/defaulticode/load',
            data: {},
            method: 'POST',
            success(res) {
                if (res.data.success) {
                    if (res.data.shareby) {
                        that.setData({ shareby: res.data.shareby })
                    }
                }
            }
        })
    },
    hideShareby() {
        this.setData({ shareby: null })
    },

    loadData: function(cb) {
        let that = this;
        getApp().request({
            url: '/userapp/main/wallet/load',
            data: { tab: that.data.tab, query: that.data.query },
            method: 'POST',
            success: function(res) {
                let data = {
                    loading: false,
                    loadingmore: false
                };
                if (that.data.tab == 0) {
                    data.users = res.data.users || [];
                    for (let user of data.users) {
                        user.createTimeStr = TimeUtil.orderTime(user.createTime);
                        user.totalConsumeStr = Number(user.totalConsume || 0).toFixed(2);
                        if (user.lastLoginTime) user.lastLoginTimeStr = TimeUtil.orderTime(user.lastLoginTime);
                    }
                } else if (that.data.tab == 6) {
                    data.groupusers = res.data.groupusers || [];
                    for (let groupuser of data.groupusers) {
                        groupuser.createTimeStr = TimeUtil.orderTime(groupuser.createTime);
                        groupuser.totalConsumeStr = Number(groupuser.totalConsume || 0).toFixed(2)
                        if (groupuser.lastLoginTime)
                            groupuser.lastLoginTimeStr = TimeUtil.orderTime(groupuser.lastLoginTime);
                    }
                } else if (that.data.tab == 1) {
                    data.shops = res.data.shops || [];
                    for (let shop of data.shops) {
                        shop.createTimeStr = TimeUtil.orderTime(shop.createTime);
                        if (shop && shop.vip) {
                            if (new Date() > new Date(shop.vip.expiryTime)) {
                                shop.vip.expired = true;
                            } else {
                                shop.vip.expiryTimeStr = TimeUtil.toYYMMDD(shop.vip.expiryTime);
                            }
                        }
                    }
                } else if (that.data.tab == 2) {
                    data.orders = res.data.orders || [];
                    for (let order of data.orders) {
                        order.createTimeStr = TimeUtil.orderTime(order.createTime);
                        order.priceStr = Number(order.price).toFixed(2);
                    }
                } else if (that.data.tab == 3) {
                    data.moneys = res.data.moneys || [];
                    for (let money of data.moneys) {
                        money.createTimeStr = TimeUtil.orderTime(money.createTime);
                        money.valueStr = Number(money.value).toFixed(2);
                        if (money.charge) {
                            money.chargeStr = Number(money.charge).toFixed(2);
                        }
                    }
                } else if (that.data.tab == 4) {
                    data.visits = res.data.visits || [];
                    for (let visit of data.visits) {
                        visit.createTimeStr = TimeUtil.orderTime(visit.createTime);
                    }
                } else if (that.data.tab == 5) {
                    data.actions = res.data.actions || [];
                    for (let action of data.actions) {
                        action.createTimeStr = TimeUtil.orderTime(action.createTime);
                    }
                }
                if (that.data.query.from) {
                    that.data.query.from = null;
                    if (that.data.tab == 0) {
                        data.users = that.data.users.concat(data.users);
                    } else if (that.data.tab == 1) {
                        data.shops = that.data.shops.concat(data.shops);
                    } else if (that.data.tab == 2) {
                        data.orders = that.data.orders.concat(data.orders);
                    } else if (that.data.tab == 3) {
                        data.moneys = that.data.moneys.concat(data.moneys);
                    } else if (that.data.tab == 4) {
                        data.visits = that.data.visits.concat(data.visits);
                    } else if (that.data.tab == 5) {
                        data.actions = that.data.actions.concat(data.actions);
                    } else if (that.data.tab == 6) {
                        data.groupusers = that.data.groupusers.concat(data.groupusers);
                    }
                } else {
                    data.session = that.data.session;
                    let user = res.data.user;
                    user.data.shouruStr = Math.floor((user.data.shouru || 0) * 100 + 0.5) / 100
                    user.data.shouruTodayStr = Math.floor((user.data.shouruToday || 0) * 100 + 0.5) / 100
                    user.moneyStr = Math.floor((user.money || 0) * 100 + 0.5) / 100
                    user.data.lockingMoneyStr = Math.floor((user.data.lockingMoney || 0) * 100 + 0.5) / 100
                    user.data.tixianStr = Math.floor((user.data.tixian || 0) * 100 + 0.5) / 100
                    if (!user.xvip && user.shareby) {
                        that.onShareby()
                    }
                    data.user = user;
                    data.webuser = res.data.webuser;
                    data.count = res.data.count;
                    if (user.xvip || (!user.xvip && user.channel)) {
                        wx.setNavigationBarColor({
                            frontColor: '#000000',
                            backgroundColor: '#FFDB09',
                            animation: {
                                duration: 100,
                                timingFunc: 'easeIn'
                            }
                        });
                        wx.setBackgroundColor({
                            backgroundColor: '#FFDB09' // 窗口的背景色为白色
                        });
                        wx.setNavigationBarTitle({
                            title: '推广中心'
                        });
                    } else {
                        wx.setNavigationBarColor({
                            frontColor: '#000000',
                            backgroundColor: '#ffffff',
                            animation: {
                                duration: 100,
                                timingFunc: 'easeIn'
                            }
                        });
                        wx.setNavigationBarTitle({
                            title: '探店大师'
                        });
                    }
                }

                data.changeNavConfirm = true;
                if (that.data.tab == 0) {
                    data.nomore = res.data.users && res.data.users.length < that.data.query.size ? true : false;
                } else if (that.data.tab == 1) {
                    data.nomore = res.data.shops && res.data.shops.length < that.data.query.size ? true : false;
                } else if (that.data.tab == 2) {
                    data.nomore = res.data.orders && res.data.orders.length < that.data.query.size ? true : false;
                } else if (that.data.tab == 3) {
                    data.nomore = res.data.moneys && res.data.moneys.length < that.data.query.size ? true : false;
                } else if (that.data.tab == 4) {
                    data.nomore = res.data.visits && res.data.visits.length < that.data.query.size ? true : false;
                } else if (that.data.tab == 5) {
                    data.nomore = res.data.actions && res.data.actions.length < that.data.query.size ? true : false;
                } else if (that.data.tab == 6) {
                    data.nomore = res.data.groupusers && res.data.groupusers.length < that.data.query.size ? true : false;
                }
                that.setData(data);
                if (cb) cb();
            }
        });
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function() {
        if (this.data.session) {
            this.loadData(function() {
                wx.stopPullDownRefresh();
            });
        } else {
            wx.stopPullDownRefresh();
        }
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {
        let that = this;
        if (that.data.tab == 0) {
            if (that.data.nomore || that.data.loadingmore || !that.data.session || that.data.users.length == 0) {
                return;
            }
            if (that.data.users) that.data.query.from = that.data.users[that.data.users.length - 1].createTime;
        } else if (that.data.tab == 1) {
            if (that.data.nomore || that.data.loadingmore || !that.data.session || (that.data.shops && that.data.shops.length == 0)) {
                return;
            }
            if (that.data.shops) that.data.query.from = that.data.shops[that.data.shops.length - 1].createTime;
        } else if (that.data.tab == 2) {
            if (that.data.nomore || that.data.loadingmore || !that.data.session || (that.data.orders && that.data.orders.length == 0)) {
                return;
            }
            if (that.data.orders) that.data.query.from = that.data.orders[that.data.orders.length - 1].createTime;
        } else if (that.data.tab == 3) {
            if (that.data.nomore || that.data.loadingmore || !that.data.session || (that.data.moneys && that.data.moneys.length == 0)) {
                return;
            }
            if (that.data.moneys) that.data.query.from = that.data.moneys[that.data.moneys.length - 1].createTime;
        } else if (that.data.tab == 4) {
            if (that.data.nomore || that.data.loadingmore || !that.data.session || (that.data.visits && that.data.visits.length == 0)) {
                return;
            }
            if (that.data.visits) that.data.query.from = that.data.visits[that.data.visits.length - 1].createTime;
        } else if (that.data.tab == 5) {
            if (that.data.nomore || that.data.loadingmore || !that.data.session || (that.data.actions && that.data.actions.length == 0)) {
                return;
            }
            if (that.data.actions) that.data.query.from = that.data.actions[that.data.actions.length - 1].createTime;
        } else if (that.data.tab == 6) {
            if (that.data.nomore || that.data.loadingmore || !that.data.session || (that.data.groupusers && that.data.groupusers.length == 0)) {
                return;
            }
            if (that.data.groupusers) that.data.query.from = that.data.groupusers[that.data.groupusers.length - 1].createTime;
        }
        that.setData({
            loadingmore: true
        });
        that.loadData();
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {
        let that = this;
        let path = '/pages/main/index?shareby=' + that.data.user._id;
        let imageUrl = 'http://cdn.classx.cn/tandian/appshare.jpg@share';
        let title = '';
        return {
            title: title,
            path: path,
            imageUrl: imageUrl
        };
    },
    handleSearchInputChange(e) {
        let keywords = e.detail.keywords;
        this.data.query.keywords = keywords;
        if (!e.detail.keywords) {
            this.loadData();
        }
    },
    handleSearch() {
        let that = this;
        that.setData({
            users: [],
            shops: [],
            orders: [],
            moneys: [],
            visits: [],
            groupusers: [],
            'query.keywords': that.data.query.keywords
        });
        that.loadData();
    },

    handleChangeNav(e) {
        this.setData({
            activeIndex: e.detail.index,
            tab: e.detail.item.type,
            changeNavConfirm: false,
            loading: true
        });
        this.loadData();
    },

    tabChanged: function(e) {
        let that = this;
        let tab = e.currentTarget.dataset.tab;
        that.setData({
            tab: tab,
        });
        that.loadData();
    },

    doNothing: function() {
        let that = this;
    },
    getMoney: function() {
        let that = this;
        if (!that.data.user.phone) {
            that.setData({
                bindPhoneModal: true
            });
            return;
        }
        if (that.data.loading) return;
        wx.showLoading({ title: '' });
        that.data.loading = true;
        getApp().request({
            url: '/userapp/main/getMoney',
            data: {},
            method: 'POST',
            success: function(res) {
                that.data.loading = false;
                if (res.data.success) {
                    wx.showToast({
                        title: '成功提现至微信零钱',
                        icon: 'none'
                    });
                    that.loadData();
                } else {
                    that.setData({
                        tixianFailModal: true
                    });
                }
            }
        });
    },
    hideBindPhoneModal() {
        this.setData({
            bindPhoneModal: false
        });
    },
    setPhoneThenJoin(e) {
        let that = this;
        let bindcode = e.currentTarget.dataset.bindcode;
        if (that.data.loading) {
            return;
        }
        that.data.loading = true;
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
                        that.hideBindPhoneModal();
                        if (bindcode) {
                            that.codebind(e);
                        } else {
                            that.getMoney();
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
    hideTixianFailModal() {
        this.setData({
            tixianFailModal: false
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
            path: 'pages/shop/form?serviceby=' + that.data.user._id,
            envVersion: getApp().env,
            success(res) {
                // 打开成功
            }
        });
    },
    getUsershare: function() {
        let that = this;
        wx.showLoading({ title: '' });
        that.getUsershareQrcode(function(qrcode) {
            wx.previewImage({
                current: qrcode.url,
                urls: [qrcode.url],
                success: function() {
                    wx.hideLoading();
                }
            });
        });
    },
    getUsershareQrcode: function(cb) {
        let that = this;
        if (that.data.loading) return;
        // wx.showLoading({ title: '' })
        that.data.loading = true;
        getApp().request({
            url: '/userapp/main/getSharecode/user',
            data: {},
            method: 'POST',
            success: function(res) {
                // wx.hideLoading()
                that.data.loading = false;
                if (res.data.success) {
                    if (cb) cb(res.data.qrcode);
                }
            }
        });
    },
    getTeamshare: function() {
        let that = this;
        wx.showLoading({ title: '' });
        that.getTeamshareQrcode(function(qrcode) {
            wx.previewImage({
                current: qrcode.url,
                urls: [qrcode.url],
                success: function() {
                    wx.hideLoading();
                }
            });
        });
    },
    getTeamshareQrcode: function(cb) {
        let that = this;
        if (that.data.loading) return;
        // wx.showLoading({ title: '' })
        that.data.loading = true;
        getApp().request({
            url: '/userapp/main/getSharecode/team',
            data: {},
            method: 'POST',
            success: function(res) {
                // wx.hideLoading()
                that.data.loading = false;
                if (res.data.success) {
                    if (cb) cb(res.data.qrcode);
                }
            }
        });
    },
    getShopshare: function() {
        let that = this;
        wx.showLoading({ title: '' });
        that.getShopshareQrcode(function(qrcode) {
            wx.previewImage({
                current: qrcode.url,
                urls: [qrcode.url],
                success: function() {
                    wx.hideLoading();
                }
            });
        });
    },
    getShopshareQrcode: function(cb) {
        let that = this;
        if (that.data.loading) return;
        // wx.showLoading({ title: '' })
        that.data.loading = true;
        getApp().request({
            url: '/userapp/main/getSharecode/shop',
            data: {},
            method: 'POST',
            success: function(res) {
                // wx.hideLoading()
                that.data.loading = false;
                if (res.data.success) {
                    if (cb) cb(res.data.qrcode);
                }
            }
        });
    },

    getServiceshare: function() {
        let that = this;
        wx.showLoading({ title: '' });
        that.getServiceshareQrcode(function(qrcode) {
            wx.previewImage({
                current: qrcode.url,
                urls: [qrcode.url],
                success: function() {
                    wx.hideLoading();
                }
            });
        });
    },
    getServiceshareQrcode: function(cb) {
        let that = this;
        if (that.data.loading) return;
        // wx.showLoading({ title: '' })
        that.data.loading = true;
        getApp().request({
            url: '/userapp/main/getSharecode/service',
            data: {},
            method: 'POST',
            success: function(res) {
                // wx.hideLoading()
                that.data.loading = false;
                if (res.data.success) {
                    if (cb) cb(res.data.qrcode);
                }
            }
        });
    },

    setNotice: function(e) {
        let that = this;
        if (that.data.loading) return;
        that.data.loading = true;
        wx.showLoading({ title: '' });
        let value = e.detail.value;
        if (value && !that.data.webuser) {
            that.setData({ wechatModal: true });
        }
        getApp().request({
            url: '/userapp/main/notice',
            data: { key: 'channel', value: value },
            method: 'POST',
            success: function(res) {
                that.data.loading = false;
                wx.hideLoading();
                if (res.data.success) {
                    if ((value && that.data.webuser) || !value) {
                        wx.showToast({
                            title: '操作成功',
                            icon: 'none'
                        });
                        that.loadData();
                    }
                }
            }
        });
    },
    hideWechatModal: function() {
        let that = this;
        that.setData({ wechatModal: false });
    },
    handleShowContact() {
        this.setData({
            showContactModal: true,
            tixianFailModal: false,
            wechatModal: false
        });
    },
    hideContactModal() {
        this.setData({
            showContactModal: false
        });
    },
    handlePreviewImg() {
        wx.previewImage({
            current: 'http://cdn.classx.cn/tandian/userapp/res/images/image_contact.jpg', // 当前显示图片的http链接
            urls: ['http://cdn.classx.cn/tandian/userapp/res/images/image_contact.jpg'] // 需要预览的图片http链接列表
        });
    },
    handleCopy(e) {
        let that = this;
        let content = e.currentTarget.dataset.content;
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
    },
    onFocus() {
        this.setData({ isFocus: true });
    },
    authThenCheckcode: function(e) {
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
                success: function(res) {
                    wx.hideLoading();
                    that.data.loading = false;
                    getApp().session = res.data.session;
                    that.setData({
                        session: res.data.session,
                        user: res.data.user
                    });
                    that.checkcode(e);
                }
            });
        } else {
            that.data.loading = false;
            wx.hideLoading();
        }
    },
    checkcode: function(e) {
        let that = this;
        if (!that.data.code || that.data.code.length != 6) {
            wx.showToast({
                title: '请输入正确的邀请码',
                icon: 'none'
            });
            return;
        }
        if (that.data.loading) return;
        that.data.loading = true;
        wx.showLoading({ title: '' });
        getApp().request({
            url: '/userapp/main/icode/query',
            data: { code: that.data.code },
            method: 'POST',
            success: function(res) {
                wx.hideLoading();
                that.data.loading = false;
                if (res.data.success) {
                    if (!res.data.friend) {
                        wx.showToast({
                            title: '邀请码无效',
                            icon: 'none'
                        });
                    } else {
                        if (that.data.showCodeModel) {
                            wx.setNavigationBarColor({
                                frontColor: '#000000',
                                backgroundColor: '#FFDB09',
                                animation: {
                                    duration: 100,
                                    timingFunc: 'easeIn'
                                }
                            });
                            wx.setBackgroundColor({
                                backgroundColor: '#FFDB09' // 窗口的背景色为白色
                            });
                            wx.setNavigationBarTitle({
                                title: '推广中心'
                            });
                        }
                        that.setData({ friendModal: true, friend: res.data.friend, showCodeModel: false });
                    }
                }
            }
        });
    },
    hideFriendModal: function() {
        let that = this;
        that.setData({ friendModal: false });
    },

    codeChanged: function(e) {
        let that = this;
        if (e.detail.value) {
            that.setData({ code: String(e.detail.value).toUpperCase() });
        }
    },
    handleInputFocus() {
        this.setData({
            inputSet: true
        })
    },
    handleInputBlur() {
        this.setData({
            inputSet: false
        })
    },
    codebind: function(e) {
        let that = this;
        let item = e.currentTarget.dataset.item;
        if (that.data.loading) return;
        that.data.loading = true;
        wx.showLoading({ title: '' });
        getApp().request({
            url: '/userapp/main/icode/bind',
            data: { friendId: item._id },
            method: 'POST',
            success: function(res) {
                that.data.loading = false;
                that.hideFriendModal();
                if (res.data.success) {
                    wx.showToast({
                        title: '升级成功',
                        icon: 'none'
                    });
                    that.loadData();
                    getApp().userChanged = true
                } else {
                    wx.hideLoading();
                }
            }
        });
    },
    updateToXX: function() {
        let that = this;
        if (that.data.user.data.bind < 100 || that.data.user.data.groupbind < 300) {
            wx.showToast({
                title: '未达成升级条件',
                icon: 'none'
            });
            return;
        }
        if (that.data.loading) return;
        that.data.loading = true;
        wx.showLoading({ title: '' });
        getApp().request({
            url: '/userapp/main/xxvip/upgrade',
            data: {},
            method: 'POST',
            success: function(res) {
                that.data.loading = false;
                if (res.data.success) {
                    wx.showToast({
                        title: '升级成功',
                        icon: 'none'
                    });
                    that.setData({
                        updataModal: true
                    });
                    that.loadData();
                    getApp().userChanged = true
                } else {
                    wx.hideLoading();
                }
            }
        });
    },
    hideUpdataModal() {
        this.setData({
            updataModal: false
        });
    },
    toGuide() {
        // wx.navigateTo({
        //     url: '/pages/main/guide'
        // });
        let env = getApp().env
        let host = env == 'release' ? 'app.classx.cn' : 'test.classx.cn'
        let url = 'https://' + host + '/tandian/web/guide.html';

        wx.navigateTo({
            url: '/pages/main/web?url=' + url
        });
    },
    handleCopy: function(e) {
        let code = e.currentTarget.dataset.code || '';
        wx.setClipboardData({
            data: code,
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
    },
    showTipsModal(e) {
        let modalTitle = e.currentTarget.dataset.title;
        let modalTips = e.currentTarget.dataset.tips;
        this.setData({
            modalTitle,
            modalTips,
            tipsModal: true
        });
    },
    hideTipsModal() {
        this.setData({
            tipsModal: false
        });
    },
    handleShowCodeModel() {
        wx.setNavigationBarColor({
            frontColor: '#000000',
            backgroundColor: '#ffffff',
            animation: {
                duration: 100,
                timingFunc: 'easeIn'
            }
        });
        wx.setNavigationBarTitle({
            title: '探店大师'
        });
        this.setData({
            showCodeModel: true
        });
    },
    handleToMaterial() {
        wx.navigateTo({
            url: '/pages/main/material'
        });
    },
    handleCheckIcode() {
        this.setData({
            code: this.data.shareby.icode,
        })
        this.hideShareby()
    }
});