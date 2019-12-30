const TimeUtil = require('../../utils/TimeUtil.js');
Page({
	/**
     * 页面的初始数据
     */
	data: {
		session: null,
		user: null,
		joinModal: false,
		adCount: 0,
		orderForm: { time: 1 },
		cornList: [
			{ amount: 1 },
			{ amount: 1 },
			{ amount: 1 },
			{ amount: 2 },
			{ amount: 1 },
			{ amount: 1 },
			{ amount: 3 }
		]
	},

	/**
     * 生命周期函数--监听页面加载
     */
	onLoad: function(options) {
		let that = this;
		this.options = options;
		console.log(options);

		this.doLoad();
		// that.initCustomNav()
		that.setData({
			phoneSystem: getApp().phoneSystem
		});
		if (new Date().getHours() >= 8 && new Date().getHours() <= 23) {
			that.setData({ serviceStr: '【小师妹~】当前在线' });
		} else {
			that.setData({ serviceStr: '在线时间 08:00 - 23:59' });
		}
	},

	doLoad: function() {
		let that = this;
		let options = this.options;
		if (options.shareby) {
			getApp().shareby = options.shareby;
			that.data.shareby = options.shareby;
		}
		getApp().loadSession(function(session) {
			that.data.session = session;
			that.loadData();
		});
	},

	loadData: function(cb) {
		let that = this;
		getApp().request({
			url: '/userapp/main/me/load',
			data: {},
			method: 'POST',
			success: function(res) {
				let user = res.data.user;
				let todayStart = new Date(new Date().setHours(0, 0, 0, 0));
				let tomorrow = new Date(new Date().setHours(0, 0, 0, 0) + 1000 * 60 * 60 * 24);
				if (user.lastSignTime && new Date(user.lastSignTime) > todayStart) {
					user.signed = true;
				}
				if (user.signNoticeTime && new Date(user.signNoticeTime) > tomorrow) {
					user.signNoticed = true;
				}
				if (user.money) {
					user.moneyStr = Number(user.money).toFixed(2);
				}
				if (user.vip) {
					user.vip.expiryTimeStr = TimeUtil.toYYMMDD(user.vip.expiryTime);
				}
				that.setData({
					session: that.data.session,
					user: user || null,
					couponCount: res.data.couponCount,
					env: getApp().env,
					mocking: getApp().mocking || false,
					adPassed: res.data.adPassed,
					uncomments: res.data.uncomments
				});
				if (cb) cb();
			}
		});
	},

	onShow() {
		if (getApp().systemError) {
			getApp().systemError = null;
			this.doLoad();
			return;
		}
		if (getApp().vipActive) {
			this.showVipModal();
			getApp().vipActive = false;
		}
		if (getApp().comment) {
			this.loadData();
			getApp().comment = false;
		}
		if (getApp().userChanged) {
			this.loadData()
			getApp().userChanged = false;
		}
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
		if (this.data.session) {
			this.loadData(function() {
				wx.stopPullDownRefresh();
			});
		}
	},

	/**
     * 页面上拉触底事件的处理函数
     */
	onReachBottom: function() {},

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

	initCustomNav() {
		let that = this;
		that.setData({
			statusBarHeight: wx.getSystemInfoSync().statusBarHeight,
			navHeight: 38
		});
	},

	toCoupons: function() {
		let that = this;
		wx.navigateTo({
			url: '/pages/main/coupons'
		});
	},
	toLuckcoin() {
		wx.navigateTo({
			url: '/pages/main/luckcoin'
		});
	},
	toKanjias: function() {
		let that = this;
		wx.navigateTo({
			url: '/pages/main/kanjias'
		});
	},

	auth: function(e) {
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
						session: res.data.session
					});
					that.loadData();
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
	authThenToTasks: function(e) {
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
						session: res.data.session
					});
					that.loadData();
					that.toTasks();
				}
			});
		} else {
			that.data.loading = false;
			wx.hideLoading();
		}
	},
	toTasks: function() {
		let that = this;
		wx.navigateTo({
			url: '/pages/main/tasks'
		});
	},
	toComments: function() {
		let that = this;
		wx.navigateTo({
			url: '/pages/main/comments'
		});
	},
	toBows: function() {
		let that = this;
		wx.navigateTo({
			url: '/pages/main/userbows'
		});
	},
	toDakas: function() {
		let that = this;
		wx.navigateTo({
			url: '/pages/main/dakas'
		});
	},
	showWechatModal: function() {
		let that = this;
		that.setData({ wechatModal: true });
	},
	hideWechatModal: function() {
		let that = this;
		that.setData({ wechatModal: false });
	},
	toFav: function() {
		let that = this;
		that.setData({ 'user.faved': true });
		getApp().request({
			url: '/userapp/session/faved',
			data: {},
			method: 'POST'
		});
	},
	toAdminSetting: function() {
		let that = this;
		wx.navigateTo({
			url: '/pages/admin/setting'
		});
	},

	cancelMocking: function() {
		let that = this;
		getApp().session = null;
		getApp().mocking = null;
		wx.reLaunch({ url: '/pages/main/index' });
	},

	handlejoin() {
		this.setData({
			joinModal: true
		});
	},
	hideJoinModal() {
		this.setData({
			joinModal: false
		});
	},
	handleCall() {
		wx.makePhoneCall({
			phoneNumber: '18380459072'
		});
	},
	toSign() {
		let that = this;
		// if (that.data.user.signed) { return }
		// if (that.data.ading) {
		//     return
		// }
		that.setData({ ading: true });
		if (that.data.adPassed && wx.createRewardedVideoAd) {
			if (!that.data.videoAd) {
				that.data.videoAd = wx.createRewardedVideoAd({
					adUnitId: 'adunit-272d8094b2c6edcd'
				});
				that.data.videoAd.onError(function(err) {
					console.log(err.errMsg);
					that.setData({ ading: false });
					sign();
				});
				that.data.videoAd.onClose(function(status) {
					that.setData({ ading: false });
					if ((status && status.isEnded) || status === undefined) {
						sign();
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
			sign();
		}

		function sign() {
			wx.showLoading({ title: '' });
			getApp().request({
				url: '/userapp/main/signConfirm',
				data: {},
				method: 'POST',
				success: function(res) {
					that.setData({ ading: false });
					wx.hideLoading();
					if (res.data.success) {
						that.loadData();
						that.setData({ signSuccessModal: true, signModal: false });
						wx.vibrateShort();
					}
				}
			});
		}
	},

	noticeMe: function() {
		let that = this;
		if (that.data.loading) return;
		that.data.loading = true;
		let time = '09:00'; //应通过时间选择器获取
		getApp().request({
			url: '/userapp/main/sign/notice',
			data: { time: time },
			method: 'POST',
			success: function(res) {
				that.data.loading = false;
				if (res.data.success) {
					that.setData({ 'user.signNotice': time, 'user.signNoticed': true });
				}
			}
		});
	},

	toCancelNoticeMe: function() {
		let that = this;
		wx.showActionSheet({
			itemList: [ '取消提醒' ],
			success: function(r) {
				if (r.tapIndex == 0) {
					if (that.data.loading) return;
					that.data.loading = true;
					getApp().request({
						url: '/userapp/main/sign/notice/cancel',
						data: {},
						method: 'POST',
						success: function(res) {
							that.data.loading = false;
							if (res.data.success) {
								that.setData({ 'user.signNoticed': false, 'user.signNotice': null });
							}
						}
					});
				}
			}
		});
	},

	hideSignSuccessModal: function() {
		let that = this;
		that.setData({ signSuccessModal: false });
	},

	toMoney: function() {
		let that = this;
		if (that.data.user.channel) {
			wx.navigateTo({
				url: '/pages/main/wallet'
			});
		} else {
			if (that.data.user.money) {
				wx.showActionSheet({
					itemList: [ '提现' ],
					success: function(r) {
						if (r.tapIndex == 0) {
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
									}
								}
							});
						}
					}
				});
			} else {
				wx.showToast({
					title: '钱包空空的',
					icon: 'none'
				});
			}
		}
	},

	showVipModal: function() {
		let that = this;
		wx.hideTabBar({
			success() {
				that.setData({ vipModal: true });
			}
		});
		wx.setNavigationBarColor({
			frontColor: '#000000',
			backgroundColor: '#4c4009'
		});
		// setTimeout(() => {
		//     that.setData({ vipModal: true })
		// }, 100)
		getApp().request({
			url: '/userapp/main/vip/loadPromotion',
			data: {},
			method: 'POST',
			success: function(res) {
				let promotion = res.data.promotion;
				if (promotion) {
					promotion.priceStr = Number(promotion.price).toFixed(2);
					promotion.expiryTimeStr = TimeUtil.orderTime(promotion.expiryTime);
					that.runClock(promotion);
				}
				let price = res.data.price;
				that.setData({ promotion: promotion, price: price, priceStr: Number(price).toFixed(2) });
				that.loadPrice();
			}
		});
	},
	runClock: function(promotion) {
		let that = this;
		let clock = {};
		let expiryTime = new Date(promotion.expiryTime).getTime();
		if (expiryTime <= new Date().getTime()) {
			that.loadData();
			return;
		}
		clock.hour = Math.floor((expiryTime - new Date().getTime()) / (1000 * 60 * 60));
		clock.min = Math.floor(((expiryTime - new Date().getTime()) % (1000 * 60 * 60)) / (1000 * 60));
		clock.sec = Math.floor((((expiryTime - new Date().getTime()) % (1000 * 60 * 60)) % (1000 * 60)) / 1000);
		if (clock.sec < 10) {
			clock.sec = '0' + clock.sec;
		}
		that.setData({ clock: clock });
		setTimeout(() => {
			that.runClock(promotion);
		}, 1000);
	},
	hideVipModal: function() {
		let that = this;
		that.setData({ vipModal: false });
		wx.showTabBar();
		wx.setNavigationBarColor({
			frontColor: '#000000',
			backgroundColor: '#FFDB09'
		});
	},
	doNothing: function() {
		let that = this;
	},

	timeChanged: function(e) {
		let that = this;
		let time = e.currentTarget.dataset.time;
		that.setData({ 'orderForm.time': time });
		that.loadPrice();
	},
	loadPrice: function() {
		let that = this;
		let promotions = [];
		let price = that.data.price;
		that.data.orderForm.originPrice = that.data.orderForm.time * price;
		if (that.data.promotion) {
			price = that.data.promotion.price;
			that.data.orderForm.promotion = that.data.promotion;
		}
		that.data.orderForm.price = that.data.orderForm.time * price;
		that.data.orderForm.priceStr = Number(that.data.orderForm.price).toFixed(2);
		that.data.orderForm.originPriceStr = Number(that.data.orderForm.originPrice).toFixed(2);
		that.setData({ orderForm: that.data.orderForm });
	},
	toBuy: function() {
		let that = this;
		that.setData({
			payModal: true
		});
	},
	hidePayModal: function() {
		let that = this;
		that.setData({
			payModal: false
		});
	},

	showLicenseModal: function() {
		let that = this;
		that.setData({
			licenseModal: true
		});
	},
	hideLicenseModal: function() {
		let that = this;
		that.setData({
			licenseModal: false
		});
	},
	licenseChanged: function(e) {
		let that = this;
		if (e.detail.value.indexOf('agree') == -1) {
			that.setData({
				disagree: true
			});
		} else {
			that.setData({
				disagree: false
			});
		}
	},

	pay: function(e) {
		let that = this;
		if (that.data.loading || that.data.disagree) return;
		that.data.loading = true;
		wx.showLoading({
			title: ''
		});
		getApp().request({
			url: '/userapp/main/prepay',
			data: {
				itemType: 'vip',
				form: that.data.orderForm
			},
			method: 'POST',
			success: function(res) {
				wx.hideLoading();
				if (res.data.success) {
					that.data.order = res.data.order;
					if (that.data.order.paid) {
						that.getResult();
					} else {
						let data = res.data.order.prepay;
						data.success = function(res) {
							that.getResult();
						};
						data.fail = function(res) {
							that.data.loading = false;
							wx.showToast({
								title: '支付失败',
								icon: 'none'
							});
						};
						wx.requestPayment(data);
					}
				} else {
					that.data.loading = false;
				}
			}
		});
	},
	getResult: function() {
		let that = this;
		wx.showLoading({
			title: ''
		});
		getApp().request({
			url: '/userapp/main/paid',
			data: {
				orderId: that.data.order._id
			},
			method: 'POST',
			success: function(res) {
				that.data.loading = false;
				wx.hideLoading();
				if (res.data.success) {
					that.setData({
						payModal: false,
						vipModal: false
					});
					wx.showTabBar();
					wx.setNavigationBarColor({
						frontColor: '#000000',
						backgroundColor: '#FFDB09'
					});
					getApp().dataChanged = true;
					wx.showToast({
						title: '支付成功',
						icon: 'none'
					});
					that.loadData();
				}
			}
		});
	},
	toGous() {
		wx.navigateTo({
			url: '/pages/main/goulist'
		});
	},
	showSignModal() {
		this.setData({
			signModal: true
		});
	},
	hideSignModal() {
		this.setData({
			signModal: false
		});
	},
	handleShowContact() {
		this.setData({
			showContactModal: true,
			joinModal: false,
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
			urls: [ 'http://cdn.classx.cn/tandian/userapp/res/images/image_contact.jpg' ] // 需要预览的图片http链接列表
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

	toCreateShop: function() {
		let that = this;
		wx.showLoading({ title: '' });
		setTimeout(() => {
			wx.hideLoading();
		}, 1000);
		let append = '';
		if (getApp().serviceby) {
			append = '&serviceby=' + getApp().serviceby;
		}
		wx.navigateToMiniProgram({
			appId: 'wx8bcf2758c6249d28',
			path: 'pages/shop/form?simpleMode=true' + append,
			envVersion: getApp().env,
			success(res) {
				// 打开成功
			}
		});
	},
	toBindCode: function() {
		wx.navigateTo({
			url: '/pages/main/wallet'
		});
	}
});
