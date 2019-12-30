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
		let that = this;
		if (options.selection) {
			that.data.selection = true;
		}
		if (options.bowId) {
			that.data.bowId = options.bowId;
		}

		getApp().loadSession(function(session) {
			that.data.session = session;
			that.loadData();
		});
	},

	loadData: function(cb) {
		let that = this;
		getApp().request({
			url: '/userapp/bow/userbows/load',
			data: { bowId: that.data.bowId, query: that.data.query },
			method: 'POST',
			success: function(res) {
				let data = {
					loading: false,
					loadingmore: false
				};
				data.userbows = res.data.userbows || [];
				if (that.data.query.from) {
					that.data.query.from = null;
					data.userbows = that.data.userbows.concat(data.userbows);
				} else {
					data.session = that.data.session;
					data.user = res.data.user;
				}
				for (let userbow of data.userbows) {
					userbow.createTimeStr = TimeUtil.orderTime(userbow.createTime);
				}

				wx.setNavigationBarTitle({
					title: '抽奖记录'
				});
				data.nomore = res.data.userbows && res.data.userbows.length < that.data.query.size ? true : false;
				that.setData(data);
				if (cb) cb();
			}
		});
	},

	/**
     * 页面相关事件处理函数--监听用户下拉动作
     */
	onPullDownRefresh: function() {
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
		if (that.data.nomore || that.data.loadingmore || !that.data.session || that.data.userbows.length == 0) {
			return;
		}
		that.data.query.from = that.data.userbows[that.data.userbows.length - 1].createTime;
		that.setData({
			loadingmore: true
		});
		that.loadData();
	},

	/**
     * 用户点击右上角分享
     */
	onShareAppMessage: function() {},

	keywordsChanged: function(e) {
		let that = this;
		// if (!that.data.searching) {
		//     that.startSearch()
		// }
		// that.setData({
		//     'query.keywords': e.detail.value
		// })
		that.data.query.keywords = e.detail.value;
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
		// that.endSearch()
		that.setData({
			'query.keywords': that.data.query.keywords
		});
		that.loadData();
	},

	copy: function(e) {
		let that = this;
		let content = e.currentTarget.dataset.content;
		wx.setClipboardData({
			data: content,
			success(res) {
				wx.showToast({
					title: '_id已复制',
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

	showMoreCodes: function(e) {
		let that = this;
		let item = e.currentTarget.dataset.item;
		that.setData({ moreCodesModal: true, currentItem: item });
	},

	hideMoreCodes: function() {
		let that = this;
		that.setData({ moreCodesModal: false });
	}
});
