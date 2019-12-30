Page({
	/**
     * 页面的初始数据
     */
	data: {
		session: null,
		user: null
	},

	/**
     * 生命周期函数--监听页面加载
     */
	onLoad: function(options) {
		let that = this;
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
			url: '/userapp/master/load',
			data: {},
			method: 'POST',
			success: function(res) {
				let user = res.data.user;
				that.setData({
					session: that.data.session,
					user: user || null,
					shareby: that.data.shareby || (user.shareby ? user.shareby._id : null)
				});
				if (cb) cb();
			}
		});
	},

	/**
     * 页面相关事件处理函数--监听用户下拉动作
     */
	onPullDownRefresh: function() {
		this.loadData(function() {
			wx.stopPullDownRefresh();
		});
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
		let append = '&shareby=' + that.data.shareby;
		let path = '/pages/main/master?shareby=' + that.data.shareby;
		let title = '探店达人邀请';
		return {
			title: title,
			path: path
		};
	},

	pay: function(e) {
		let that = this;
		if (that.data.loading || that.data.disagree) return;
		that.data.loading = true;
		wx.showLoading({
			title: ''
		});
		getApp().request({
			url: '/userapp/master/prepay',
			data: {
				itemType: 'master',
				shareby: that.data.shareby
			},
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
			url: '/userapp/master/paid',
			data: {
				orderId: that.data.order._id
			},
			method: 'POST',
			success: function(res) {
				that.data.loading = false;
				wx.hideLoading();
				if (res.data.success) {
					getApp().dataChanged = true;
					wx.showToast({
						title: '支付成功',
						icon: 'none'
					});
					that.loadData();
				}
			}
		});
	}
});
