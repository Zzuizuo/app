const TimeUtil = require('../../utils/TimeUtil.js');

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
        }
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        this.options = options;
        this.doLoad();
    },
    doLoad: function() {
        let that = this;
        let options = this.options;

        getApp().loadSession(function(session) {
            that.data.session = session;
            that.loadData();
        });
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function() {
        if (getApp().systemError) {
            getApp().systemError = null;
            this.doLoad();
            return;
        }
        if (this.data.user) {
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
        if (that.data.nomore || that.data.loadingmore || !that.data.session || that.data.comments.length == 0) {
            return;
        }
        that.data.query.from = that.data.comments[that.data.comments.length - 1].createTime;
        that.setData({
            loadingmore: true
        });
        that.loadData();
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {},

    onShow: function() {
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
        if (getApp().pageChanged) {
            getApp().dataChanged = false;
            getApp().loadSession(function(session) {
                that.data.session = session;
                that.loadData();
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
    },

    loadData: function(cb) {
        let that = this;
        getApp().request({
            url: '/userapp/main/chats/load',
            data: { query: that.data.query },
            method: 'POST',
            success: function(res) {
                let data = {
                    loading: false,
                    loadingmore: false,
                    banner: {}
                };
                data.comments = res.data.comments || [];
                if (that.data.query.from) {
                    that.data.query.from = null;
                    data.comments = that.data.comments.concat(data.comments);
                } else {
                    data.session = that.data.session;
                    data.user = res.data.user;
                    data.setting = res.data.setting || {};
                    data.banner.title = res.data.setting.banners[0].title;
                    data.banner.icon = res.data.setting.banners[0].icon;
                }
                for (let comment of data.comments) {
                    comment.createTimeStr = TimeUtil.orderTime(comment.createTime);
                }
                data.nomore = res.data.comments && res.data.comments.length < that.data.query.size ? true : false;
                that.setData(data);
                if (cb) cb();
            }
        });
    },
    toBannerPath: function(e) {
        let that = this;
        let item = e.currentTarget.dataset.item;
        wx.navigateTo({
            url: item.path
        });
    },
    handleChangeBanner(e) {
        let index = e.detail.current;
        this.data.banner.title = this.data.setting.banners[index].title;
        this.data.banner.icon = this.data.setting.banners[index].icon;
        this.setData({
            banner: this.data.banner
        });
    },
    keywordsChanged: function(e) {
        let that = this;
        // if (!that.data.searching) {
        //     that.startSearch()
        // }
        that.setData({
            keywords: e.detail.value
        });
        that.data.query.keywords = e.detail.value;
    },
    handleDeleteKeywords() {
        let that = this;
        that.setData({
            comments: [],
            keywords: ''
        });
        that.data.query.keywords = '';
        that.loadData();
    },
    startSearch: function() {
        let that = this;
        that.setData({
            searching: true
        });
    },
    endSearch: function() {
        let that = this;
        that.setData({
            searching: false
        });
    },

    doSearch: function() {
        let that = this;
        that.setData({
            comments: [],
            'query.keywords': that.data.query.keywords
        });
        that.loadData();
    },
    showAvatar: function(res) {
        let that = this;
        let item = res.detail.item;
        wx.previewImage({
            current: item.user.headimgurl,
            urls: [item.user.headimgurl]
        });
    },
    showActions: function(res) {
        let that = this;
        let i = res.detail.i;
        let item = res.detail.item;
        that.setData({ currentItem: item });
        let actions = [];
        if (that.data.user.super) {
            if (item.pass) {
                actions.push('拒绝');
            } else {
                actions.push('通过');
            }
        }
        wx.showActionSheet({
            itemList: actions,
            success: function(r) {
                if (actions[r.tapIndex] == '通过') {
                    getApp().request({
                        url: '/shopapp/comment/pass',
                        data: { commentId: item._id, fromChats: true },
                        method: 'POST',
                        success: function(res) {
                            wx.showToast({
                                title: ''
                            });
                            that.loadData();
                        }
                    });
                } else if (actions[r.tapIndex] == '拒绝') {
                    getApp().request({
                        url: '/shopapp/comment/reject',
                        data: { commentId: item._id, fromChats: true },
                        method: 'POST',
                        success: function(res) {
                            wx.showToast({
                                title: ''
                            });
                            that.loadData();
                        }
                    });
                }
            }
        });
    },

    toReply: function() {
        let that = this;
        that.setData({ replyModal: true, currentReplyIndex: null, 'form.content': '' });
    },

    hideReplyModal: function() {
        let that = this;
        that.setData({ replyModal: false, currentReplyIndex: null });
    },
    replyChanged: function(e) {
        let that = this;
        that.setData({ 'form.content': e.detail.value });
    },
    replySubmit: function() {
        let that = this;
        if (!that.data.user.authed) {
            that.setData({ authModal: true });
        } else {
            that.submit();
        }
    },
    submit: function() {
        let that = this;
        if (that.data.loading) {
            return;
        }
        that.data.loading = true;
        getApp().request({
            url: '/userapp/main/comment/reply',
            data: { commentId: that.data.currentItem._id, form: that.data.form },
            method: 'POST',
            success: function(res) {
                that.data.loading = false;
                if (res.data.success) {
                    that.setData({ replyModal: false });
                    wx.showToast({
                        title: '提交成功',
                        icon: 'none'
                    });
                    that.loadData(); //TODO 可优化
                }
            }
        });
    },

    onPageScroll: function(e) {
        let that = this;
        let topHeight = 168;
        if (e.scrollTop >= topHeight && !that.data.navFixed) {
            that.setData({ navFixed: true });
        } else if (e.scrollTop < topHeight && that.data.navFixed) {
            that.setData({ navFixed: false });
        }
    },

    auth: function(e) {
        let that = this;
        if (that.data.loading) {
            return;
        }
        console.log(e);
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
                    wx.showToast({
                        title: '信息已更新',
                        icon: 'none'
                    });
                }
            });
        } else {
            that.data.loading = false;
            wx.hideLoading();
        }
    },
    showImage: function(e) {
        let that = this;
        let item = e.currentTarget.dataset.item;
        console.log(item);
        let i = e.currentTarget.dataset.i;
        let urls = [];
        for (let image of item.images) {
            urls.push(image.url);
        }
        wx.previewImage({
            current: item.images[i].url,
            urls: urls
        });
    },
    replyClicked: function(res) {
        let that = this;
        let reply = res.detail.reply;
        let comment = res.detail.comment;
        let index = res.detail.index;
        let actions = [];
        if (that.data.user._id == reply.createBy._id) {
            actions.push('删除');
        } else {
            if (that.data.user._id != reply.createBy._id) {
                actions.push('回复');
            }
            if (that.data.user._id == comment.user._id) {
                actions.push('删除');
            }
            // if (that.data.user._id == comment.user._id) {
            //     actions.push('禁言')
            // }
            // actions.push('举报')
        }

        wx.showActionSheet({
            itemList: actions,
            success: function(r) {
                if (actions[r.tapIndex] == '删除') {
                    getApp().request({
                        url: '/userapp/main/comment/deleteReply',
                        data: { commentId: comment._id, index: index },
                        method: 'POST',
                        success: function(res) {
                            if (res.data.success) {
                                that.loadData();
                            }
                        }
                    });
                } else if (actions[r.tapIndex] == '回复') {
                    let commentIndex = that.data.comments.indexOf(comment);
                    that.data.currentItem = comment;
                    that.setData({
                        replyModal: true,
                        currentReplyIndex: commentIndex,
                        'form.content': '@' + reply.createBy.nickname + ' '
                    });
                }
            }
        });
    },
    doNothing: function() {
        let that = this;
    },
    toShop: function(res) {
        let that = this;
        let item = res.detail.item;
        wx.navigateTo({
            url: '/pages/shop/detail?shopId=' + item.shop._id + '&fromCommentId=' + item._id
        });
    },
    toDetail: function(e) {
        let that = this
        let item = e.currentTarget.dataset.item
        wx.navigateTo({
            url: '/pages/shop/detail?shopId=' + item.shopId
        });
    },

    toUpdateLocation: function() {
        let that = this;
        if (that.data.user && that.data.user.lastLocation) {
            wx.showActionSheet({
                itemList: ['重新定位', '清除定位'],
                success: function(r) {
                    if (r.tapIndex == 0) {
                        that.updateLocation();
                    } else if (r.tapIndex == 1) {
                        getApp().request({
                            url: '/userapp/main/location/clear',
                            data: {},
                            method: 'POST',
                            success: function(res) {
                                that.data.loading = false;
                                wx.hideLoading();
                                if (res.data.success) {
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
    updateLocation: function() {
        let that = this;
        if (that.data.loading) return;
        wx.showLoading({ title: '' });
        that.data.loading = true;
        wx.getLocation({
            type: 'gcj02',
            success: function(res) {
                var latitude = res.latitude;
                var longitude = res.longitude;
                let location = [longitude, latitude];
                getApp().location = location;
                that.data.location = location;
                getApp().request({
                    url: '/userapp/session/location',
                    data: { location: location },
                    method: 'POST',
                    success: function(res) {
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
            }
        });
    }
});