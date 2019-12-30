const TimeUtil = require('../../utils/TimeUtil.js');
const NumberUtil = require('../../utils/NumberUtil.js');
import Wxml2Canvas from 'wxml2canvas';
Page({
	data: {
		session: null,
		user: null,
		navs: [ { name: '使用规则' }, { name: '商家信息' }, { name: '用户点评' } ],
		activeIndex: 0,
		swiperIndex: 1,
		images: [],
		orderForm: { time: 1 },
		authPhoto: true,
		payModalcss:
			'position: fixed;bottom: 0;left: 0;width: 750rpx;padding: 30rpx 0 0 0;background-color: white;border-radius: 0'
	},
	onLoad(options) {
		let that = this;
		if (options.miaoId) {
			that.data.miaoId = options.miaoId;
		}
		if (options.usermiaoId) {
			that.data.usermiaoId = options.usermiaoId;
		}
		if (options.shareby) {
			getApp().shareby = options.shareby;
			that.data.shareby = options.shareby;
		}
	},
	onReady() {
		let that = this;
		getApp().loadSession(function(session) {
			that.data.session = session;
			that.loadData(function() {
				let location = getApp().location;
				if (!location) {
					location = that.data.user.lastLocation.location;
				}
				if (location && that.data.miao && that.data.miao.shop.location) {
					that.setData({
						location: location,
						disStr: Number(NumberUtil.distance(location, that.data.shop.location)).toFixed(1) + 'km'
					});
				}
			});
		});
	},
	onShow() {
		let that = this;
		getApp().getAuth((res) => {
			let authPhoto = res.authSetting['scope.writePhotosAlbum'];
			if (authPhoto) {
				that.setData({
					authPhoto: true
				});
			}
		});
	},
	onHide() {},
	onUnload() {},
	onPullDownRefresh() {
		if (this.data.session) {
			this.loadData(function() {
				wx.stopPullDownRefresh();
			});
		}
	},
	onReachBottom() {},
	onShareAppMessage() {
		let that = this;
		let imageUrl = that.data.shop.cover + '@share';
		let append = '';
		if (that.data.user) {
			append = '&shareby=' + that.data.user._id;
		}
		let path = '/pages/main/index?miaoId=' + that.data.miao._id + append;
		let title = that.data.miao.shareTitle || that.data.miao.shop.name + that.data.miao.name;
		return {
			title: title,
			path: path,
			imageUrl: imageUrl
		};
	},
	onPageScroll(e) {
		let that = this;
		if (that.data.tabHeight0 && that.data.tabHeight1 && that.data.tabHeight2) {
			if (e.scrollTop > that.data.tabHeight0 && e.scrollTop < that.data.tabHeight1) {
				that.setData({ activeIndex: 0 });
			} else if (e.scrollTop > that.data.tabHeight1 && e.scrollTop < that.data.tabHeight2) {
				that.setData({ activeIndex: 1 });
			} else if (e.scrollTop > that.data.tabHeight2) {
				that.setData({ activeIndex: 2 });
			}
		}
	},
	onResize() {},
	onTabItemTap(item) {},
	loadData(cb) {
		let that = this;
		getApp().request({
			url: '/userapp/miao/detail/load',
			data: { miaoId: that.data.miaoId, usermiaoId: that.data.usermiaoId },
			method: 'POST',
			success(res) {
				let user = res.data.user || null;
				let miao = res.data.miao || null;
				let shop = res.data.shop || null;
				let publicPics = shop.publicPics || [];
				let serverPics = shop.serverPics || [];
				let caiPics = shop.caiPics || [];
				let comments = res.data.comments || [];
				let usermiao = res.data.usermiao;
				let vipBonus = false;
				let done = false;

				let todayStart = new Date(new Date().setHours(0, 0, 0, 0));
				if (user.vip && (!user.lastConsumeTime || new Date(user.lastConsumeTime) < todayStart)) {
					vipBonus = true;
				}

				if (shop.detailHTML) {
					let content = shop.detailHTML.replace(/<img.*?>/g, ($) => {
						return $.replace(/style=".*?"/g, '');
					});
					let fixContent = content.replace(/\<img/g, '<img style="width:100%;height:auto;display: block"');
					let httpOfContent = fixContent.replace(/<img.*?>/g, ($) => {
						return $.replace(/https:\/\/.*?.135editor.com/g, (res) => {
							return res.replace(/https/, 'http');
						});
					});
					let transContent = httpOfContent.replace(/translateZ[(].*[)]/g, 'none');
					shop.detailHTML = transContent.replace(/width: [3-9]{1}\d{2,}px;/g, 'width:100%; ');
				}

				miao.originPriceStr = Number(miao.originPrice || 0).toFixed(2);
				miao.priceStr = Number(miao.price || 0).toFixed(2);
				miao.prepriceStr = Number(miao.preprice || 0).toFixed(2);

				if (miao.shop) {
					miao.shop.feature = miao.feature || miao.shop.feature;
					miao.shop.cpi = miao.cpi || miao.shop.cpi;
					miao.shop.tag1 = miao.tag1 || miao.shop.tag1;
					miao.shop.tag2 = miao.tag2 || miao.shop.tag2;
				}

				if (shop.subshops && shop.subshops.length) {
					shop.subshops.map((item) => {
						item.distance = Number(NumberUtil.distance(getApp().location, item.location)).toFixed(1) + 'km';
					});
				}

				if (
					usermiao &&
					usermiao.order &&
					!usermiao.order.paid &&
					new Date(usermiao.order.expiryTime) > new Date()
				) {
					usermiao.paying = true;
				}

				for (let comment of comments) {
					comment.createTimeStr = TimeUtil.orderTime(comment.createTime);
				}

				if (user.vip) {
					user.vip.expiryTimeStr = TimeUtil.toYYMMDD(user.vip.expiryTime);
				}

				if (new Date(miao.endTime).getTime() < new Date().getTime()) {
					miao.status = 2;
				} else if (new Date(miao.startTime).getTime() < new Date().getTime()) {
					miao.status = 1;
					that.data.clockTime = miao.endTime;
					miao.endTimeStr = TimeUtil.orderTime(miao.endTime);
					that.runClock();
				} else {
					miao.status = 0;
					that.data.clockTime = miao.startTime;
					miao.startTimeStr = TimeUtil.orderTime(miao.startTime);
					that.runClock();
				}

				let data = {
					session: that.data.session,
					user,
					miao,
					shop,
					done, //是否已经砍过
					comments,
					usermiao,
					publicPics,
					caiPics,
					vipBonus,
					images: [ { url: shop.cover }, ...publicPics, ...serverPics, ...caiPics ]
				};
				wx.setNavigationBarTitle({
					title: shop.name
				});
				that.setData(data, () => {
					that.getAllRects();
				});

				if (that.data.editorReady) {
					that.showEditor();
				}
				if (cb) cb();
			}
		});
	},
	handleSwiperCurrent(e) {
		this.setData({
			swiperIndex: e.detail.current + 1
		});
	},
	handleShowSwiperImg(e) {
		let that = this;
		let type = e.currentTarget.dataset.type;
		if (type == 'pub') {
			this.setData({
				swiperCurrent: 1
			});
		} else {
			this.setData({
				swiperCurrent: that.data.publicPics.length + 1
			});
		}
	},
	handleChangeNav(e) {
		let that = this;
		let index = e.detail.index;
		this.setData({
			activeIndex: index
		});
		wx.pageScrollTo({
			scrollTop: that.data['tabHeight' + index] + 2
		});
	},
	toBuy(e) {
		let pre = e.currentTarget.dataset.pre || false;
		this.setData({
			buyModal: true,
			pre
		});
	},
	authThenToBuy(e) {
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
					that.toBuy(e);
				}
			});
		} else {
			that.data.loading = false;
			wx.hideLoading();
		}
	},
	hideBuyModal() {
		this.setData({ buyModal: false });
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
						if (buy) {
							that.buy();
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
	buy() {
		this.pay();
	},
	pay() {
		// todo
		let that = this;
		if (that.data.loading || that.data.disagree) return;
		that.data.loading = true;
		wx.showLoading({
			title: ''
		});
		let data = {
			itemType: 'miao',
			itemId: that.data.miao._id,
			pre: that.data.pre || false //提前约
		};
		if (getApp().from && getApp().from.miaoId == that.data.miao._id) {
			data.postby = getApp().shareby || null;
		}
		getApp().request({
			url: '/userapp/main/prepay',
			data: data,
			method: 'POST',
			success: function(res) {
				wx.hideLoading();
				if (res.data.success) {
					that.data.order = res.data.order;
					if (that.data.order.paid) {
						that.paid();
					} else {
						let data = res.data.order.prepay;
						data.success = function(res) {
							that.paid();
						};
						data.fail = function(res) {
							that.data.loading = false;
							wx.showToast({
								title: '支付失败',
								icon: 'none'
							});
							that.loadData();
						};
						wx.requestPayment(data);
					}
				} else {
					that.data.loading = false;
				}
			}
		});
	},
	paid() {
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
					getApp().miaosChanged = true;
					wx.vibrateShort();
					if (res.data.usercoupon) that.data.usercoupon = res.data.usercoupon;
					that.setData({
						buyModal: false,
						paidModal: true
					});
				} else if (res.data.full) {
					wx.vibrateShort();
					that.loadData();
					that.setData({
						buyModal: false,
						fullModal: true
					});
				}
			}
		});
	},

	toUse(e) {
		let that = this;
		let usercoupon = that.data.usercoupon;
		wx.navigateTo({
			url: '/pages/coupon/detail?' + '&usercouponId=' + usercoupon._id
		});
	},
	hidePaidModal() {
		this.setData({ paidModal: false });
	},
	toIndex() {
		wx.switchTab({
			url: '/pages/main/index'
		});
	},
	onSelectPhone() {
		this.setData({
			callModal: true
		});
	},
	onHideCallModal() {
		this.setData({
			callModal: false
		});
	},
	oncall(e) {
		let phoneNumber = e.currentTarget.dataset.phonenumber;
		wx.makePhoneCall({
			phoneNumber: phoneNumber
		});
	},
	callShop(e) {
		let that = this;
		let item = e.currentTarget.dataset.item;
		if (!item) item = that.data.shop;
		if (!item.contact) {
			wx.showToast({
				title: '无联系方式',
				icon: 'none'
			});
			return;
		}
		wx.makePhoneCall({
			phoneNumber: item.contact
		});
	},
	toShop() {
		wx.navigateTo({
			url: '/pages/shop/detail?shopId=' + this.data.shop._id
		});
	},
	toSubshops: function() {
		let that = this;
		wx.navigateTo({
			url: '/pages/main/subshops?shopId=' + that.data.shop._id
		});
	},
	openLocation: function(e) {
		let that = this;
		let item = e.currentTarget.dataset.item;
		if (!item) item = that.data.shop;
		wx.openLocation({
			longitude: item.location[0],
			latitude: item.location[1],
			name: item.name,
			address: item.address
		});
	},
	toLicense(e) {
		let license = e.currentTarget.dataset.license;
		wx.navigateTo({
			url: '/pages/main/license?license=' + license
		});
	},
	handleShopPass() {
		this.setData({
			passModal: true
		});
	},
	hidePassModal() {
		this.setData({
			passModal: false
		});
	},
	handleReport() {
		let that = this;
		if (that.data.loading) {
			return;
		}
		wx.showLoading({
			title: ''
		});
		that.data.loading = true;
		getApp().request({
			url: '/userapp/miao/report',
			data: {
				miaoId: that.data.miaoId
			},
			method: 'POST',
			success: function(res) {
				that.data.loading = false;
				wx.hideLoading();
				if (res.data.success) {
					that.setData({
						passModal: false
					});
					wx.showToast({
						title: '感谢监督，我们会尽快审核',
						icon: 'none',
						duration: 2000
					});
				}
			}
		});
	},
	handleShowAddrList() {
		this.setData({
			showAddrListModal: true
		});
	},

	hideAddrListModal() {
		this.setData({
			showAddrListModal: false
		});
	},
	onShowVip() {
		let that = this;
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
				that.setData({
					promotion: promotion,
					price: price,
					priceStr: Number(price).toFixed(2),
					vipModal: true,
					buyModal: false
				});
				that.loadPrice();
			}
		});
	},
	loadPrice() {
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
	hideVipModal() {
		this.setData({
			vipModal: false
		});
	},
	toBuyVip() {
		let that = this;
		that.setData({
			payModal: true
		});
	},
	timeChanged: function(e) {
		let that = this;
		let time = e.currentTarget.dataset.time;
		that.setData({ 'orderForm.time': time });
		that.loadPrice();
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
	payVip: function(e) {
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
	handleGetShareCard() {
		let that = this;
		if (that.data.shareImg) {
			that.setData({ shareModal: true });
			return;
		}
		that.handleShareCardImage();
	},

	handleShareCardImage() {
		let that = this;
		if (that.data.loading) {
			return;
		}
		wx.showLoading();
		getApp().request({
			url: '/userapp/miao/detail/getQrcode',
			data: { miaoId: that.data.miaoId },
			method: 'POST',
			success: function(res) {
				if (res.data.success) {
					that.data.shareQrcode = res.data.qrcode.url;
					wx.hideLoading();
					that.setData(
						{
							shareModal: true
						},
						() => {
							if (that.data.miao.playbillType != 'custom') {
								that.drawShareImage();
							} else {
								that.drawCustomShareImage();
							}
						}
					);
				} else {
					wx.hideLoading();
					that.data.loading = false;
				}
			}
		});
	},
	drawCustomShareImage() {
		let that = this;
		let num = 1;
		this.drawImage = new Wxml2Canvas({
			width: 750, // 宽， 以iphone6为基准，传具体数值，其他机型自动适配
			height: 1334, // 高
			element: 'canvas',
			background: '#ffffff',
			progress(percent) {
				that.setData({
					percent: (percent * 1).toFixed(1)
				});
				if (percent == 100) {
					that.setData({
						showImage: true
					});
				}
			},
			finish(url) {
				let shareImg = that.data.shareImg || url;
				that.setData({
					shareImg
				});
			},
			error(res) {}
		});
		let data = {
			list: [
				{
					type: 'image',
					x: 0,
					y: 0,
					url: that.data.miao.playbill,
					style: {
						width: 375 * num,
						height: 667 * num
					}
				},
				{
					type: 'image',
					x: that.data.miao.dx / 2,
					y: that.data.miao.dy / 2,
					url: that.data.shareQrcode,
					style: {
						width: 100 * num,
						height: 100 * num
					}
				}
			]
		};
		this.drawImage.draw(data);
	},
	drawShareImage() {
		let that = this;
		let miao = that.data.miao;
		let shop = that.data.shop;
		let num = 1;
		let tagicon;
		let tag1len = shop.tag1 ? shop.tag1.length : 0;
		let tagHeight = tag1len ? 25 : 0;
		let tag2 = shop.tag2 ? '“' + shop.tag2 + '”' : '';
		let tag2len = tag2 ? tag2.length : 0;
		let feature = shop.feature ? shop.feature : '';
		feature = feature.split('');
		feature.length = feature.length > 4 ? 4 : feature.length;
		feature = feature.join('');
		let name = miao.name.split('');
		name.length = 6;
		name = name.join('');
		let cpi = shop.cpi ? '人均￥' + shop.cpi : '';
		if (miao.nice) {
			tagicon = '/res/images/index_nice.png';
		}
		if (!miao.nice && miao.hot) {
			tagicon = '/res/images/index_hot.png';
		}
		this.drawImage = new Wxml2Canvas({
			width: 750, // 宽， 以iphone6为基准，传具体数值，其他机型自动适配
			height: 1334, // 高
			element: 'canvas',
			background: '#D24D39',
			progress(percent) {
				that.setData({
					percent: (percent * 1).toFixed(1)
				});
				if (percent == 100) {
					that.setData({
						showImage: true
					});
				}
			},
			finish(url) {
				let shareImg = that.data.shareImg || url;
				that.setData({
					shareImg
				});
			},
			error(res) {}
		});

		let originPriceWidth =
			Math.ceil(this.drawImage.measureWidth('' + that.data.miao.originPrice, '16px PingFang SC')) + 2;

		let data = {
			list: [
				{
					type: 'image',
					x: 0,
					y: 0,
					url: 'http://cdn.classx.cn/tandian/userapp/res/images/canvas_top_miao.png',
					style: {
						width: 375 * num,
						height: 72 * num
					}
				},
				{
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
						height: 162 * num
					}
				},
				{
					// miaobox
					type: 'image',
					x: 35 * num,
					y: 250 * num,
					url: '/res/images/canvas_coupon.png',
					style: {
						width: 100 * num,
						height: 132 * num
					}
				},
				{
					type: 'image',
					x: 45 * num,
					y: 260 * num,
					url: that.data.shop.avatar + '@avatar',
					style: {
						width: 80 * num,
						height: 80 * num
					}
				},
				{
					type: 'text',
					x: 50 * num,
					y: 350 * num,
					text: '限量福利',
					style: {
						width: 70 * num,
						color: '#242627',
						fontSize: 12 * num,
						textAlign: 'center'
					}
				},
				{
					//boxright
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
				},
				{
					type: 'text',
					x: 150 * num,
					y: 275 * num,
					text: that.data.shop.address,
					style: {
						width: 190 * num,
						color: '#999999',
						fontSize: 12 * num,
						lineClamp: 1
					}
				},
				{
					type: 'text',
					x: 150 * num,
					y: 294 * num,
					text: feature,
					style: {
						width: feature.length * 13 * num,
						color: '#999999',
						fontSize: 12 * num
					}
				},
				{
					type: 'text',
					x: (160 + feature.length * 12) * num,
					y: 294 * num,
					text: cpi,
					style: {
						width: (this.drawImage.measureWidth(cpi, '12px PingFang SC') + 12) * num,
						color: '#999999',
						fontSize: 12 * num
					}
				},
				{
					type: 'text',
					x: 240 * num,
					y: 294 * num,
					text: '剩余' + miao.amount + '份',
					style: {
						width: 100,
						color: '#999',
						fontSize: 12 * num,
						textAlign: 'right'
					}
				},
				{
					//tag1
					type: 'rect',
					x: 150 * num,
					y: (317 - (cpi || feature ? 0 : 16)) * num,
					style: {
						width: (this.drawImage.measureWidth(that.data.shop.tag1, '12px PingFang SC') + 30) * num,
						height: tag1len >= 1 ? 20 * num : 0,
						fill: '#FFF5E5'
					}
				},
				{
					type: 'text',
					x: 168 * num,
					y:
						getApp().phoneSystem == 'iOS'
							? (317 - (cpi || feature ? 0 : 16)) * num
							: (318 - (cpi || feature ? 0 : 16)) * num,
					text: that.data.shop.tag1 || '',
					style: {
						width: (this.drawImage.measureWidth(that.data.shop.tag1, '12px PingFang SC') + 8) * num,
						color: '#FE9E00',
						fontSize: 12 * num,
						lineClamp: tag1len > 13 ? 1 : 2
					}
				},
				{
					type: 'image',
					x: 155 * num,
					y: (321 - (cpi || feature ? 0 : 16)) * num,
					url: '/res/images/index_tag.png',
					style: {
						width: that.data.shop.tag1 ? 10 * num : 0,
						height: that.data.shop.tag1 ? 11 * num : 0
					}
				},
				{
					//tag2
					type: 'rect',
					x: 150 * num,
					y: (317 + tagHeight - (cpi || feature ? 0 : 16)) * num,
					style: {
						width: (this.drawImage.measureWidth(that.data.shop.tag2, '12px PingFang SC') + 28) * num,
						height: tag2len >= 1 ? 20 * num : 0,
						fill: '#FFF1EB'
					}
				},
				{
					type: 'text',
					x: 155 * num,
					y:
						getApp().phoneSystem == 'iOS'
							? (317 + tagHeight - (cpi || feature ? 0 : 16)) * num
							: (318 + tagHeight - (cpi || feature ? 0 : 16)) * num,
					text: tag2,
					style: {
						width: (this.drawImage.measureWidth(tag2, '12px PingFang SC') + 10) * num,
						color: '#FF6D26',
						fontSize: 12 * num
					}
				},
				{
					type: 'text',
					x: 155 * num,
					y: 361 * num,
					text: that.data.miao.endTimeStr + '截止',
					style: {
						width:
							(this.drawImage.measureWidth(that.data.miao.endTimeStr + '截止', '12px PingFang SC') + 10) *
							num,
						color: '#FF4925',
						fontSize: 12 * num
					}
				},

				{
					type: 'text',
					x: 40 * num,
					y: 408 * num,
					text: that.data.miao.name,
					style: {
						width: 200,
						color: '#242627',
						fontSize: 18 * num,
						lineClamp: 1,
						fontWeight: 'bold'
					}
				},
				{
					type: 'text',
					x: 40 * num,
					y: 437 * num,
					text: '原价￥' + that.data.miao.originPriceStr,
					style: {
						width:
							this.drawImage.measureWidth('原价￥' + that.data.miao.originPriceStr, '12px PingFang SC') + 10,
						color: '#999',
						fontSize: 12 * num
					}
				},
				{
					type: 'line',
					x: 72 * num,
					y: 444 * num,
					x2: 72 * num,
					y2: 445 * num,
					style: {
						width: this.drawImage.measureWidth('原价￥' + that.data.miao.originPriceStr, '12px PingFang SC'),
						stroke: '#999'
					}
				},
				{
					type: 'text',
					x:
						(40 + this.drawImage.measureWidth('原价￥' + that.data.miao.originPriceStr, '14px PingFang SC')) *
						num,
					y: 437 * num,
					text: '活动价￥' + that.data.miao.priceStr,
					style: {
						width: 200,
						color: '#FF4925',
						fontSize: 12 * num,
						lineClamp: 1
					}
				},
				{
					type: 'text',
					x: 40 * num,
					y: 458 * num,
					text: '长按图片，前往小程序抢购',
					style: {
						width: 200 * num,
						color: '#242627',
						fontSize: 12 * num
					}
				},
				{
					type: 'image',
					x: 257 * num,
					y: 400 * num,
					url: that.data.shareQrcode,
					style: {
						width: 80 * num,
						height: 80 * num
					}
				},
				{
					type: 'image',
					x: 0 * num,
					y: 501 * num,
					url: 'http://cdn.classx.cn/tandian/userapp/res/images/canvas_bottom_miao.png',
					style: {
						width: 375 * num,
						height: 166 * num
					}
				},
				{
					type: 'text',
					x: 0 * num,
					y: 521 * num,
					text: '还有更多秒杀活动',
					style: {
						width: 375 * num,
						color: '#E8CB93',
						fontSize: 16 * num,
						textAlign: 'center',
						fontWeight: 'bold'
					}
				},
				{
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
		};
		this.drawImage.draw(data);
	},
	hideShareModal() {
		this.setData({
			shareModal: false
		});
	},

	// util
	getAllRects(cb) {
		let that = this;
		wx
			.createSelectorQuery()
			.in(this)
			.selectAll('.pagenav')
			.boundingClientRect((rects) => {
				let height = 0;
				rects.forEach((rect) => {
					height = rect.height;
				});

				wx
					.createSelectorQuery()
					.in(this)
					.selectAll('.tabbox')
					.boundingClientRect((rect2) => {
						console.log(rect2);

						rect2.forEach((rect, index) => {
							that.data['tabHeight' + index] = rect.top - height;
						});
					})
					.exec();
			})
			.exec();
	},
	runClock() {
		let that = this;
		let clock = {};
		let clockTime = that.data.clockTime;
		if (clockTime <= new Date().getTime()) {
			that.loadData();
			return;
		}
		clock.hour = Math.floor((clockTime - new Date().getTime()) / (1000 * 60 * 60));
		clock.min = Math.floor(((clockTime - new Date().getTime()) % (1000 * 60 * 60)) / (1000 * 60));
		clock.sec = Math.floor((((clockTime - new Date().getTime()) % (1000 * 60 * 60)) % (1000 * 60)) / 1000);
		clock.hour = that.clockStr(clock.hour);
		clock.min = that.clockStr(clock.min);
		clock.sec = that.clockStr(clock.sec);
		that.setData({ clock: clock });
		setTimeout(() => {
			that.runClock();
		}, 1000);
	},
	clockStr(time) {
		if (time < 10) {
			time = '0' + time;
		}
		return time;
	}
});
