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
		authPhoto: true
	},
	onLoad(options) {
		let that = this;
		if (options.tuanId) {
			that.data.tuanId = options.tuanId;
		}
		if (options.usertuanId) {
			that.data.usertuanId = options.usertuanId;
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
				if (getApp().location && that.data.tuan && that.data.tuan.shop.location) {
					that.setData({
						location: getApp().location,
						disStr:
							Number(NumberUtil.distance(getApp().location, that.data.tuan.shop.location)).toFixed(1) +
							'km'
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
		let path = '/pages/main/index?tuanId=' + that.data.tuan._id + append;
		let title = that.data.tuan.shareTitle || that.data.tuan.shop.name + that.data.tuan.name;
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
			url: '/userapp/tuan/detail/load',
			data: { tuanId: that.data.tuanId, usertuanId: that.data.usertuanId },
			method: 'POST',
			success(res) {
				let user = res.data.user || null;
				let tuan = res.data.tuan || null;
				let shop = res.data.shop || null;
				let publicPics = shop.publicPics || [];
				let serverPics = shop.serverPics || [];
				let caiPics = shop.caiPics || [];
				let comments = res.data.comments || [];
				let usertuan = res.data.usertuan;
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

				tuan.originPriceStr = Number(tuan.originPrice || 0).toFixed(2);
				tuan.priceStr = Number(tuan.price || 0).toFixed(2);
				tuan.planpriceStr = Number(tuan.planprice || 0).toFixed(2);
				tuan.minusPrice = Number(tuan.price || 0) - Number(tuan.planprice || 0);

				if (tuan.shop) {
					tuan.shop.feature = tuan.feature || tuan.shop.feature;
					tuan.shop.cpi = tuan.cpi || tuan.shop.cpi;
					tuan.shop.tag1 = tuan.tag1 || tuan.shop.tag1;
					tuan.shop.tag2 = tuan.tag2 || tuan.shop.tag2;
				}

				if (shop.subshops && shop.subshops.length) {
					shop.subshops.map((item) => {
						item.distance = Number(NumberUtil.distance(getApp().location, item.location)).toFixed(1) + 'km';
					});
				}

				if (
					usertuan &&
					usertuan.order &&
					!usertuan.order.paid &&
					new Date(usertuan.order.expiryTime) > new Date()
				) {
					usertuan.paying = true;
				}

				for (let comment of comments) {
					comment.createTimeStr = TimeUtil.orderTime(comment.createTime);
				}

				if (user.vip) {
					user.vip.expiryTimeStr = TimeUtil.toYYMMDD(user.vip.expiryTime);
				}

				let data = {
					session: that.data.session,
					user,
					tuan,
					shop,
					done, //是否已经砍过
					comments,
					usertuan,
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
		let plan = e.currentTarget.dataset.plan || false;
		this.setData({
			buyModal: true,
			plan
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
		let that = this;
		if (that.data.loading || that.data.disagree) return;
		that.data.loading = true;
		wx.showLoading({
			title: ''
		});
		let data = {
			itemType: 'tuan',
			itemId: that.data.tuan._id,
			plan: that.data.plan || false //提前约
		};
		if (getApp().from && getApp().from.tuanId == that.data.tuan._id) {
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
					getApp().tuansChanged = true;
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
			url: '/userapp/tuan/report',
			data: {
				tuanId: that.data.tuanId
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
			url: '/userapp/tuan/detail/getQrcode',
			data: { tuanId: that.data.tuanId },
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
							if (that.data.tuan.playbillType != 'custom') {
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
					url: that.data.tuan.playbill,
					style: {
						width: 375 * num,
						height: 667 * num
					}
				},
				{
					type: 'image',
					x: that.data.tuan.dx / 2,
					y: that.data.tuan.dy / 2,
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
		let tuan = that.data.tuan;
		let num = 1;
		let tagicon;
		let tag1len = that.data.shop.tag1 ? that.data.shop.tag1.length : 0;
		let tagHeight = tag1len ? 25 : 0;
		let tag2 = that.data.shop.tag2 ? '"' + that.data.shop.tag2 + '"' : '';
		let tag2len = tag2 ? tag2.length : 0;
		let name = that.data.tuan.name.split('');
		name.length = 6;
		name = name.join('');
		if (tuan.nice) {
			tagicon = '/res/images/index_nice.png';
		}
		if (!tuan.nice && tuan.hot) {
			tagicon = '/res/images/index_hot.png';
		}
		this.drawImage = new Wxml2Canvas({
			width: 750 * num, // 宽， 以iphone6为基准，传具体数值，其他机型自动适配
			height: 1334 * num, // 高
			element: 'canvas',
			background: '#FFDB09',
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
					url: 'http://cdn.classx.cn/tandian/userapp/res/images/canvas_top_tuan.png',
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
					// tuanbox
					type: 'rect',
					x: 35 * num,
					y: 250 * num,
					style: {
						width: 100 * num,
						height: 132 * num,
						fill: '#FFF9F0',
						boxShadow: '0 0 10 rgba(173,173,173, 0.1)'
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
					text: '团购优惠',
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
					//tag1
					type: 'rect',
					x: 150 * num,
					y: 300 * num,
					style: {
						width: ((tag1len > 13 ? 13 : tag1len) * 12 + 10) * num,
						height: tag1len >= 1 ? 20 * num : 0,
						fill: '#FFF5E5'
					}
				},
				{
					type: 'text',
					x: 168 * num,
					y: getApp().phoneSystem == 'iOS' ? 300 * num : 301 * num,
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
					y: 304 * num,
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
					y: (300 + tagHeight) * num,
					style: {
						width: (this.drawImage.measureWidth(that.data.shop.tag2, '12px PingFang SC') + 28) * num,
						height: tag2len >= 1 ? 20 * num : 0,
						fill: '#FFF1EB'
					}
				},
				{
					type: 'text',
					x: 155 * num,
					y: getApp().phoneSystem == 'iOS' ? (300 + tagHeight) * num : (301 + tagHeight) * num,
					text: tag2,
					style: {
						width: (this.drawImage.measureWidth(tag2, '12px PingFang SC') + 10) * num,
						color: '#FF6D26',
						fontSize: 12 * num,
						lineClamp: tag2len > 13 ? 1 : 2
					}
				},
				{
					type: 'text',
					x: 40 * num,
					y: 408 * num,
					text: that.data.tuan.name,
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
					text: '原价￥' + that.data.tuan.originPriceStr,
					style: {
						width:
							this.drawImage.measureWidth('原价￥' + that.data.tuan.originPriceStr, '12px PingFang SC') + 10,
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
						width: this.drawImage.measureWidth('原价￥' + that.data.tuan.originPriceStr, '12px PingFang SC'),
						stroke: '#999'
					}
				},
				{
					type: 'text',
					x:
						(40 + this.drawImage.measureWidth('原价￥' + that.data.tuan.originPriceStr, '14px PingFang SC')) *
						num,
					y: 437 * num,
					text: '团购价￥' + that.data.tuan.priceStr,
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
					text: '长按图片，前往小程序参加',
					style: {
						width: 200 * num,
						color: '#242627',
						fontSize: 12 * num
					}
				},
				{
					type: 'image',
					x: 255 * num,
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
					url: 'http://cdn.classx.cn/tandian/userapp/res/images/canvas_bottom_tuan.png',
					style: {
						width: 375 * num,
						height: 166 * num
					}
				},
				{
					type: 'text',
					x: 0 * num,
					y: 521 * num,
					text: '还有更多团购活动',
					style: {
						width: 375 * num,
						color: '#242627',
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
		let that = this;
		that.setData({
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
	}
});
