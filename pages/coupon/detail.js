const TimeUtil = require('../../utils/TimeUtil.js');
import Wxml2Canvas from 'wxml2canvas';
Page({
	/**
     * 页面的初始数据
     */
	data: {
		session: null,
		user: null,
		zhuanForm: { price: 0, priceStr: '0.00' },
		imgs: []
	},

	/**
     * 生命周期函数--监听页面加载
     */
	onLoad: function(options) {
		let that = this;
		if (options.couponId) {
			that.data.couponId = options.couponId;
		}
		if (options.usercouponId) {
			that.data.usercouponId = options.usercouponId;
		}
		getApp().couponChanged = null;

		if (options.shareby) {
			getApp().shareby = options.shareby;
		}
		getApp().loadSession(function(session) {
			that.data.session = session;
			that.loadData();
		});
	},

	loadData: function(cb) {
		let that = this;
		getApp().request({
			url: '/userapp/coupon/detail/load',
			data: { couponId: that.data.couponId, usercouponId: that.data.usercouponId },
			method: 'POST',
			success: function(res) {
				let user = res.data.user;
				let coupon = res.data.coupon;
				let shop = res.data.shop;
				let order = res.data.order;

				coupon.valueStr = Number(coupon.value || 0).toFixed(2);
				coupon.discountStr = (coupon.discount / 10).toFixed(1);
				let usercoupon = res.data.usercoupon;
				if (usercoupon) {
					that.data.usercouponId = usercoupon._id;
					if (usercoupon.expiryTime) {
						usercoupon.expiryTimeStr = TimeUtil.orderTime(usercoupon.expiryTime);
						if (new Date(usercoupon.expiryTime).getTime() < new Date().getTime()) {
							usercoupon.expired = true;
						}
					}
					if (usercoupon.used) {
						usercoupon.useTimeStr = TimeUtil.orderTime(usercoupon.useTime);
					}
					if (coupon.next) {
						usercoupon.startTime = new Date(new Date(usercoupon.createTime) + 1000 * 60 * 60 * 24);
						if (usercoupon.startTime.getTime() > new Date().getTime()) {
							usercoupon.neednext = true;
							usercoupon.startTimeStr = TimeUtil.orderTime(usercoupon.startTime);
						}
					}
					usercoupon.createTimeStr = TimeUtil.toYYMMDD(usercoupon.createTime);
					if (usercoupon.startTime) {
						usercoupon.startTimeStr = TimeUtil.orderTime(usercoupon.startTime);
					}
				}
				if (coupon.expiryType == 'time') {
					coupon.expiryTimeStr = TimeUtil.orderTime(coupon.expiryTime) + '前有效';
				} else if (coupon.expiryType == 'day') {
					coupon.expiryTimeStr = '领取后' + coupon.expiryDay + '天内有效';
				} else {
					coupon.expiryTimeStr = '长期有效';
				}
				if (order) {
					order.priceStr = Number(order.price).toFixed(2);
					if (order.refund) {
						usercoupon.refund = true;
					}
				}
				that.data.couponId = res.data.coupon._id;
				if (usercoupon && usercoupon.zhuan) {
					if (usercoupon.zhuan.price == 0) {
						usercoupon.zhuan.priceStr = '免费';
					} else {
						usercoupon.zhuan.priceStr = Number(usercoupon.zhuan.price).toFixed(2) + '元';
					}
				}
				that.setData({
					session: that.data.session,
					user,
					coupon,
					usercoupon,
					shop,
					order,
					limited: res.data.limited || false
				});
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
		let imageUrl = '/res/images/logo1.png';
		let append = '';
		if (that.data.usercoupon) {
			append += '&usercouponId=' + that.data.usercoupon._id;
		}
		if (that.data.user) {
			append += '&shareby=' + that.data.user._id;
		}
		let path = '/pages/main/index?couponId=' + that.data.coupon._id + append;
		let title = '分享一张券给你';
		return {
			title: title,
			path: path,
			imageUrl: imageUrl
		};
	},

	onShow: function() {
		let that = this;
		if (getApp().toast) {
			wx.showToast({
				title: getApp().toast,
				icon: 'none'
			});
			getApp().toast = null;
		}
		if (getApp().couponChanged) {
			getApp().couponChanged = null;
			that.loadData();
		}
	},

	authThenHelp: function(e) {
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
					that.toHelp();
				}
			});
		} else {
			that.data.loading = false;
			wx.hideLoading();
		}
	},
	toCreate: function() {
		let that = this;
		that.kan();
	},
	authThenJoin: function(e) {
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
					that.toCreate();
				}
			});
		} else {
			that.data.loading = false;
			wx.hideLoading();
		}
	},

	toHelp: function() {
		let that = this;
		that.kan();
	},
	toIndex: function() {
		let that = this;
		wx.switchTab({
			url: '/pages/main/index'
		});
	},
	toMe: function() {
		let that = this;
		wx.switchTab({
			url: '/pages/main/me'
		});
	},
	doNothing: function() {
		let that = this;
	},
	getQrcode: function(cb) {
		let that = this;
		getApp().request({
			url: '/userapp/coupon/detail/getQrcode',
			data: { usercouponId: that.data.usercoupon._id },
			method: 'POST',
			success: function(res) {
				if (res.data.success) {
					that.setData({ 'usercoupon.qrcode': res.data.qrcode });
				}
				if (cb) cb();
			}
		});
	},
	toShop: function() {
		let that = this;
		wx.navigateTo({
			url: '/pages/shop/detail?shopId=' + that.data.coupon.shop._id
		});
	},
	callShop: function() {
		let that = this;
		wx.makePhoneCall({
			phoneNumber: that.data.shop.contact
		});
	},
	openLocation: function() {
		let that = this;
		wx.openLocation({
			longitude: that.data.shop.location[0],
			latitude: that.data.shop.location[1],
			name: that.data.shop.name,
			address: that.data.shop.address
		});
	},
	getCoupon: function() {
		let that = this;
		if (that.data.loading) return;
		that.data.loading = true;
		wx.showLoading({ title: '' });
		getApp().request({
			url: '/userapp/main/coupon/get',
			data: { couponId: that.data.coupon._id, from: { page: '/pages/coupon/detail' } },
			method: 'POST',
			success: function(res) {
				if (res.data.success) {
					that.loadData(function() {
						wx.hideLoading();
						that.data.loading = false;
						getApp().toast = '领取成功';
						wx.redirectTo({
							url:
								'/pages/coupon/detail?couponId=' +
								that.data.coupon._id +
								'&usercouponId=' +
								res.data.usercouponId
						});
					});
				} else {
					wx.hideLoading();
					that.data.loading = false;
				}
			}
		});
	},
	toUse: function() {
		let that = this;
		that.setData({ qrcodeModal: true });
		if (that.data.usercoupon && !that.data.usercoupon.qrcode) {
			that.getQrcode();
		}
	},
	hideQrcodeModal: function() {
		let that = this;
		that.setData({ qrcodeModal: false });
		let append = '';
		getApp().request({
			url: '/userapp/coupon/detail/checkStatus',
			data: { usercouponId: that.data.usercouponId },
			method: 'POST',
			success: function(res) {
				if (res.data.success) {
					if (that.data.usercoupon && that.data.usercoupon.gou) {
						wx.redirectTo({
							url:
								'/pages/main/examine?shopId=' +
								that.data.coupon.shop._id +
								'&usercouponId=' +
								that.data.usercouponId
						});
					} else {
						wx.redirectTo({
							url:
								'/pages/main/comment?shopId=' +
								that.data.coupon.shop._id +
								'&usercouponId=' +
								that.data.usercouponId
						});
					}
				}
			}
		});
	},
	showShopModal: function() {
		let that = this;
		that.setData({ shopModal: true });
	},
	hideShopModal: function() {
		let that = this;
		that.setData({ shopModal: false });
	},
	saveToken: function(e) {
		let that = this;
		let formId = e.detail.formId;
		let value = '';
		getApp().request({
			url: '/push/token/save',
			data: {
				formId: formId,
				type: '在线领红包'
			},
			method: 'POST'
		});
	},
	toSubshops: function() {
		let that = this;
		wx.navigateTo({
			url: '/pages/main/subshops?shopId=' + that.data.shop._id
		});
	},
	toRefund: function() {
		let that = this;
		if (that.data.loading) return;
		that.data.loading = true;
		wx.showModal({
			title: '提示',
			content: '是否确认退款',
			success(res) {
				if (res.confirm) {
					getApp().request({
						url: '/userapp/main/refund',
						data: { orderId: that.data.order._id },
						method: 'POST',
						success: function(res) {
							that.data.loading = false;
							wx.showToast({
								title: '退款成功，款项将原路返还',
								icon: 'none'
							});
							that.loadData();
						}
					});
				} else if (res.cancel) {
					console.log('用户点击取消');
				}
			}
		});
	},
	handleShowFindcoupon() {
		this.setData({
			findModal: true
		});
	},
	hideFindModal() {
		this.setData({
			findModal: false
		});
	},
	toZhuanrang: function() {
		let that = this;
		that.setData({ zhuanModal: true });
	},
	hideZhuanModal: function() {
		let that = this;
		that.setData({ zhuanModal: false });
	},
	priceFocus: function() {
		let that = this;
		if (that.data.zhuanForm.price == 0) {
			that.setData({ 'zhuanForm.priceStr': '' });
		}
	},
	priceChanged: function(e) {
		let that = this;
		that.setData({ 'zhuanForm.price': e.detail.value });
	},
	priceBlur: function(e) {
		let that = this;
		if (that.data.zhuanForm.price == '' || isNaN(Number(that.data.zhuanForm.price))) {
			that.data.zhuanForm.price = 0;
		}
		that.setData({ 'zhuanForm.priceStr': Number(that.data.zhuanForm.price).toFixed(2) });
	},
	zhuanConfirm: function() {
		let that = this;
		if (that.data.zhuanForm.price > 100) {
			wx.showToast({
				title: '不能超过100元',
				icon: 'none'
			});
			return;
		}
		if (that.data.loading) return;
		that.data.loading = true;
		wx.showLoading({ title: '' });
		getApp().request({
			url: '/userapp/coupon/zhuan',
			data: {
				usercouponId: that.data.usercouponId || that.data.usercoupon._id,
				form: that.data.zhuanForm
			},
			method: 'POST',
			success: function(res) {
				wx.hideLoading();
				that.data.loading = false;
				if (res.data.success) {
					that.setData({ zhuanModal: false });
					that.loadData();
					wx.showToast({
						title: '截图分享给朋友即可',
						icon: 'none'
					});
				}
			}
		});
	},
	toBuy: function() {
		let that = this;
		that.buy();
	},
	authThenToBuy: function(e) {
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
					that.toBuy();
				}
			});
		} else {
			that.data.loading = false;
			wx.hideLoading();
		}
	},
	buy: function() {
		let that = this;
		that.pay();
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
				itemType: 'sharecoupon',
				itemId: that.data.usercoupon._id
			},
			method: 'POST',
			success: function(res) {
				wx.hideLoading();
				if (res.data.success) {
					that.data.order = res.data.order;
					if (that.data.order.price == 0) {
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
	paid: function() {
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
					wx.vibrateShort();
					that.loadData();
					that.setData({
						buyModal: false,
						paidModal: true,
						newcoupon: res.data.usercoupon
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
	hidePaidModal: function() {
		let that = this;
		that.setData({ paidModal: false });
	},
	hideFullModal: function() {
		let that = this;
		that.setData({ fullModal: false });
	},
	toNewUserCoupon: function() {
		let that = this;
		wx.navigateTo({
			url: '/pages/coupon/detail?usercouponId=' + that.data.newcoupon._id
		});
	},
	toCancelZhuan: function() {
		let that = this;
		wx.showActionSheet({
			itemList: [ '取消转让' ],
			success: function(r) {
				if (r.tapIndex == 0) {
					getApp().request({
						url: '/userapp/coupon/zhuan/cancel',
						data: { usercouponId: that.data.usercouponId || that.data.usercoupon._id },
						method: 'POST',
						success: function(res) {
							if (res.data.success) {
								that.loadData();
							}
						}
					});
				}
			}
		});
	},
	toComment: function() {
		let that = this;
		if (that.data.usercoupon.comment) {
			wx.navigateTo({
				url: '/pages/main/comments'
			});
		} else {
			wx.navigateTo({
				url: '/pages/main/comment?shopId=' + that.data.shop._id + '&usercouponId=' + that.data.usercoupon._id
			});
		}
	},
	callShop: function(e) {
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
	handleShowQuestion() {
		this.setData({
			questionModal: true
		});
	},
	hideQuestionModal() {
		this.setData({
			questionModal: false
		});
	},
	handleShowContact() {
		this.setData({
			showContactModal: true,
			qrcodeModal: false,
			questionModal: false
		});
	},
	hideContactModal() {
		this.setData({
			showContactModal: false,
			questionModal: false
		});
	},
	handlePreviewImg(e) {
		let that = this;
		let img = e.currentTarget.dataset.image;
		wx.previewImage({
			current: img, // 当前显示图片的http链接
			urls: [ img ] // 需要预览的图片http链接列表
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
	onShowShareModal() {
		this.setData(
			{
				shareModal: true
			},
			() => {
				this.drawCustomShareImage();
			}
		);
	},
	hideShareModal() {
		this.setData({
			shareModal: false
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
				let imgs = that.data.imgs;
				imgs.push(url);
				that.setData({
					imgs,
					tempFilePath: url
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
					url: 'http://cdn.classx.cn/tandian/userapp/res/images/share_bow.png',
					style: {
						width: 375 * num,
						height: 556 * num
					}
				},
				{
					type: 'text',
					x: 30 * num,
					y: 277 * num,
					text: '中奖啦！',
					style: {
						color: '#FFFFFF',
						fontSize: 30 * num,
						width: 345 * num,
						textAlign: 'center'
					}
				},
				{
					type: 'text',
					x: 160 * num,
					y: 340 * num,
					text: '恭喜获得',
					style: {
						color: '#FFFFFF',
						fontSize: 14 * num,
						width: 100 * num
					}
				},
				{
					type: 'text',
					x: 15 * num,
					y: 372 * num,
					text: that.data.coupon.name,
					style: {
						color: '#FFFFFF',
						fontSize: 20 * num,
						textAlign: 'center',
						width: 345 * num,
						lineClamp: 1
					}
				},
				{
					type: 'text',
					x: 15 * num,
					y: 406 * num,
					text: that.data.shop.name,
					style: {
						color: '#FFFFFF',
						fontSize: 14 * num,
						textAlign: 'center',
						width: 345 * num,
						lineClamp: 1
					}
				},
				{
					type: 'text',
					x: 15 * num,
					y: 434 * num,
					text: that.data.usercoupon.createTimeStr,
					style: {
						color: '#FFFFFF',
						fontSize: 14 * num,
						textAlign: 'center',
						width: 345 * num,
						lineClamp: 1
					}
				},
				{
					type: 'rect',
					x: 0,
					y: 556 * num,
					style: {
						width: 375 * num,
						height: 111 * num,
						fill: '#ffffff'
					}
				},
				{
					type: 'text',
					x: 36 * num,
					y: 591 * num,
					text: '探店大师',
					style: {
						color: '#242627',
						fontSize: 16 * num,
						width: 100 * num,
						lineClamp: 1
					}
				},
				{
					type: 'text',
					x: 36 * num,
					y: 616 * num,
					text: '让更多人体验更多好店',
					style: {
						color: '#242627',
						fontSize: 16 * num,
						width: 200 * num
					}
				},
				{
					type: 'image',
					x: 270 * num,
					y: 569 * num,
					url: 'http://cdn.classx.cn/tandian/userapp/res/images/wxappqrcode.png',
					style: {
						width: 85 * num,
						height: 85 * num
					}
				}
			]
		};
		this.drawImage.draw(data);
	}
});
