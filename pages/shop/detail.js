const TimeUtil = require('../../utils/TimeUtil.js');
const NumberUtil = require('../../utils/NumberUtil.js');
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
		},
		swiperIndex: 1,
		navList: [
			{ name: '优惠', color: '#242627' },
			{ name: '评价', color: '#242627' },
			{ name: '详情', color: '#242627' }
		],
		navIndex: 0,
		circleStyle: {
			headimg: 'width: 75rpx;height: 75rpx;border-radius: 100%'
		}
	},

	/**
     * 生命周期函数--监听页面加载
     */
	onLoad: function(options) {
		let that = this;
		that.data.shopId = options.shopId;
		that.data.fromCommentId = options.fromCommentId;
		that.data.userdakaId = options.userdakaId;
	},
	onPullDownRefresh: function() {
		if (this.data.user) {
			this.loadData(function() {
				wx.stopPullDownRefresh();
			});
		} else {
			wx.stopPullDownRefresh();
		}
	},
	onReachBottom() {},

	onReady() {
		let that = this;
		getApp().loadSession(function(session) {
			that.data.session = session;
			that.loadData(function() {
				if (that.data.userdakaId) {
					getApp().request({
						url: '/userapp/daka/visit',
						data: { userdakaId: that.data.userdakaId },
						method: 'POST'
					});
				}
			});
		});
	},

	onPageScroll(e) {
		let that = this;
		if (that.data.tabHeight0 && that.data.tabHeight1 && that.data.tabHeight2) {
			if (e.scrollTop > that.data.tabHeight0) {
				wx.setNavigationBarColor({
					frontColor: '#000000',
					backgroundColor: '#fafafa'
				});
				wx.setNavigationBarTitle({
					title: that.data.shop.name
				});
				wx.setBackgroundColor({
					backgroundColor: '#fafafa' // 窗口的背景色为白色
				});
			} else {
				wx.setNavigationBarColor({
					frontColor: '#000000',
					backgroundColor: that.data.shop.coverRGB ? '#' + that.data.shop.coverRGB : '#ffffff'
				});
				wx.setBackgroundColor({
					backgroundColor: that.data.shop.coverRGB ? '#' + that.data.shop.coverRGB : '#ffffff' // 窗口的背景色为白色
				});
				wx.setNavigationBarTitle({
					title: ''
				});
			}
			if (e.scrollTop > that.data.tabHeight0 && e.scrollTop < that.data.tabHeight1) {
				that.setData({ navIndex: 0 });
			} else if (e.scrollTop > that.data.tabHeight1 && e.scrollTop < that.data.tabHeight2) {
				that.setData({ navIndex: 1 });
			} else if (e.scrollTop > that.data.tabHeight2) {
				that.setData({ navIndex: 2 });
			}
		}
	},

	/**
     * 用户点击右上角分享
     */

	onShareAppMessage: function() {},

	loadData: function(cb) {
		let that = this;
		getApp().request({
			url: '/userapp/shop/detail/load',
			data: {
				shopId: that.data.shopId,
				fromCommentId: that.data.fromCommentId,
				query: that.data.query
			},
			method: 'POST',
			success: function(res) {
				let shop = res.data.shop;
				let comments = res.data.comments || [];
				let copyComments = JSON.parse(JSON.stringify(comments));

				let publicPics = shop.publicPics || [];
				let caiPics = shop.caiPics || [];
				let shopImgs = [ { url: shop.cover }, ...publicPics, ...caiPics ];
				let session = that.data.session;
				let coupons = res.data.coupons;

				let { bow, gou, tuan, miao } = res.data.box;

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

				if (!shop.detailHTML && !shop.detailImage) {
					that.data.navList[1].color = '#999';
				}
				if (!copyComments.length) {
					that.data.navList[2].color = '#999';
				}
				for (let comment of copyComments) {
					comment.createTimeStr = TimeUtil.orderTime(comment.createTime);
				}
				if (copyComments.length > 5) {
					copyComments.length = 5;
				}

				if (bow) {
					bow.originPriceStr = Number(bow.originPrice || 0).toFixed(2);
					if (new Date(bow.startTime).getTime() > new Date().getTime()) {
						bow.status = 0;
					} else {
						bow.status = 1;
					}
				}

				if (gou) {
					gou.priceStr = Number(gou.price).toFixed(2);
				}
				if (tuan) {
					tuan.originPriceStr = Number(tuan.originPrice || 0).toFixed(2);
					tuan.priceStr = Number(tuan.price || 0).toFixed(2);
					tuan.planpriceStr = Number(tuan.planprice || 0).toFixed(2);
					tuan.minusPrice = Number(tuan.price || 0) - Number(tuan.planprice || 0);
				}
				if (miao) {
					miao.originPriceStr = Number(miao.originPrice || 0).toFixed(2);
					miao.priceStr = Number(miao.price || 0).toFixed(2);
					if (new Date(miao.endTime).getTime() < new Date().getTime()) {
						miao.status = 2;
					} else if (new Date(miao.startTime).getTime() < new Date().getTime()) {
						miao.status = 1;
						miao.endTimeStr = TimeUtil.orderTime(miao.endTime);
					} else {
						miao.status = 0;
						miao.startTimeStr = TimeUtil.orderTime(miao.startTime);
					}
				}

				let imgArr = [];
				shopImgs.map((item) => {
					imgArr.push(item.url);
				});
				wx.setNavigationBarColor({
					frontColor: '#000000',
					backgroundColor: shop.coverRGB ? '#' + shop.coverRGB : '#ffffff'
				});
				wx.setBackgroundColor({
					backgroundColor: shop.coverRGB ? '#' + shop.coverRGB : '#ffffff'
				});

				that.setData(
					{
						publicPics,
						caiPics,
						shopImgs,
						shop,
						copyComments,
						bow,
						gou,
						tuan,
						miao,
						coupons,
						session,
						comments,
						imgArr,
						navList: that.data.navList
					},
					() => {
						that.getAllRects();
					}
				);
				if (cb) cb();
			}
		});
	},
	onSwiperCurrent(e) {
		this.setData({
			swiperIndex: e.detail.current + 1
		});
	},
	onShowSwiperImg(e) {
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
	toLicense(e) {
		let license = e.currentTarget.dataset.license;
		wx.navigateTo({
			url: '/pages/main/license?license=' + license
		});
	},
	onCallShop() {
		let that = this;
		wx.makePhoneCall({
			phoneNumber: that.data.shop.contact
		});
	},
	onChangeNav(e) {
		let that = this;
		let index = e.currentTarget.dataset.index;
		wx.pageScrollTo({
			scrollTop: that.data['tabHeight' + index] + 2
		});
	},
	onShopPass() {
		this.setData({
			passModal: true
		});
	},
	hidePassModal() {
		this.setData({
			passModal: false
		});
	},
	onShowAddrList() {
		this.setData({
			showAddrListModal: true
		});
	},
	hideAddrListModal() {
		this.setData({
			showAddrListModal: false
		});
	},

	toCoupon(e) {
		let item = e.currentTarget.dataset.item;
		wx.navigateTo({
			url: '/pages/coupon/detail?couponId=' + item._id
		});
	},
	toBow(e) {
		let item = e.currentTarget.dataset.item;
		wx.navigateTo({
			url: '/pages/bow/detail?bowId=' + item._id
		});
	},
	toGou(e) {
		let item = e.currentTarget.dataset.item;
		wx.navigateTo({
			url: '/pages/gou/detail?gouId=' + item._id
		});
	},
	toTuan(e) {
		let item = e.currentTarget.dataset.item;
		wx.navigateTo({
			url: '/pages/tuan/detail?tuanId=' + item._id
		});
	},
	toMiao(e) {
		let item = e.currentTarget.dataset.item;
		wx.navigateTo({
			url: '/pages/miao/detail?miaoId=' + item._id
		});
	},
	toComments() {
		let that = this;
		wx.navigateTo({
			url: '/pages/main/commentlist?shopId=' + this.data.shop._id
		});
	},
	previewImage(e) {
		let that = this;
		let image = e.currentTarget.dataset.image;

		wx.previewImage({
			current: image,
			urls: that.data.imgArr
		});
	},
	getAllRects(cb) {
		let that = this;
		wx
			.createSelectorQuery()
			.in(this)
			.selectAll('.navbox')
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
						rect2.forEach((rect, index) => {
							that.data['tabHeight' + index] = rect.top - height;
						});
					})
					.exec();
			})
			.exec();
	}
});
